import { defs, tiny } from './examples/common.js';
import { Shape_From_File } from "./examples/obj-file-demo.js";
import { Body, Simulation } from "./examples/collisions-demo.js";
import {
    Color_Phong_Shader, Shadow_Textured_Phong_Shader,
    Depth_Texture_Shader_2D, Buffered_Texture, LIGHT_DEPTH_TEX_SIZE
} from './examples/shadow-demo-shaders.js'
import { Text_Line } from "./examples/text-demo.js";

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Texture, Scene
} = tiny;

export class MarshmallowMadness extends Simulation {
    constructor() {
        // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        super();

        // At the beginning of our program, load one of each of these shape definitions onto the GPU.
        this.shapes = {
            box: new defs.Cube(),
            mug_body: new Shape_From_File("assets/cup.obj"),
            cup: new defs.Capped_Cylinder(30, 30),
            marshmallow: new defs.Rounded_Capped_Cylinder(10, 10),
            s_marshmallow: new defs.Rounded_Capped_Cylinder(10, 10),
            sphere: new defs.Subdivision_Sphere(6),
            table: new defs.Cube(),
            info_strings: new Text_Line(100),
        };

        // *** Materials
        this.materials = {
            marsh: new Material(new Shadow_Textured_Phong_Shader(1),
                {
                    ambient: .5,
                    diffusivity: 1,
                    specularity: 0.5,
                    color: hex_color("#ffffff"),
                    light_depth_texture: null
                }),
            mug_body: new Material(new Shadow_Textured_Phong_Shader(1),
                {
                    color: hex_color('#fc6d87'),
                    ambient: .4,
                    diffusivity: .5,
                    specularity: .5,
                     color_texture: new Texture("assets/peppermint.jpeg"),
                    light_depth_texture: null
                }),
            floor: new Material(new Shadow_Textured_Phong_Shader(1),
                {
                    color: color(0.5, 0.5, 0.5, 1),
                    ambient: .3,
                    diffusivity: 0.6,
                    specularity: 0.4,
                    smoothness: 64,
                     color_texture: new Texture("assets/woodsigned2.jpeg"),
                    light_depth_texture: null
                }),
            pure: new Material(new Color_Phong_Shader(), {
            }),
            light_src: new Material(new Shadow_Textured_Phong_Shader(1),
                {
                    color: color(.5, .5, .5, 1),
                    ambient: .4,
                    diffusivity: 0.6,
                    specularity: 0.4,
                    color_texture: new Texture("assets/discoball.jpeg"),
                    light_depth_texture:null
                }),
            depth_tex: new Material(new Depth_Texture_Shader_2D(),
                {
                    color: color(0, 0, .0, 1),
                    ambient: 1,
                    diffusivity: 0,
                    specularity: 0,
                    texture: null
                }),
            info_strings: new Material(new defs.Phong_Shader(),
                {
                    ambient: .5,
                    diffusivity: 1,
                    color: hex_color("#ffffff")
                }),
            info_strings_image: new Material(new defs.Textured_Phong(1),
                {
                    ambient: 1,
                    iffusivity: 0,
                    specularity: 0,
                    texture: new Texture("assets/text.png")
                }),
        };



        this.max_velocity = 30;
        this.horizontal_angle = Math.PI / 2; // angle right of -z axis (on xz plane)
        this.info_strings_transform = Mat4.identity()
            .times(Mat4.translation(...vec3(-13, 11, 50)))
            .times(Mat4.rotation(-Math.PI / 15, 1, 0, 0))
            .times(Mat4.scale(.25, .25, 1));

        this.info_strings_transform_2 = Mat4.identity()
            .times(Mat4.translation(...vec3(13, 11, -50)))
            .times(Mat4.rotation(Math.PI / 15, 1, 0, 0))
            .times(Mat4.scale(.25, .25, 1))

        this.reset_marshmallow();
        this.initialize_info_strings();

        this.current_player = 0;
        this.players = []

        var p1 = {};
        p1.camera = Mat4.look_at(vec3(0, 9, -20), vec3(0, 10, 0), vec3(0, 1, 0)).times(Mat4.rotation(Math.PI, 0, 1, 0));
        p1.mugs = [];
        for (let i = 0; i < 10; i++) {
            var a = {};
            a.colliding = false;
            a.collision = false;
            a.x = 0;
            a.y = 0;
            a.num = i;
            a.center = [0., 0., 0.];
            p1.mugs.push(a);
        }

        this.players.push(p1);

        var p2 = {};
        p2.camera = Mat4.look_at(vec3(0, 10, -70), vec3(0, -10, 0), vec3(0, 1, 0));

        p2.mugs = [];
        for (let i = 0; i < 10; i++) {
            var a = {};
            a.colliding = false;
            a.collision = false;
            a.x = 0;
            a.y = 0;
            a.num = i;
            a.center = [0., 0., 0.];
            p2.mugs.push(a);
        }

        this.players.push(p2);


        this.initial_camera_location = Mat4.look_at(vec3(0, 10, 70), vec3(0, -10, 0), vec3(0, 1, 0));

        this.init_ok = false;
    }

