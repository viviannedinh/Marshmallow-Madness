import {defs, tiny} from './examples/common.js';
import {Shape_From_File} from "./examples/obj-file-demo.js"

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Texture, Scene
} = tiny;

export class MarshmallowMadness extends Scene {
    constructor() {
        // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        super();

        // At the beginning of our program, load one of each of these shape definitions onto the GPU.
        this.shapes = {
            torus: new defs.Torus(15, 15),
            mug_body_old: new defs.Single_Capped_Cylinder(15, 15, [[0, 1], [0, 1]]),
            mug_body: new Shape_From_File("assets/mug.obj"),
        };

        // *** Materials
        this.materials = {
            mug_body: new Material(new defs.Textured_Phong(1),
                {ambient: .7, diffusivity: .5, specularity: 0.5, color: color(0.5, 0.5, 0.5, 1), texture: new Texture("assets/peppermint.jpeg")}),
        }

        this.initial_camera_location = Mat4.look_at(vec3(0, 10, 20), vec3(0, 0, 0), vec3(0, 1, 0));
    }

    make_control_panel() {};

    display(context, program_state) {
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

        const light_position = vec4(0, 0, 5, 1);
        // The parameters of the Light are: position, color, size
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 10)];

        let model_transform = Mat4.identity();

        let mug_body_transform = model_transform
            .times(Mat4.scale(2, 2, 2));

        this.shapes.mug_body.draw(context, program_state, mug_body_transform, this.materials.mug_body);

    }
}