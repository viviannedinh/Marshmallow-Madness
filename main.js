import { defs, tiny } from './examples/common.js';
import { Shape_From_File } from "./examples/obj-file-demo.js";
import { Body, Simulation } from "./examples/collisions-demo.js";
import {
    Color_Phong_Shader, Shadow_Textured_Phong_Shader,
    Depth_Texture_Shader_2D, Buffered_Texture, LIGHT_DEPTH_TEX_SIZE
} from './examples/shadow-demo-shaders.js'

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
            mug_body_old: new defs.Single_Capped_Cylinder(15, 15, [[0, 1], [0, 1]]),
            mug_body: new Shape_From_File("assets/mug.obj"),
            mug0: new Shape_From_File("assets/mug.obj"),
            mug1: new Shape_From_File("assets/mug.obj"),
            mug2: new Shape_From_File("assets/mug.obj"),
            mug3: new Shape_From_File("assets/mug.obj"),
            mug4: new Shape_From_File("assets/mug.obj"),
            mug5: new Shape_From_File("assets/mug.obj"),
            mug6: new Shape_From_File("assets/mug.obj"),
            mug7: new Shape_From_File("assets/mug.obj"),
            mug8: new Shape_From_File("assets/mug.obj"),
            mug9: new Shape_From_File("assets/mug.obj"),
            s_mug0: new Shape_From_File("assets/mug.obj"),
            s_mug1: new Shape_From_File("assets/mug.obj"),
            s_mug2: new Shape_From_File("assets/mug.obj"),
            s_mug3: new Shape_From_File("assets/mug.obj"),
            s_mug4: new Shape_From_File("assets/mug.obj"),
            s_mug5: new Shape_From_File("assets/mug.obj"),
            s_mug6: new Shape_From_File("assets/mug.obj"),
            s_mug7: new Shape_From_File("assets/mug.obj"),
            s_mug8: new Shape_From_File("assets/mug.obj"),
            s_mug9: new Shape_From_File("assets/mug.obj"),
            cup: new defs.Capped_Cylinder(30, 30),
            marshmallow: new defs.Rounded_Capped_Cylinder(10, 10),
            s_marshmallow: new defs.Rounded_Capped_Cylinder(10, 10),
            sphere: new defs.Subdivision_Sphere(6),
            table: new defs.Cube(),
        };

        // *** Materials
        this.materials = {
            mug_bod_old: new Material(new defs.Textured_Phong(1),
                {
                    ambient: .7,
                    diffusivity: .5,
                    specularity: 0.5,
                    color: color(0.5, 0.5, 0.5, 1),
                    texture: new Texture("assets/peppermint.jpeg")
                }),
            marshmallow: new Material(new defs.Phong_Shader(),
                {
                    ambient: .5,
                    diffusivity: 1,
                    color: hex_color("#ffffff")
                }),
            table_material: new Material(new defs.Textured_Phong(1),
                {
                    ambient: .9,
                    texture: new Texture("assets/wood.jpg")
                }),
            marsh: new Material(new Shadow_Textured_Phong_Shader(1),
                {
                    ambient: .5,
                    diffusivity: 1,
                    color: hex_color("#ffffff"),
                    light_depth_texture: null
                }),
            mug_body: new Material(new Shadow_Textured_Phong_Shader(1),
                {
                    color: color(0.5, 0.5, 0.5, 1),
                    ambient: .4,
                    diffusivity: .5,
                    specularity: .5,
                    color_texture: new Texture("assets/peppermint.jpeg"),
                    light_depth_texture: null
                }),
            floor: new Material(new Shadow_Textured_Phong_Shader(1),
                {
                    color: color(0.5, 0.5, 0.5, 1),
                    ambient: .4,
                    diffusivity: 0.6, specularity: 0.4, smoothness: 64,
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
                }),
            depth_tex: new Material(new Depth_Texture_Shader_2D(),
                {
                    color: color(0, 0, .0, 1),
                    ambient: 1,
                    diffusivity: 0,
                    specularity: 0,
                    texture: null
                })
        };


        this.mugs = [this.shapes.mug0, this.shapes.mug1, this.shapes.mug2, this.shapes.mug3, this.shapes.mug4, this.shapes.mug5, this.shapes.mug6, this.shapes.mug7, this.shapes.mug8, this.shapes.mug9];
        for (let i = 0; i < 10; i++) {
            this.mugs[i].colliding = false;
            this.mugs[i].collision = false;
            this.mugs[i].x = 0;
            this.mugs[i].y = 0;
        }

        this.s_mugs = [this.shapes.s_mug0, this.shapes.s_mug1, this.shapes.s_mug2, this.shapes.s_mug3, this.shapes.s_mug4, this.shapes.s_mug5, this.shapes.s_mug6, this.shapes.s_mug7, this.shapes.s_mug8, this.shapes.s_mug9];
        for (let i = 0; i < 10; i++) {
            this.s_mugs[i].colliding = false;
            this.s_mugs[i].collision = false;
            this.s_mugs[i].x = 0;
            this.s_mugs[i].y = 0;
        }

        this.max_velocity = 30;
        this.horizontal_angle = Math.PI / 2; // angle right of -z axis (on xz plane)
        this.initialize_marshmallow();

        this.initial_camera_location = Mat4.look_at(vec3(0, 10, 50), vec3(0, -10, 0), vec3(0, 1, 0));
        this.second_player_view = Mat4.look_at(vec3(0, 10, -50), vec3(0, -10, 0), vec3(0, 1, 0));

        this.init_ok = false;
    }

    make_control_panel() {
        this.key_triggered_button("Fire shot", ["Shift"], () => {
            this.shot_fired = true;
        });
        this.new_line();
        this.key_triggered_button("Increase power", ["i"], () => {
            if (this.shot_fired != true && this.current_velocity < this.max_velocity) {
                this.current_velocity += 2;
            }
        });
        this.new_line();
        this.key_triggered_button("Decrease power", ["k"], () => {
            if (this.shot_fired != true && this.current_velocity > 0) {
                this.current_velocity -= 2;
            }
        });
        this.key_triggered_button("collide 0", ["v"], () => { this.mugs[0].colliding = true; });
        this.key_triggered_button("collide 1", ["v"], () => { this.mugs[1].colliding = true; });
        this.key_triggered_button("collide 2", ["v"], () => { this.mugs[2].colliding = true; });
        this.key_triggered_button("collide 3", ["v"], () => { this.mugs[3].colliding = true; });
        this.key_triggered_button("collide 4", ["v"], () => { this.mugs[4].colliding = true; });
        this.key_triggered_button("collide 5", ["v"], () => { this.mugs[5].colliding = true; });
        this.key_triggered_button("collide 6", ["v"], () => { this.mugs[6].colliding = true; });
        this.key_triggered_button("collide 7", ["v"], () => { this.mugs[7].colliding = true; });
        this.key_triggered_button("collide 8", ["v"], () => { this.mugs[8].colliding = true; });
        this.key_triggered_button("collide 9", ["v"], () => { this.mugs[9].colliding = true; });
        this.new_line();
        this.key_triggered_button("s collide 0", ["v"], () => { this.s_mugs[0].colliding = true; });
        this.key_triggered_button("s collide 1", ["v"], () => { this.s_mugs[1].colliding = true; });
        this.key_triggered_button("s collide 2", ["v"], () => { this.s_mugs[2].colliding = true; });
        this.key_triggered_button("s collide 3", ["v"], () => { this.s_mugs[3].colliding = true; });
        this.key_triggered_button("s collide 4", ["v"], () => { this.s_mugs[4].colliding = true; });
        this.key_triggered_button("s collide 5", ["v"], () => { this.s_mugs[5].colliding = true; });
        this.key_triggered_button("s collide 6", ["v"], () => { this.s_mugs[6].colliding = true; });
        this.key_triggered_button("s collide 7", ["v"], () => { this.s_mugs[7].colliding = true; });
        this.key_triggered_button("s collide 8", ["v"], () => { this.s_mugs[8].colliding = true; });
        this.key_triggered_button("s collide 9", ["v"], () => { this.s_mugs[9].colliding = true; });
        this.new_line();
        this.key_triggered_button("player 1 turn", ["v"], () => this.attached = () => this.marshmallow_scale);
        this.key_triggered_button("player 2 turn", ["v"], () => this.attached = () => this.s_marshmallow_scale);
    };


    texture_buffer_init(gl) {
        // Depth Texture
        this.lightDepthTexture = gl.createTexture();
        // Bind it to TinyGraphics
        this.light_depth_texture = new Buffered_Texture(this.lightDepthTexture);
        this.materials.mug_body.light_depth_texture = this.light_depth_texture
        this.materials.floor.light_depth_texture = this.light_depth_texture

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
                Mat4.translation(light_position[0], light_position[1], light_position[2]).times(Mat4.scale(2, 2, 2)),
                this.materials.light_src.override({ color: light_color })
            );
        }

        let table_scale = Mat4.identity().times(
            Mat4.translation(0, -10, 0)).times(
                Mat4.rotation(Math.PI / 2.0, 1, 0, 0)).times(
                    Mat4.scale(20, 40, 1));

        this.shapes.table.draw(context, program_state, table_scale, shadow_pass ? this.materials.floor : this.materials.pure);

        //cup arrangements
        let mugs_transform = Mat4.identity().times(Mat4.translation(0, -7, -20)).times(Mat4.rotation(Math.PI, 0, -1, 0));
        mugs_transform = mugs_transform.times(Mat4.scale(2, 2, 2));

        let m = 0;
        for (let i = 1; i < 5; i++) {
            for (let j = 0; j < i; j++) {
                if (this.mugs[m].colliding) {
                    let remove_transform = mugs_transform.times(Mat4.translation(this.mugs[m].x, this.mugs[m].y, 0));
                    if (this.mugs[m].y < 6) {
                        remove_transform = remove_transform.times(Mat4.translation(0, 0.5, 0));
                        this.mugs[m].draw(context, program_state, remove_transform, shadow_pass ? this.materials.mug_body : this.materials.pure);
                        this.mugs[m].y += 0.5;
                    }
                    else if (this.mugs[m].x < 40) {
                        remove_transform = remove_transform.times(Mat4.translation(0.5, 0, 0));
                        this.mugs[m].draw(context, program_state, remove_transform, shadow_pass ? this.materials.mug_body : this.materials.pure);
                        this.mugs[m].x += 0.5;
                    }
                    else {
                        this.mugs[m].colliding = false;
                        this.mugs[m].collision = true;
                    }
                }
                else if (!this.mugs[m].collision)
                    this.mugs[m].draw(context, program_state, mugs_transform, shadow_pass ? this.materials.mug_body : this.materials.pure);

                mugs_transform = mugs_transform.times(Mat4.translation(2.5, 0, 0));
                m += 1;
            }
            mugs_transform = mugs_transform.times(Mat4.translation(-2.5 * (i + 0.5), 0, 2.5));
        }

        // player 2 mugs
        let s_mugs_transform = Mat4.identity().times(Mat4.translation(0, -7, 20)).times(Mat4.rotation(Math.PI, 0, -1, 0));
        s_mugs_transform = s_mugs_transform.times(Mat4.scale(2, 2, 2));

        m = 0;
        for (let i = 1; i < 5; i++) {
            for (let j = 0; j < i; j++) {
                if (this.s_mugs[m].colliding) {
                    let remove_transform = s_mugs_transform.times(Mat4.translation(this.s_mugs[m].x, this.s_mugs[m].y, 0));
                    if (this.s_mugs[m].y < 6) {
                        remove_transform = remove_transform.times(Mat4.translation(0, 0.5, 0));
                        this.s_mugs[m].draw(context, program_state, remove_transform, shadow_pass ? this.materials.mug_body : this.materials.pure);
                        this.s_mugs[m].y += 0.5;
                    }
                    else if (this.s_mugs[m].x < 40) {
                        remove_transform = remove_transform.times(Mat4.translation(0.5, 0, 0));
                        this.s_mugs[m].draw(context, program_state, remove_transform, shadow_pass ? this.materials.mug_body : this.materials.pure);
                        this.s_mugs[m].x += 0.5;
                    }
                    else {
                        this.s_mugs[m].colliding = false;
                        this.s_mugs[m].collision = true;
                    }
                }
                else if (!this.s_mugs[m].collision)
                    this.s_mugs[m].draw(context, program_state, s_mugs_transform, shadow_pass ? this.materials.mug_body : this.materials.pure);

                s_mugs_transform = s_mugs_transform.times(Mat4.translation(2.5, 0, 0));
                m += 1;
            }
            s_mugs_transform = s_mugs_transform.times(Mat4.translation(-2.5 * (i + 0.5), 0, -2.5));
        }


        // player 1 marshmallow
        this.marshmallow_scale = Mat4.identity().times(Mat4.scale(1, 1, 1.9)).times(Mat4.translation(0, 0, 20));
        this.shapes.marshmallow.draw(context, program_state, this.marshmallow_scale, shadow_pass ? this.materials.marsh : this.materials.pure);

        // player 2 marshmallow
        this.s_marshmallow_scale = Mat4.identity().times(Mat4.scale(1, 1, 1.9)).times(Mat4.translation(0, 0, -20));
        this.shapes.s_marshmallow.draw(context, program_state, this.s_marshmallow_scale, shadow_pass ? this.materials.marsh : this.materials.pure);
        this.s_marshmallow_scale = this.s_marshmallow_scale.times(Mat4.rotation(Math.PI, 0, 1, 0));

        // current player view
        if (this.attached) {
            if (this.attached() == this.marshmallow_scale) {
                const blending_factor = 0.05;
                const desired = this.attached().times(Mat4.translation(0, 3, 9));
                const current = desired.map((x, i) =>
                    Vector.from(program_state.camera_transform[i]).mix(x, blending_factor));
                program_state.set_camera(Mat4.inverse(current));
            }
            else if (this.attached() == this.s_marshmallow_scale) {
                const blending_factor = 0.05;
                let desired = this.attached().times(Mat4.translation(0, 3, 9));
                let current = desired.map((x, i) =>
                    Vector.from(program_state.camera_transform[i]).mix(x, blending_factor));
                program_state.set_camera(Mat4.inverse(current));
            }
        }

    }

    initialize_marshmallow() {
        // Initialize variables related to marshmallow and projectile
        this.bodies = [];
        this.current_velocity = 0;
        this.shot_fired = false;
        this.marshmallow_angle = Math.PI / 3; // angle above -z axis (on yz plane)
    }

    update_state(dt) {
        // update_state():  Override the base time-stepping code to say what this particular
        // scene should do to its bodies every frame -- including applying forces.
        // Generate additional moving bodies if there ever aren't enough:
        while (this.bodies.length < 1) {
            this.bodies.push(
                new Body(
                    this.shapes.marshmallow,
                    this.materials.marshmallow,
                    vec3(1, 1, 1.9)
                ).emplace(
                    Mat4.translation(...vec3(0, 0, 50)),
                    vec3(0, 0, 0),
                    0,
                )
            )
        }

        // If shot was fired, update velocity and position of marshmallow
        // If marshmallow has collision, reset marshmallow position & power
        if (this.shot_fired) {
            for (let b of this.bodies) {
                // Gravity on Earth, where 1 unit in world space = 1 meter:
                let z_vel = -this.current_velocity * Math.cos(this.marshmallow_angle);
                let y_vel = this.current_velocity * Math.sin(this.marshmallow_angle) + dt * -9.8;
                //                 let x_vel = this.current_velocity * Math.cos(this.horizontal_angle);

                this.current_velocity = Math.pow(
                    Math.pow(z_vel, 2) + Math.pow(y_vel, 2),
                    0.5
                );
                this.marshmallow_angle = Math.atan(y_vel / -z_vel);

                b.linear_velocity[2] = z_vel;
                b.linear_velocity[1] = y_vel;
                //                 b.linear_velocity[0] = x_vel;

                // If about to fall through floor, reverse y velocity:
                // TODO: collision logic and switch camera angles / player
                if (b.center[1] < -8 && b.linear_velocity[1] < 0) {
                    //                     b.linear_velocity[1] *= -.8;


                    this.initialize_marshmallow();
                }
                b.advance(dt);
            }
            // Delete bodies that stop or stray too far away:
            //             this.bodies = this.bodies.filter(b => b.center.norm() < 50 && b.linear_velocity.norm() > 2);
        }
    }


    render_scene(context, program_state, shadow_pass, draw_light_source=false, draw_shadow=false) {
        // shadow_pass: true if this is the second pass that draw the shadow.
        // draw_light_source: true if we want to draw the light source.
        // draw_shadow: true if we want to draw the shadow

        let light_position = this.light_position;
        let light_color = this.light_color;
        const t = program_state.animation_time;

        program_state.draw_shadow = draw_shadow;

        if (draw_light_source && shadow_pass) {
            this.shapes.sphere.draw(context, program_state,
                Mat4.translation(light_position[0], light_position[1], light_position[2]).times(Mat4.scale(2,2,2)),
                this.materials.light_src.override({color: light_color})
                );
        }

        let table_scale = Mat4.identity().times(
            Mat4.translation(0, -10, 0)).times(
            Mat4.rotation(Math.PI / 2.0, 1, 0, 0)).times(
            Mat4.scale(20, 40, 1));
         
        this.shapes.table.draw(context, program_state, table_scale, shadow_pass? this.materials.floor : this.materials.pure);
       
        //cup arrangements
        let mugs_transform = Mat4.identity().times(Mat4.translation(0, -7, -20)).times(Mat4.rotation(Math.PI, 0, -1, 0));
        mugs_transform = mugs_transform.times(Mat4.scale(2, 2, 2));

        let m = 0;
        for (let i = 1; i < 5; i++) {
            for (let j = 0; j < i; j++) { 
                if (this.mugs[m].colliding) {
                    let remove_transform = mugs_transform.times(Mat4.translation(this.mugs[m].x, this.mugs[m].y, 0));
                    if (this.mugs[m].y < 6) {
                        remove_transform = remove_transform.times(Mat4.translation(0, 0.5, 0));
                        this.mugs[m].draw(context, program_state, remove_transform, shadow_pass? this.materials.mug_body: this.materials.pure);
                        this.mugs[m].y += 0.5;
                    }
                    else if (this.mugs[m].x < 40) {
                        remove_transform = remove_transform.times(Mat4.translation(0.5, 0, 0));
                        this.mugs[m].draw(context, program_state, remove_transform, shadow_pass? this.materials.mug_body: this.materials.pure);
                        this.mugs[m].x += 0.5;
                    }
                    else {
                        this.mugs[m].colliding = false;
                        this.mugs[m].collision = true;
                    }
                }
                else if (!this.mugs[m].collision) 
                    this.mugs[m].draw(context, program_state, mugs_transform, shadow_pass? this.materials.mug_body: this.materials.pure);
                
                mugs_transform = mugs_transform.times(Mat4.translation(2.5, 0, 0));
                m += 1;
            }
            mugs_transform = mugs_transform.times(Mat4.translation(-2.5 * (i + 0.5), 0, 2.5));    
        }

        // player 2 mugs
        let s_mugs_transform = Mat4.identity().times(Mat4.translation(0, -7, 20)).times(Mat4.rotation(Math.PI, 0, -1, 0));
        s_mugs_transform = s_mugs_transform.times(Mat4.scale(2, 2, 2));

        m = 0;
        for (let i = 1; i < 5; i++) {
            for (let j = 0; j < i; j++) { 
                if (this.s_mugs[m].colliding) {
                    let remove_transform = s_mugs_transform.times(Mat4.translation(this.s_mugs[m].x, this.s_mugs[m].y, 0));
                    if (this.s_mugs[m].y < 6) {
                        remove_transform = remove_transform.times(Mat4.translation(0, 0.5, 0));
                        this.s_mugs[m].draw(context, program_state, remove_transform, shadow_pass? this.materials.mug_body: this.materials.pure);
                        this.s_mugs[m].y += 0.5;
                    }
                    else if (this.s_mugs[m].x < 40) {
                        remove_transform = remove_transform.times(Mat4.translation(0.5, 0, 0));
                        this.s_mugs[m].draw(context, program_state, remove_transform, shadow_pass? this.materials.mug_body: this.materials.pure);
                        this.s_mugs[m].x += 0.5;
                    }
                    else {
                        this.s_mugs[m].colliding = false;
                        this.s_mugs[m].collision = true;
                    }
                }
                else if (!this.s_mugs[m].collision) 
                    this.s_mugs[m].draw(context, program_state, s_mugs_transform, shadow_pass? this.materials.mug_body: this.materials.pure);
                
                s_mugs_transform = s_mugs_transform.times(Mat4.translation(2.5, 0, 0));
                m += 1;
            }
            s_mugs_transform = s_mugs_transform.times(Mat4.translation(-2.5 * (i + 0.5), 0, -2.5));    
        }

     
        // player 1 marshmallow
        this.marshmallow_scale = Mat4.identity().times(Mat4.scale(1, 1, 1.9)).times(Mat4.translation(0, 0, 20));
        this.shapes.marshmallow.draw(context, program_state, this.marshmallow_scale, shadow_pass? this.materials.marsh : this.materials.pure);

        // player 2 marshmallow
        this.s_marshmallow_scale = Mat4.identity().times(Mat4.scale(1, 1, 1.9)).times(Mat4.translation(0, 0, -20));
        this.shapes.s_marshmallow.draw(context, program_state, this.s_marshmallow_scale, shadow_pass? this.materials.marsh : this.materials.pure);
        this.s_marshmallow_scale = this.s_marshmallow_scale.times(Mat4.rotation(Math.PI, 0, 1, 0));
        
        // current player view
        if (this.attached) {
            if (this.attached() == this.marshmallow_scale) {
                const blending_factor = 0.05;
                const desired = this.attached().times(Mat4.translation(0, 3, 9));
                const current = desired.map( (x,i) => 
                    Vector.from( program_state.camera_transform[i] ).mix( x, blending_factor ) );
                program_state.set_camera(Mat4.inverse(current));
            }
            else if (this.attached() == this.s_marshmallow_scale){
                const blending_factor = 0.05;
                let desired = this.attached().times(Mat4.translation(0, 3, 9));
                let current = desired.map( (x,i) => 
                    Vector.from( program_state.camera_transform[i] ).mix( x, blending_factor ) );
                program_state.set_camera(Mat4.inverse(current));
            }
        }

    }
    

    display(context, program_state) {
        // display(): advance the time and state of our whole simulation.
        if (program_state.animate)
            this.simulate(program_state.animation_delta_time);

        // Draw each shape at its current location:
        for (let b of this.bodies)
            b.shape.draw(context, program_state, b.drawn_location, b.material);

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

        //alex: const light_position = vec4(0, 0, 5, 1);
        const light_position = vec4(10, 10, 10, 1);

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
        this.light_position = Mat4.rotation(t / 1500, 0, 1, 0).times(vec4(-40, 10, 0, 1));

        this.light_color = color(
            0.667 + Math.sin(t / 50) / 1.5,
            0.667 + Math.sin(t / 150) / 1.5,
            0.667 + Math.sin(t / 350) / 1.5,
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



        // display():  Called once per frame of animation.
        // Setup -- This part sets up the scene's overall camera matrix, projection matrix, and lights:
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            // Define the global camera and projection matrices, which are stored in program_state.
            program_state.set_camera(this.initial_camera_location);
        }


        // let table_scale = Mat4.identity().times(
        //     Mat4.translation(0, -10, 0)).times(
        //         Mat4.rotation(1.57079633, 1, 0, 0)).times(
        //             Mat4.scale(20, 40, 1));
        // this.shapes.table.draw(context, program_state, table_scale, this.materials.table_material);

        // //cup arrangements
        // let mugs_transform = Mat4.identity().times(Mat4.translation(0, -8.5, -20)).times(Mat4.rotation(2 * 1.57079633, 0, -1, 0));

        // mugs_transform = mugs_transform.times(Mat4.scale(2, 2, 2));

        // for (let i = 1; i < 5; i++) {
        //     for (let j = 0; j < i; j++) {
        //         this.shapes.mug_body.draw(context, program_state, mugs_transform, this.materials.mug_body_old);
        //         mugs_transform = mugs_transform.times(Mat4.translation(1.8, 0, 0));
        //     }
        //     //cups_transform = cups_transform.times(Mat4.translation(-1.8 * (i + 0.5), 1.8, 0));
        //     mugs_transform = mugs_transform.times(Mat4.translation(-1.8 * (i + 0.5), 0, 1.8));
        // }

        //         axis 
        //         let axis_transform = Mat4.identity().times(Mat4.translation(0, 0, 38));
        //         this.shapes.box.draw(context, program_state, axis_transform.times(Mat4.scale(10, .1, .1)), this.materials.test.override({color: color(1, 0, 0, 1)}));
        //         this.shapes.box.draw(context, program_state, axis_transform.times(Mat4.scale(.1, 10, .1)), this.materials.test.override({color: color(0, 1, 0, 1)}));
        //         this.shapes.box.draw(context, program_state, axis_transform.times(Mat4.scale(.1, .1, 10)), this.materials.test.override({color: color(0, 0, 1, 1)}));

        //marshmallow
        //         let marshmallow_scale = Mat4.identity().times(Mat4.scale(1, 1, 1.9)).times(Mat4.translation(0, 0, 20));
        //         this.shapes.marshmallow.draw(context, program_state, marshmallow_scale, this.materials.marshmallow);

    }
}