    make_control_panel() {
        this.key_triggered_button("Fire shot", ["Shift"], () => {
            this.shot_fired = true;
        });
        this.new_line();
        this.key_triggered_button("Increase power", ["i"], () => {
            if (this.shot_fired != true) {
                this.current_velocity += 1;
                this.initialize_info_strings();
            }
        });
        this.new_line();
        this.key_triggered_button("Decrease power", ["k"], () => {
            if (this.shot_fired != true && this.current_velocity > 0) {
                this.current_velocity -= 0.5;
                this.initialize_info_strings();
            }
        });
        this.new_line();
        this.key_triggered_button("Aim left", ["j"], () => {
            if (this.shot_fired != true && this.horizontal_angle < Math.PI) {
                this.horizontal_angle += 0.5 / 180 * Math.PI;
                this.initialize_info_strings();
            }
        });
        this.new_line();
        this.key_triggered_button("Aim right", ["l"], () => {
            if (this.shot_fired != true && this.horizontal_angle > 0) {
                this.horizontal_angle -= 0.5 / 180 * Math.PI;
                this.initialize_info_strings();
            }
        });
        this.new_line();
        this.key_triggered_button("Aim up", ["u"], () => {
            if (this.shot_fired != true && (this.vertical_angle + 5 / 180 * Math.PI) < Math.PI / 2) {
                this.vertical_angle += 5 / 180 * Math.PI;
                this.initialize_info_strings();
            }
        });
        this.new_line();
        this.key_triggered_button("Aim down", ["o"], () => {
            if (this.shot_fired != true && this.vertical_angle > 0) {
                this.vertical_angle -= 5 / 180 * Math.PI;
                this.initialize_info_strings();
            }
        });
        this.new_line();
    };


    texture_buffer_init(gl) {
        // Depth Texture
        this.lightDepthTexture = gl.createTexture();
        // Bind it to TinyGraphics
        this.light_depth_texture = new Buffered_Texture(this.lightDepthTexture);
        this.materials.mug_body.light_depth_texture = this.light_depth_texture;
        this.materials.marsh.light_depth_texture = this.light_depth_texture;
        this.materials.floor.light_depth_texture = this.light_depth_texture;

        this.lightDepthTextureSize = LIGHT_DEPTH_TEX_SIZE;
        gl.bindTexture(gl.TEXTURE_2D, this.lightDepthTexture);
        gl.texImage2D(
            gl.TEXTURE_2D,      // target
            0,                  // mip level
            gl.DEPTH_COMPONENT, // internal format
            this.lightDepthTextureSize,   // width
            this.lightDepthTextureSize,   // height
            0,                  // border
            gl.DEPTH_COMPONENT, // format
            gl.UNSIGNED_INT,    // type
            null);              // data
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);


