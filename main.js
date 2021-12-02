import {defs, tiny} from './examples/common.js';
import {Shape_From_File} from "./examples/obj-file-demo.js";
import {Body, Simulation} from "./examples/collisions-demo.js";
import {Color_Phong_Shader, Shadow_Textured_Phong_Shader,
    Depth_Texture_Shader_2D, Buffered_Texture, LIGHT_DEPTH_TEX_SIZE} from './examples/shadow-demo-shaders.js'
import {Text_Line} from "./examples/text-demo.js";

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
            info_strings: new Text_Line(100),
        };

        // *** Materials
        this.materials = {
            mug_body: new Material(new defs.Textured_Phong(1),
                {ambient: .7, diffusivity: .5, specularity: 0.5, color: color(0.5, 0.5, 0.5, 1), texture: new Texture("assets/peppermint.jpeg")}),
            marshmallow: new Material(new defs.Phong_Shader(),
                {ambient: .5, diffusivity: 1, color: hex_color("#ffffff")}),
            table_material: new Material(new defs.Textured_Phong(1), {ambient: .9, texture: new Texture("assets/wood.jpg")}),
            info_strings: new Material(new defs.Phong_Shader(),
                {ambient: .5, diffusivity: 1, color: hex_color("#ffffff")}),
            info_strings_image: new Material(new defs.Textured_Phong(1), {
                ambient: 1, diffusivity: 0, specularity: 0,
                texture: new Texture("assets/text.png")
            }),
        }
        
        this.info_strings_transform = Mat4.identity()
            .times(Mat4.translation(...vec3(-13, 11, 50)))
            .times(Mat4.rotation(-Math.PI / 15, 1, 0, 0))
            .times(Mat4.scale(.25, .25, 1))
        
        this.initialize_marshmallow();
        this.initialize_info_strings();

        this.initial_camera_location = Mat4.look_at(vec3(0, 10, 70), vec3(0, -10, 0), vec3(0, 1, 0));
    }

    make_control_panel() {
        this.key_triggered_button("Fire shot", ["Shift"], () => {
            this.shot_fired = true;
        });
        this.new_line();
        this.key_triggered_button("Increase power", ["i"], () => {
            if (this.shot_fired != true) {
                this.current_velocity += 2;
                this.initialize_info_strings();
            }
        });
        this.new_line();
        this.key_triggered_button("Decrease power", ["k"], () => {
            if (this.shot_fired != true && this.current_velocity > 0) {
                this.current_velocity -= 2;
                this.initialize_info_strings();
            }
        });
        this.new_line();
        this.key_triggered_button("Aim left", ["j"], () => {
            if (this.shot_fired != true && this.horizontal_angle < Math.PI) {
                this.horizontal_angle += 1 / 180 * Math.PI;
                this.initialize_info_strings();
            }
        });
        this.new_line();
        this.key_triggered_button("Aim right", ["l"], () => {
            if (this.shot_fired != true && this.horizontal_angle > 0) {
                this.horizontal_angle -= 1 / 180 * Math.PI;
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
    };

    initialize_marshmallow() {
        // Initialize variables related to marshmallow and projectile
        this.bodies = [];
        this.current_velocity = 0;
        this.shot_fired = false;
        this.vertical_angle = Math.PI / 3; // angle above -z axis (on yz plane)
        this.horizontal_angle = Math.PI / 2; // angle right of -z axis (on xz plane)
    }

    initialize_info_strings() {
        // Reset info string array to contain up to date values
        this.info_strings = [
            `Power: ${this.current_velocity}`,
            `Horizontal angle: ${Math.round(this.horizontal_angle / Math.PI * 180) - 90}`,
            `Vertical angle: ${Math.round(this.vertical_angle / Math.PI * 180)}`,
        ]
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
                let z_vel = -this.current_velocity * Math.cos(this.vertical_angle);
                let y_vel = this.current_velocity * Math.sin(this.vertical_angle) + dt * -9.8;
                let x_vel = this.current_velocity * Math.cos(this.horizontal_angle);
                
                this.current_velocity = Math.pow(
                    Math.pow(z_vel, 2) + Math.pow(y_vel, 2),
                    0.5
                );
                this.vertical_angle = Math.atan(y_vel / -z_vel);

                b.linear_velocity[2] = z_vel;
                b.linear_velocity[1] = y_vel;
                b.linear_velocity[0] = x_vel;

                // If about to fall through floor, reverse y velocity:
                // TODO: collision logic and switch camera angles / player
                if (b.center[1] < -8 && b.linear_velocity[1] < 0) {
//                     b.linear_velocity[1] *= -.8;

                    this.initialize_marshmallow();
                    this.initialize_info_strings();
                }
                b.advance(dt);
            }
            // Delete bodies that stop or stray too far away:
//             this.bodies = this.bodies.filter(b => b.center.norm() < 50 && b.linear_velocity.norm() > 2);
        }
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
    }

    display(context, program_state) {
        super.display(context, program_state);
        
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

        // The parameters of the Light are: position, color, size
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 100)];

        let table_scale = Mat4.identity().times(
            Mat4.translation(0, -10, 0)).times(
            Mat4.rotation(1.57079633, 1, 0, 0)).times(
            Mat4.scale(20, 40, 1));
        this.shapes.table.draw(context, program_state, table_scale, this.materials.table_material);

        //cup arrangements
        let mugs_transform = Mat4.identity().times(Mat4.translation(0, -8.5, -20)).times(Mat4.rotation(2*1.57079633, 0, -1, 0));

        mugs_transform = mugs_transform.times(Mat4.scale(2, 2, 2));
        
        for (let i = 1; i < 5; i++) {
            for (let j = 0; j < i; j++) {
                this.shapes.mug_body.draw(context, program_state, mugs_transform, this.materials.mug_body);
                mugs_transform = mugs_transform.times(Mat4.translation(1.8, 0, 0));
            }
            //cups_transform = cups_transform.times(Mat4.translation(-1.8 * (i + 0.5), 1.8, 0));
            mugs_transform = mugs_transform.times(Mat4.translation(-1.8 * (i + 0.5), 0, 1.8));
        }

        this.update_info_strings(context, program_state);
    }
}