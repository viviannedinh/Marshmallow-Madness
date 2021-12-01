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
            box: new defs.Cube(),
            torus: new defs.Torus(15, 15),
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
            table: new defs.Square()
        };
        
        // *** Materials
        this.materials = {
            mug_body: new Material(new defs.Textured_Phong(1),
                {ambient: .7, diffusivity: .5, specularity: 0.5, color: color(0.5, 0.5, 0.5, 1), texture: new Texture("assets/peppermint.jpeg")}),
            test: new Material(new defs.Phong_Shader(),
                {ambient: .5, diffusivity: 1, color: hex_color("#ffffff")}),
            table_material: new Material(new defs.Textured_Phong(1), {ambient: .9, texture: new Texture("assets/wood.jpg")}),
        }

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
  
        this.initial_camera_location = Mat4.look_at(vec3(0, 10, 50), vec3(0, -10, 0), vec3(0, 1, 0));
        this.second_player_view = Mat4.look_at(vec3(0, 10, -50), vec3(0, -10, 0), vec3(0, 1, 0));


    }

    make_control_panel() {
        // these are just for testing mug removal. you can delete
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

        //alex: const light_position = vec4(0, 0, 5, 1);
        const light_position = vec4(10, 10, 10, 1);

        // The parameters of the Light are: position, color, size
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 100)];

        let table_scale = Mat4.identity().times(
            Mat4.translation(0, -10, 0)).times(
            Mat4.rotation(1.57079633, 1, 0, 0)).times(
            Mat4.scale(20, 40, 1));
        this.shapes.table.draw(context, program_state, table_scale, this.materials.table_material);
     
        // player 1 mugs
        let mugs_transform = Mat4.identity().times(Mat4.translation(0, -8.5, -20)).times(Mat4.rotation(2*1.57079633, 0, -1, 0));
        mugs_transform = mugs_transform.times(Mat4.scale(2, 2, 2));

        let m = 0;
        for (let i = 1; i < 5; i++) {
            for (let j = 0; j < i; j++) { 
                if (this.mugs[m].colliding) {
                    let remove_transform = mugs_transform.times(Mat4.translation(this.mugs[m].x, this.mugs[m].y, 0));
                    if (this.mugs[m].y < 6) {
                        remove_transform = remove_transform.times(Mat4.translation(0, 0.5, 0));
                        this.mugs[m].draw(context, program_state, remove_transform, this.materials.mug_body);
                        this.mugs[m].y += 0.5;
                    }
                    else if (this.mugs[m].x < 40) {
                        remove_transform = remove_transform.times(Mat4.translation(0.5, 0, 0));
                        this.mugs[m].draw(context, program_state, remove_transform, this.materials.mug_body);
                        this.mugs[m].x += 0.5;
                    }
                    else {
                        this.mugs[m].colliding = false;
                        this.mugs[m].collision = true;
                    }
                }
                else if (!this.mugs[m].collision) 
                    this.mugs[m].draw(context, program_state, mugs_transform, this.materials.mug_body);
                
                mugs_transform = mugs_transform.times(Mat4.translation(2.5, 0, 0));
                m += 1;
            }
            mugs_transform = mugs_transform.times(Mat4.translation(-2.5 * (i + 0.5), 0, 2.5));    
        }

        // player 2 mugs
        let s_mugs_transform = Mat4.identity().times(Mat4.translation(0, -8.5, 20)).times(Mat4.rotation(2*1.57079633, 0, -1, 0));
        s_mugs_transform = s_mugs_transform.times(Mat4.scale(2, 2, 2));

        m = 0;
        for (let i = 1; i < 5; i++) {
            for (let j = 0; j < i; j++) { 
                if (this.s_mugs[m].colliding) {
                    let remove_transform = s_mugs_transform.times(Mat4.translation(this.s_mugs[m].x, this.s_mugs[m].y, 0));
                    if (this.s_mugs[m].y < 6) {
                        remove_transform = remove_transform.times(Mat4.translation(0, 0.5, 0));
                        this.s_mugs[m].draw(context, program_state, remove_transform, this.materials.mug_body);
                        this.s_mugs[m].y += 0.5;
                    }
                    else if (this.s_mugs[m].x < 40) {
                        remove_transform = remove_transform.times(Mat4.translation(0.5, 0, 0));
                        this.s_mugs[m].draw(context, program_state, remove_transform, this.materials.mug_body);
                        this.s_mugs[m].x += 0.5;
                    }
                    else {
                        this.s_mugs[m].colliding = false;
                        this.s_mugs[m].collision = true;
                    }
                }
                else if (!this.s_mugs[m].collision) 
                    this.s_mugs[m].draw(context, program_state, s_mugs_transform, this.materials.mug_body);
                
                s_mugs_transform = s_mugs_transform.times(Mat4.translation(2.5, 0, 0));
                m += 1;
            }
            s_mugs_transform = s_mugs_transform.times(Mat4.translation(-2.5 * (i + 0.5), 0, -2.5));    
        }

//         axis 
//         let axis_transform = Mat4.identity().times(Mat4.translation(0, 0, 38));
//         this.shapes.box.draw(context, program_state, axis_transform.times(Mat4.scale(10, .1, .1)), this.materials.test.override({color: color(1, 0, 0, 1)}));
//         this.shapes.box.draw(context, program_state, axis_transform.times(Mat4.scale(.1, 10, .1)), this.materials.test.override({color: color(0, 1, 0, 1)}));
//         this.shapes.box.draw(context, program_state, axis_transform.times(Mat4.scale(.1, .1, 10)), this.materials.test.override({color: color(0, 0, 1, 1)}));
       
        // player 1 marshmallow
        this.marshmallow_scale = Mat4.identity().times(Mat4.scale(1, 1, 1.9)).times(Mat4.translation(0, 0, 20));
        this.shapes.marshmallow.draw(context, program_state, this.marshmallow_scale, this.materials.test);

        // player 2 marshmallow
        this.s_marshmallow_scale = Mat4.identity().times(Mat4.scale(1, 1, 1.9)).times(Mat4.translation(0, 0, -20));
        this.shapes.s_marshmallow.draw(context, program_state, this.s_marshmallow_scale, this.materials.test);
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
}