        // Depth Texture Buffer
        this.lightDepthFramebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.lightDepthFramebuffer);
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,       // target
            gl.DEPTH_ATTACHMENT,  // attachment point
            gl.TEXTURE_2D,        // texture target
            this.lightDepthTexture,         // texture
            0);                   // mip level
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        // create a color texture of the same size as the depth texture
        // see article why this is needed_
        this.unusedTexture = gl.createTexture();

        gl.bindTexture(gl.TEXTURE_2D, this.unusedTexture);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            this.lightDepthTextureSize,
            this.lightDepthTextureSize,
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            null,
        );
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        // attach it to the framebuffer
        this.unusedFramebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.unusedFramebuffer);
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,        // target
            gl.COLOR_ATTACHMENT0,  // attachment point
            gl.TEXTURE_2D,         // texture target
            this.unusedTexture,         // texture
            0);                    // mip level
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    reset_marshmallow() {
        // Initialize variables related to marshmallow and projectile
        this.bodies = [];
        this.current_velocity = 15;
        this.shot_fired = false;
        this.shot_fired_last = false;
        this.vertical_angle = Math.PI / 3; // angle above -z axis (on yz plane)
        this.horizontal_angle = Math.PI / 2; // angle right of -z axis (on xz plane)
        this.bounce = 0;
        this.current_player = this.current_player == 1 ? 0 : 1;
        console.log(this.current_player);
    }

    initialize_info_strings() {
        // Reset info string array to contain up to date values
        this.info_strings = [
            `Power: ${this.current_velocity}`,
            `Horizontal angle: ${((this.horizontal_angle / Math.PI * 180)- 90).toFixed(2) }`,
            `Vertical angle: ${(this.vertical_angle / Math.PI * 180).toFixed(2)}`,
        ]
    }

    update_state(dt) {
        // update_state():  Override the base time-stepping code to say what this particular
        // scene should do to its bodies every frame -- including applying forces.
        // Generate additional moving bodies if there ever aren't enough:

        while (this.bodies.length < 1) {
            let start = this.current_player == 0 ? 50 : -50;
            this.bodies.push(
                new Body(
                    this.shapes.marshmallow,
                    this.materials.marsh,
                    vec3(1, 1, 1.9)
                ).emplace(
                    Mat4.translation(...vec3(0, 0, start)),
                    vec3(0, 0, 0),
                    0,
                )
            )
        }

        // If shot was fired, update velocity and position of marshmallow
        // If marshmallow has collision, reset marshmallow position & power

        let sign = this.current_player == 0 ? 1 : -1;

        if (this.shot_fired) {

            let z_vel = -this.current_velocity * Math.cos(this.vertical_angle) * sign;
            let y_vel = this.current_velocity * Math.sin(this.vertical_angle);
            let x_vel = this.current_velocity * Math.cos(this.horizontal_angle);

            this.current_velocity = Math.pow(
                Math.pow(z_vel, 2) + Math.pow(y_vel, 2),
                0.5
            );
            this.vertical_angle = Math.atan(y_vel / -z_vel);

            for (let b of this.bodies) {
                if (!this.shot_fired_last) {
                    b.linear_velocity[2] = z_vel;
                    b.linear_velocity[1] = y_vel;
                    b.linear_velocity[0] = x_vel;
                }
                // Gravity on Earth, where 1 unit in world space = 1 meter:
                b.linear_velocity[1] += dt * -9.8;

                // Table bounds
                // x:  -20 < x < 20
                // y: > -9
                // z: -40 < z < 40

                if (Math.abs(b.center[0]) < 20 && Math.abs(b.center[2]) < 40) {

                    // Check distance to player's cups
                    if (b.center[1] < -2) {
                        let min = Number.POSITIVE_INFINITY;
                        let mindex = -1;
                        for (const mug of this.players[this.current_player].mugs) {
                            let dx = b.center[0] - mug.center[0];
                            let dz = b.center[2] - mug.center[2];
                            let dist = Math.sqrt(dx * dx + dz * dz);
                            // Ignore cups we have already collided with
                            let havent_collided = true;
                            if (mindex != -1) {
                                havent_collided = !this.players[this.current_player].mugs[mindex].collision
                            }
                            if (dist < min && havent_collided) {
                                min = dist;
                                mindex = mug.num;
                            }
                        }
                        // console.log(min)

                        // If near cups and below lip:
                        if (min < 3. && b.center[1] < -5) {
                            // If it's inside the cup and still relatively highif (b.linear_velocity[1] > 0) {
                            b.linear_velocity[1] *= -.8;
                        }
                        else if (min < 1.5 && b.center[1] > -6) {
                            this.players[this.current_player].mugs[mindex].colliding = true;
                            this.reset_marshmallow();
                            this.initialize_info_strings();
                        }
                        // Otherwise if it's near the cup and relatively high, but 
                        else if (min < 2 && b.center[1] > -6) {
                            b.linear_velocity[1] *= -.8;
                            this.bounce += 1;
                        }

                    }
                    // Otherwise, check normal bounce logic
                    if (b.center[1] < -9 && b.linear_velocity[1] < 0) {
                        b.linear_velocity[1] *= -.8;
                        this.bounce += 1;
                    }
                    if (this.bounce > 2) {
                        this.reset_marshmallow();
                        this.initialize_info_strings();
                    }


                } else if (b.center[1] < -40) {
                    this.reset_marshmallow();
                    this.initialize_info_strings();
                }
                b.advance(dt);
            }
            // Delete bodies that stop or stray too far away:
            //             this.bodies = this.bodies.filter(b => b.center.norm() < 50 && b.linear_velocity.norm() > 2);
        }

        this.shot_fired_last = this.shot_fired;
    }

    draw_helper(context, program_state, x, y, z) {
        let axis_transform = Mat4.identity().times(Mat4.translation(x, y, z));
        this.shapes.box.draw(context, program_state, axis_transform.times(Mat4.scale(10, .1, .1)), this.materials.marsh.override({ color: color(1, 0, 0, 1) }));
        this.shapes.box.draw(context, program_state, axis_transform.times(Mat4.scale(.1, 10, .1)), this.materials.marsh.override({ color: color(0, 1, 0, 1) }));
        this.shapes.box.draw(context, program_state, axis_transform.times(Mat4.scale(.1, .1, 10)), this.materials.marsh.override({ color: color(0, 0, 1, 1) }));
    }

    render_scene(context, program_state, shadow_pass, draw_light_source = false, draw_shadow = false) {
        // shadow_pass: true if this is the second pass that draw the shadow.
        // draw_light_source: true if we want to draw the light source.
        // draw_shadow: true if we want to draw the shadow

        let light_position = this.light_position;
        let light_color = this.light_color;
        const t = program_state.animation_time;

        program_state.draw_shadow = draw_shadow;

        if (draw_light_source && shadow_pass) {
            this.shapes.sphere.draw(context, program_state,
                Mat4.translation(light_position[0], light_position[1], light_position[2]).times(Mat4.scale(4, 4, 4)),
                this.materials.light_src.override({ color: light_color })
            );
        }

        let table_scale = Mat4.identity().times(
            Mat4.translation(0, -10, 0)).times(
                Mat4.rotation(Math.PI / 2.0, 1, 0, 0)).times(
                    Mat4.scale(20, 40, 1));

        this.shapes.table.draw(context, program_state, table_scale, shadow_pass ? this.materials.floor : this.materials.pure);

        let height_offset = -6.9;

        
        //cup arrangements
        let mugs_transform = Mat4.scale(1, 1, 1).times(Mat4.translation(0, height_offset, -20)).times(Mat4.rotation(Math.PI, 0, -1, 0));
        mugs_transform = mugs_transform.times(Mat4.scale(4, 2, 4));

        let step = 1.2;

        let m = 0;
        for (let i = 1; i < 5; i++) {
            for (let j = 0; j < i; j++) {
                if (this.players[0].mugs[m].colliding) {
                    let remove_transform = mugs_transform.times(Mat4.translation(this.players[0].mugs[m].x, this.players[0].mugs[m].y, 0));
                    if (this.players[0].mugs[m].y < 6) {
                        remove_transform = remove_transform.times(Mat4.translation(0, 0.3, 0));
                        this.shapes.mug_body.draw(context, program_state, remove_transform, shadow_pass ? this.materials.mug_body : this.materials.pure);
                        this.players[0].mugs[m].y += 0.3;
                    }
                    else if (this.players[0].mugs[m].x < 40) {
                        remove_transform = remove_transform.times(Mat4.translation(0.3, 0.1, 0));
                        this.shapes.mug_body.draw(context, program_state, remove_transform, shadow_pass ? this.materials.mug_body : this.materials.pure);
                        this.players[0].mugs[m].x += 0.3;
                    }
                    else {
                        this.players[0].mugs[m].colliding = false;
                        this.players[0].mugs[m].collision = true;
                    }
                }
                else if (!this.players[0].mugs[m].collision) {
                    this.shapes.mug_body.draw(context, program_state, mugs_transform, shadow_pass ? this.materials.mug_body : this.materials.pure);
                    this.players[0].mugs[m].center[0] = mugs_transform[0][3];
                    this.players[0].mugs[m].center[1] = mugs_transform[1][3];
                    this.players[0].mugs[m].center[2] = mugs_transform[2][3];
                    // this.draw_helper(context, program_state, mugs_transform[0][3], mugs_transform[1][3], mugs_transform[2][3]);
                    // this.draw_helper(context, program_state, mugs_transform[0][3], -5, mugs_transform[2][3]);
                }

                mugs_transform = mugs_transform.times(Mat4.translation(step, 0, 0));
                m += 1;
            }
            mugs_transform = mugs_transform.times(Mat4.translation(-step * (i + (0.5)), 0, step));
        }

        // player 2 mugs
        let s_mugs_transform = Mat4.identity().times(Mat4.translation(0, height_offset, 20)).times(Mat4.rotation(Math.PI, 0, -1, 0)).times(Mat4.scale(4, 2, 4));

        m = 0;
        for (let i = 1; i < 5; i++) {
            for (let j = 0; j < i; j++) {
                if (this.players[1].mugs[m].colliding) {
                    let remove_transform = s_mugs_transform.times(Mat4.translation(this.players[1].mugs[m].x, this.players[1].mugs[m].y, 0));
                    if (this.players[1].mugs[m].y < 6) {
                        remove_transform = remove_transform.times(Mat4.translation(0, 0.5, 0));
                        this.shapes.mug_body.draw(context, program_state, remove_transform, shadow_pass ? this.materials.mug_body : this.materials.pure);
                        this.players[1].mugs[m].y += 0.5;
                    }
                    else if (this.players[1].mugs[m].x < 40) {
                        remove_transform = remove_transform.times(Mat4.translation(0.5, 0, 0));
                        this.shapes.mug_body.draw(context, program_state, remove_transform, shadow_pass ? this.materials.mug_body : this.materials.pure);
                        this.players[1].mugs[m].x += 0.5;
                    }
                    else {
                        this.players[1].mugs[m].colliding = false;
                        this.players[1].mugs[m].collision = true;
                    }
                }
                else if (!this.players[1].mugs[m].collision) {
                    this.shapes.mug_body.draw(context, program_state, s_mugs_transform, shadow_pass ? this.materials.mug_body : this.materials.pure);
                    this.players[1].mugs[m].center[0] = s_mugs_transform[0][3];
                    this.players[1].mugs[m].center[1] = s_mugs_transform[1][3];
                    this.players[1].mugs[m].center[2] = s_mugs_transform[2][3];
                    // this.draw_helper(context, program_state, s_mugs_transform[0][3], s_mugs_transform[1][3], s_mugs_transform[2][3]);
                }

                s_mugs_transform = s_mugs_transform.times(Mat4.translation(step, 0, 0));
                m += 1;
            }
            s_mugs_transform = s_mugs_transform.times(Mat4.translation(-step * (i + 0.5), 0, -step));
        }

        
        for (let b of this.bodies)
            b.shape.draw(context, program_state, b.drawn_location, shadow_pass ? b.material : this.materials.pure);

        // current player view
        // const blending_factor = 0.05;
        // let desired = this.players[this.current_player].camera;
        // desired = Mat4.inverse(desired);
        // desired = desired.map((x,i) => Vector.from(program_state.camera_inverse[i]).mix(x, 0.1));
        // program_state.set_camera(desired);

    }

    update_info_strings(context, program_state) {
        // Draw in info for user to see
        let curr_info_strings_transform = this.info_strings_transform;
        for (let i in this.info_strings) {
            this.shapes.info_strings.set_string(this.info_strings[i], context.context);
            this.shapes.info_strings.draw(context, program_state, curr_info_strings_transform, this.materials.info_strings_image);
            curr_info_strings_transform = curr_info_strings_transform
                .times(Mat4.translation(0, -2, 0))
        }
        curr_info_strings_transform = this.info_strings_transform_2.times(Mat4.rotation(Math.PI, 0, 1, 0));
        for (let i in this.info_strings) {
            this.shapes.info_strings.set_string(this.info_strings[i], context.context);
            this.shapes.info_strings.draw(context, program_state, curr_info_strings_transform, this.materials.info_strings_image);
            curr_info_strings_transform = curr_info_strings_transform
                .times(Mat4.translation(0, -2, 0))
        }
    }

    display(context, program_state) {
        // display(): advance the time and state of our whole simulation.
        if (program_state.animate)
            this.simulate(program_state.animation_delta_time);

        // Draw each shape at its current location:

        // display():  Called once per frame of animation.
        // Setup -- This part sets up the scene's overall camera matrix, projection matrix, and lights:
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            // Define the global camera and projection matrices, which are stored in program_state.
            program_state.set_camera(this.initial_camera_location);
        }

        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, .1, 1000);

        const t = program_state.animation_time / 1000, dt = program_state.animation_delta_time / 1000;
        const tt = program_state.animation_time;
      

        // GL INIT
        const gl = context.context;

        if (!this.init_ok) {
            const ext = gl.getExtension('WEBGL_depth_texture');
            if (!ext) {
                return alert('need WEBGL_depth_texture');
            }
            this.texture_buffer_init(gl);

            this.init_ok = true;
        }

        // Light Setup
         this.light_position = Mat4.rotation(tt/1500, 0, 1, 0).times(vec4(-40, 10, 0, 1));

      
        this.light_color = color(
            0.667 + Math.sin(tt/50)/1.5 ,
            0.667 + Math.sin(tt/150)/1.5 ,
            0.667 + Math.sin(tt/350)/1.5 ,
            1
        );

        // This is a rough target of the light.
        // Although the light is point light, we need a target to set the POV of the light
        this.light_view_target = vec4(0, 0, 0, 1);
        this.light_field_of_view = 130 * Math.PI / 180; // 130 degree

        program_state.lights = [new Light(this.light_position, this.light_color, 1000)];

        // Step 1: set the perspective and camera to the POV of light
        const light_view_mat = Mat4.look_at(
            vec3(this.light_position[0], this.light_position[1], this.light_position[2]),
            vec3(this.light_view_target[0], this.light_view_target[1], this.light_view_target[2]),
            vec3(0, 1, 0), // assume the light to target will have a up dir of +y, maybe need to change according to your case
        );
        const light_proj_mat = Mat4.perspective(this.light_field_of_view, 1, 5, 500);

        // Bind the Depth Texture Buffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.lightDepthFramebuffer);
        gl.viewport(0, 0, this.lightDepthTextureSize, this.lightDepthTextureSize);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        // Prepare uniforms
        program_state.light_view_mat = light_view_mat;
        program_state.light_proj_mat = light_proj_mat;
        program_state.light_tex_mat = light_proj_mat;
        program_state.view_mat = light_view_mat;
        program_state.projection_transform = light_proj_mat;
        this.render_scene(context, program_state, false, false, false);

        // Step 2: unbind, draw to the canvas
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        program_state.view_mat = program_state.camera_inverse;
        program_state.projection_transform = Mat4.perspective(Math.PI / 4, context.width / context.height, 0.5, 500);
        this.render_scene(context, program_state, true, true, true);

        this.update_info_strings(context, program_state);
    }
}