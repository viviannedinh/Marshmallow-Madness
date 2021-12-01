import {defs, tiny} from './examples/common.js';
import {Shape_From_File} from "./examples/obj-file-demo.js"
import {Color_Phong_Shader, Shadow_Textured_Phong_Shader,
    Depth_Texture_Shader_2D, Buffered_Texture, LIGHT_DEPTH_TEX_SIZE} from './examples/shadow-demo-shaders.js'



const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Texture, Scene
} = tiny;

export class MarshmallowMadness extends Scene {
    constructor() {
        // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        super();

        this.shapes = {
            box: new defs.Cube(),
            mug_body_old: new defs.Single_Capped_Cylinder(15, 15, [[0, 1], [0, 1]]),
            mug_body: new Shape_From_File("assets/mug.obj"),
            cup: new defs.Capped_Cylinder(30, 30),
            marshmallow: new defs.Rounded_Capped_Cylinder(10, 10),
            sphere: new defs.Subdivision_Sphere(6),
            table: new defs.Cube(),
            square_2d: new defs.Square()
        };

        // *** Materials
    
        this.marsh = new Material(new Shadow_Textured_Phong_Shader(1),
                {ambient: .5, diffusivity: 1, color: hex_color("#ffffff"),
                light_depth_texture:null});
        

        //for mug body
        this.mug_body = new Material(new Shadow_Textured_Phong_Shader(1),
                {color: color(0.5, 0.5, 0.5, 1), 
                ambient: .4, diffusivity: .5, specularity:.5, 
                color_texture: new Texture("assets/peppermint.jpeg"), 
                light_depth_texture: null});


        // For the floor or other plain objects
        this.floor = new Material(new Shadow_Textured_Phong_Shader(1), {
            color: color(0.5, 0.5, 0.5, 1), ambient: .4, diffusivity: 0.6, specularity: 0.4, smoothness: 64,
            color_texture: new Texture("assets/wood.jpg"),
            light_depth_texture: null
        })

        // For the first pass
        this.pure = new Material(new Color_Phong_Shader(), {
        })

        // For light source
        this.light_src = new Material(new Shadow_Textured_Phong_Shader(1), {
            color: color(.5, .5, .5, 1), ambient: .4, diffusivity: 0.6, specularity: 0.4,
            color_texture: new Texture("assets/discoball.jpeg")
        });
        // For depth texture display
        this.depth_tex =  new Material(new Depth_Texture_Shader_2D(), {
            color: color(0, 0, .0, 1),
            ambient: 1, diffusivity: 0, specularity: 0, texture: null
        });

        // To make sure texture initialization only does once
        this.init_ok = false;
    
        this.initial_camera_location = Mat4.look_at(vec3(0, 10, 50), vec3(0, -10, 0), vec3(0, 1, 0));
    }

    make_control_panel() {};

      texture_buffer_init(gl) {
        // Depth Texture
        this.lightDepthTexture = gl.createTexture();
        // Bind it to TinyGraphics
        this.light_depth_texture = new Buffered_Texture(this.lightDepthTexture);
        this.mug_body.light_depth_texture = this.light_depth_texture
        this.floor.light_depth_texture = this.light_depth_texture

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
                this.light_src.override({color: light_color})
                );
        }

        let table_scale = Mat4.identity().times(
            Mat4.translation(0, -10, 0)).times(
            Mat4.rotation(1.57079633, 1, 0, 0)).times(
            Mat4.scale(20, 40, 1));
         this.shapes.table.draw(context, program_state, table_scale, shadow_pass? this.floor : this.pure);


        //cup arrangements
        let mugs_transform = Mat4.identity().times(Mat4.translation(0, -7, -20)).times(Mat4.rotation(2*1.57079633, 0, -1, 0));
        mugs_transform = mugs_transform.times(Mat4.scale(2, 2, 2));
        
        for (let i = 1; i < 5; i++) {
            for (let j = 0; j < i; j++) {
                this.shapes.mug_body.draw(context, program_state, mugs_transform, shadow_pass? this.mug_body: this.pure);
                mugs_transform = mugs_transform.times(Mat4.translation(1.8, 0, 0));
            }
            mugs_transform = mugs_transform.times(Mat4.translation(-1.8 * (i + 0.5), 0, 1.8));
        }


        //marshmallow
        let marshmallow_scale = Mat4.identity().times(Mat4.scale(1, 1, 1.9)).times(Mat4.translation(0, 0, 20));
        this.shapes.marshmallow.draw(context, program_state, marshmallow_scale, shadow_pass? this.marsh : this.pure);

    }


    display(context, program_state) {


         const t = program_state.animation_time;
          const dt = program_state.animation_delta_time / 1000;

        const gl = context.context;

        if (!this.init_ok) {
            const ext = gl.getExtension('WEBGL_depth_texture');
            if (!ext) {
                return alert('need WEBGL_depth_texture');  // eslint-disable-line
            }
            this.texture_buffer_init(gl);

            this.init_ok = true;
        }


        // The position of the light
      this.light_position = Mat4.rotation(t / 1500, 0, 1, 0).times(vec4(-40, 10, 0, 1));
    
        // The color of the light
        this.light_color = color(
            0.667 + Math.sin(t/50)/1.5 ,
            0.667 + Math.sin(t/150)/1.5 ,
            0.667 + Math.sin(t/350)/1.5 ,
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
        this.render_scene(context, program_state, false,false, false);

        // Step 2: unbind, draw to the canvas
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        program_state.view_mat = program_state.camera_inverse;
        program_state.projection_transform = Mat4.perspective(Math.PI / 4, context.width / context.height, 0.5, 500);
        this.render_scene(context, program_state, true,true, true);



        // display():  Called once per frame of animation.
        // Setup -- This part sets up the scene's overall camera matrix, projection matrix, and lights:
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            // Define the global camera and projection matrices, which are stored in program_state.
            program_state.set_camera(this.initial_camera_location);
        }

        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, .1, 1000);


        //alex: const light_position = vec4(0, 0, 5, 1);
      //  const light_position = vec4(10, 10, 10, 1);

        // The parameters of the Light are: position, color, size
       // program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 100)];

      
    }
}