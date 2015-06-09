// 720P HD
var canvas_w = 1280;
var canvas_h = 720;
var ratio = (canvas_w / canvas_h);

// WEBGL STUFF
var renderer;
var gl;
var scene;
var camera;
var controls;
var canvas;

// ARRAYS
var mht_data_arr;
var imht_data_arr;
var mhb_data_arr;
var mhb_txt_data;

// ARRAY SIZES
var size_mhb;
var size_mht;
var size_imht;

// TEXTURES
var mhb_tex;
var mht_tex;
var imht_tex;

// TEXTURE SIZES
var mhb_length;
var mht_length;
var imht_length;


// MODEL STUFF
var harmonic_count;
var num_vert;
var posArray;
var model_mesh;
var vidx_arr;

// SHADER STUFF
var shader_info;
var vertex_shader;
var fragment_shader;

// LIGHTS
var light_angle = 0.0;
var ambientJS;
var directionalLight;

var webgl_init = false;
var model_init = false;
var audio_init = false;
var shader_init = false;

var debug;
var loader;

// DEBUG FUNCTIONS
function throwOnGLError(err, funcName, args) 
{
  throw WebGLDebugUtils.glEnumToString(err) + " was caused by call to: " + funcName;
}

function logGLCall(functionName, args) 
{   
   console.log("gl." + functionName + "(" + 
      WebGLDebugUtils.glFunctionArgsToString(functionName, args) + ")");   
} 

function validateNoneOfTheArgsAreUndefined(functionName, args) 
{
  for (var ii = 0; ii < args.length; ++ii) 
  {
    if (args[ii] === undefined) 
    {
      console.error("undefined passed to gl." + functionName + "(" +
                     WebGLDebugUtils.glFunctionArgsToString(functionName, args) + ")");
    }
  }
}

function logAndValidate(functionName, args) 
{
   logGLCall(functionName, args);
   validateNoneOfTheArgsAreUndefined (functionName, args);
}

// INIT FUNCTION
function init() 
{
	debug = false;
	harmonic_count = 50;

	webgl(function ( init )
	{
		webgl_init = init;
		shaders( function ( s_init )
		{
			shader_init = s_init;
		});
		model( function ( m_init )
		{
			model_init = m_init;
		});
	});

	audio(function ( a_init)
	{
		audio_init = a_init;
	});
	animate();
}

// INITIALIZE WEBGL & SCENE
function webgl(callback)
{
	canvas = document.getElementById("glcanvas");
	renderer = new THREE.WebGLRenderer({ clearColor: 0x0086a2, antialias: true, clearAlpha: 1, canvas : canvas});

	if(debug == true)
	{
		gl = WebGLDebugUtils.makeDebugContext(canvas.getContext("webgl"), throwOnGLError, logAndValidate);
	}
	else
	{
		gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
	}
	
	scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera(20, ratio, 0.1, 10001);

	scene.add(camera);
	setCamera(0,0,5);
	
	controls = new THREE.TrackballControls(camera, renderer.domElement);
	setControls();

	setLight();
	
	renderer.setSize(canvas_w, canvas_h);
	
	console.log("WebGL Initialized.")
	callback(true);
}

// SET SHADERS
function shaders(callback)
{
	vertex_shader =
		// UNIFORMS
		"uniform sampler2D mhb;" +
		"uniform sampler2D mht;" +
		"uniform sampler2D imht;" +
		"uniform float num_vert;" +
		"uniform float mhb_size;" +
		"uniform float mht_size;" +
		// OUT / VARRYING
		"varying vec3 new_normal;" +
		"varying vec3 eye;" +
		// ATTRIBUTES
		"attribute float vertex_idx;" +
		"const int num_harmonics = 50;" +
		
		// GET COORDINATES OF TEXTURE
		"vec2 coord(float size_tex, float idx, bool need_tex)" +
		"{" +
			"if(need_tex)" +
			"{" +
				"idx = floor(idx / 4.0);" +
			"}"+
			"float x = floor(idx / size_tex);" +
			"float y = mod(idx, size_tex);" +
			"return vec2( (y/size_tex), (x/size_tex) );" +
		"}" +

		// GET TEXTURE VALUE
		"float getTex(float val, vec4 tex)" +
		"{" +
			"float ret_val;" +
			"if(val == 0.0) " +
			"{" +
				"ret_val = tex.x;" +
			"}" +
			"else if(val == 1.0)" +
			"{" + 
				"ret_val = tex.y;" +
			"}" +
			"else if(val == 2.0)" +
			"{" + 
				"ret_val = tex.z;" +
			"}" +
			"else if(val == 3.0)" +
			"{" + 
				"ret_val = tex.w;" +
			"}" +
			"return ret_val;" +
		"}" +
		
		"void main() " +
		"{" +
			// OFFSET VECTOR DEPENDING ON FREQUENCIES FROM SONG (MHT/IMHT)
			"vec3 displacement = vec3(0.0, 0.0, 0.0);" +
					
			"for(int i = 0; i < num_harmonics; i++)" +
			"{" +
				"float mhb_idx = float(i) * num_vert + vertex_idx;" +

				"vec2 mhb_coords = coord(mhb_size, mhb_idx, true);" +
				"vec2 mht_coords = coord(mht_size, float(i), false);" +

				"vec4 mhb_tex = texture2D(mhb, mhb_coords).xyzw;" + 	// RGBA TEXTURE
				"vec3 mht_tex = texture2D(mht, mht_coords).xyz;" + 		// RGB TEXTURE
				"vec3 imht_tex = texture2D(imht, mht_coords).xyz;" + 	// RGB TEXTURE

				"float vec_val = getTex(mod(mhb_idx, 4.0), mhb_tex);" +

				"vec3 offset = vec3(vec_val, vec_val, vec_val);" +
				"displacement = displacement + (mht_tex * imht_tex * offset);" +
			"}" +
			
			"new_normal = normalMatrix * normal;" +
			"eye = vec3(modelViewMatrix * vec4((displacement), 1.0));" +
			"gl_Position = projectionMatrix * vec4(eye, 1.0);" +
		"}";

	fragment_shader =		
			// UNIFORMS
			"uniform vec3 light_dir;" +
			"uniform vec3 mat_color;" +
			"uniform vec3 spec_color;" +
			// INPUT FROM VERTEX SHADER
			"varying vec3 new_normal;" +
			"varying vec3 eye;" +	
			
			"void main() " +
			"{" +
				"vec3 new_color = mat_color;" +
				"float lambert = dot(normalize(new_normal),normalize(light_dir));" +
				"vec3 reflection = reflect(-normalize(light_dir), normalize(new_normal));" +
				"float specular = pow(max(dot(normalize(reflection), normalize(eye)), 0.8), 3.14);" +
				"new_color += lambert + spec_color * specular;" +
				"gl_FragColor = vec4(new_color, 1.0);" +
			"}";
	callback(true);
}

// SET CONTROLS -- MOUSE
function setControls()
{
	controls.rotateSpeed = 5.0;
	controls.zoomSpeed = 5;
	controls.panSpeed = 2;
	controls.noZoom = false;
	controls.noPan = true;
	controls.staticMoving = true;
	controls.dynamicDampingFactor = 0.3;
}

// SET CAMERA POSITION
function setCamera(x, y, z)
{
	camera.position.x = x;
	camera.position.y = y;
	camera.position.z = z;
}

// SET SOME LIGHTS
function setLight()
{
	ambientJS = new THREE.AmbientLight(0xffffff);
	directionalLight = new THREE.DirectionalLight(0xffffff);
    directionalLight.position.set(1, 1, 1).normalize();
    scene.add(ambientJS);
    scene.add(directionalLight);
}

// ANIMATE LOOP
function animate() 
{
	controls.update();	
	// IF AUDIO IS PLAYING GET COEFFICIENTS AND UPDATE TEXTURE
	// SEND EVERYTHING TO GPU AND UPDATE MODEL
	if(audio_init && $("#play").is(":disabled") && $("#stop").is(":enabled"))
	{
		// GET COEFFICIENTS FROM AUDIO PROCESSOR
		var imht_coeff = getFrequencies(0.1,2.0, harmonic_count);
		var tmp_buff = new Array();
		initArray(tmp_buff, size_imht, 0.0);
		
		for(var i = 0; i < imht_length; i++)
		{
			tmp_buff[3*i] = imht_coeff[i];			// X
			tmp_buff[(3*i) + 1] = imht_coeff[i];	// Y
			tmp_buff[(3*i) + 2] = imht_coeff[i];	// Z
		}
		imht_data_arr = new Float32Array(tmp_buff);
		
		// RESET IMHT TEXTURE WITH NEW VALUES
		var texture = imht_tex;
		gl.bindTexture(gl.TEXTURE_2D, texture.__webglTexture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, imht_length, imht_length, 0, gl.RGB, gl.FLOAT, new Float32Array(tmp_buff));
		gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE );
		gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE );
		gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );
		gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_NEAREST );
		gl.generateMipmap( gl.TEXTURE_2D );
		gl.bindTexture( gl.TEXTURE_2D, null )  
	} 
	// RE-RENDER
	renderer.render(scene, camera);	
	requestAnimationFrame(animate);
}

// PARSES THE MHB TEXT FILE INTO FLOAT32ARRAY
function parseMHB(mhb_txt, callback)
{
    var out_arr = new Array();
    mhb_txt = mhb_txt.replace(/\r\n/g, "\n");
    mhb_txt = mhb_txt.replace(/\r/g, "\n");
    mhb_txt = mhb_txt.trim();
    mhb_txt = mhb_txt.replace(/\s+/g, '|');
    //alert(mhb_txt);
    var rows = mhb_txt.split("\n");

    for(var i = 0; i < rows.length; i++)
    {
        var columns = rows[i].split("|");
        for(var j = 0; j < columns.length; j++)
        {
            out_arr.push(columns[j]);
        }
    }
    var mhb_arr = new Float32Array(out_arr);
    console.log("MHB Data loaded and parsed.")
    callback(mhb_arr);
}

// LOADS AND SAVES MHB TEXT FILE DATA
function readMHB(mhb_txt_data, callback)
{
 var request = new XMLHttpRequest();
 request.open("GET", mhb_txt_data, true);
 request.onreadystatechange = function ()
    {
        if(request.readyState === 4)
        {
            if(request.status === 200 || request.status == 0)
            {
                var allText = request.responseText;
                
                //alert(allText);   
                callback(allText);
            }
        }
        else
        {
         //?
        }
    }
    request.send(null);
}

// LOADS MODEL 
// @ https://github.com/mrdoob/three.js/blob/master/utils/converters/obj/convert_obj_three.py
function model(callback) {
	
	var obj_path = "models/ship.js";
	var mhb_path = "models/ship.mhb.txt";

	loader = new THREE.BinaryLoader();
	loader.load(obj_path, function ( geometry ) 
	{
		if(geometry != null)
		{
            model_mesh = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial());
            model_mesh.geometry.computeVertexNormals();
			model_mesh.needsUpdate = true;
			model_mesh.geometry.needsUpdate = true;

			vidx_arr = new Array();
			// COMPUTE INDEX ARRAY
			// LABELS VERTICES FROM 0 ---- NUM_VERT-1
			var idx = 0.0;
			for(var i = 0; i < model_mesh.geometry.vertices.length; i++)
			{
				vidx_arr[i] = idx;
				idx = idx + 1.0;
			}
							
			
			readMHB(mhb_path, function ( mhb_ ) 
			{
				mhb_txt_data = mhb_;
				parseMHB(mhb_, function ( mhb_arr )
				{
					mhb(mhb_arr);
					scene.add(model_mesh);
					console.log("Model Initialized.")
					callback(true);	
				});
			});
                           
        }
        else
        {
        	console.log("Model not found");
        }
    });
}

// INITIALIZE ARRAYS
function initArray(arr, size, fill)
{
	for(var i = 0; i < size; i++)
	{
		// fill with 0's / 1's
		arr.push(fill);
	}

}

// DO THE MHB PROCESSING
// COMPUTE MHT AND IMHT
// SET TEXTURES
// SEND UNIFORMS + ATTRIBUTES TO SHADER
function mhb(mhb_data)
{
	num_vert = mhb_data.length / harmonic_count;
    
	mhb_length = nearest_pow2(mhb_data.length / 4);
    mht_length = nearest_pow2(harmonic_count);
	imht_length = nearest_pow2(harmonic_count);
	
    size_mhb = mhb_length*mhb_length*4;
    size_mht = mht_length*mht_length*3;
	size_imht = imht_length*imht_length*3;
	

	if(debug == true)
	{
		console.log("MHB LENGTH: " + mhb_length);
		console.log("MHT LENGTH: " + mht_length);
		console.log("IMHT LENGTH: " + imht_length);
	
		console.log("MHB TEX SIZE: " + size_mhb);
		console.log("MHT TEX SIZE: " + size_mht);
		console.log("IMHT TEX SIZE:" + size_imht);
	
	}

    var mhb_buff = new Array();
    var mht_buff = new Array();
	var imht_buff = new Array();

    initArray(mhb_buff, size_mhb, 0.0);
    initArray(mht_buff, size_mht, 0.0);
	initArray(imht_buff, size_imht, 1.0);

	// MHT ---- START
    for(var i = 0; i < size_mhb * 4; ++i)
    {
    	if(i < mhb_data.length)
    	{
    		mhb_buff[i] = mhb_data[i];
    	}
    }
    mhb_data_arr = new Float32Array(mhb_buff);
    mhb_tex = getNewTexture(mhb_buff, mhb_length, gl.RGBA, "mhb");
	// MHT ---- END

	// MHT ---- START
	for(var i = 0; i < num_vert; i++)
	{
		for(var j = 0; j < harmonic_count; j++)
		{
			mht_buff[3 * j] += model_mesh.geometry.vertices[i].x * mhb_data_arr[j * num_vert + i];			// x
			mht_buff[(3 * j) + 1] += model_mesh.geometry.vertices[i].y * mhb_data_arr[j * num_vert + i];	// y
			mht_buff[(3 * j) + 2] += model_mesh.geometry.vertices[i].z * mhb_data_arr[j * num_vert + i];	// z
		}
	}
	mht_data_arr = new Float32Array(mht_buff);
	mht_tex = getNewTexture(mht_buff, mht_length, gl.RGB, "mht");
	// MHT ---- END

	// IMHT ---- START
	imht_data_arr = new Float32Array(imht_buff);
	imht_tex = getNewTexture(imht_buff, imht_length, gl.RGB, "imht");
	// IMHT ---- END
	
	

	// SEND TEXTURES TO SHADER
	setMaterial();
}

// SETS SHADER UNIFORMS AND ATTRIBUTES
function setMaterial()
{
	shader_info = 
	{	
		mhb: {type: "t", value: 0, texture: mhb_tex},
		mht: {type: "t", value: 1, texture: mht_tex},
		imht: {type: "t", value: 2, texture: imht_tex},
		light_dir:  {type: "v3", value: new THREE.Vector3(1.0, 0.0, 0.0)},
		mat_color: {type: "v3", value: new THREE.Vector3(0.64, 0.36, 0.0)},
		spec_color: {type: "v3", value: new THREE.Vector3(0.9, 0.7, 0.3)},
		num_vert: {type: "f", value: num_vert},
		mhb_size: {type: "f", value: mhb_length},
		mht_size: {type: "f", value: mht_length}
	};

	var attributes = { vertex_idx : { type : "f", value: [] } };

	for(var i = 0; i < vidx_arr.length; i++)
	{
		attributes.vertex_idx.value.push(vidx_arr[i]);
	}
	
	model_mesh.material = new THREE.ShaderMaterial({
										uniforms: shader_info,
										attributes: attributes,
										vertexShader: vertex_shader,
										fragmentShader: fragment_shader
	});
	console.log("Shaders set.");
}

// COMPUTES THE NEAREST POWER OF 2
// NOTE: WEBGL TEXTURES LIKE TO BE A POWER OF 2
function nearest_pow2( n )
{
	 var l = Math.log( n ) / Math.LN2;
	 return Math.pow( 2, Math.round(  l ) );
}

// GENERATES AND RETURNS A NEW TEXTURE WITH
// BUFFER = TEXTURE DATA
// RGB = GL.RGB | GL.RGBA
// SIZE = (WIDTH == HEIGHT)
function getNewTexture(buffer, size, rgb, debug_tex)
{
	var float_ext = gl.getExtension("OES_texture_float");
		

	if(float_ext == null)
	{
		console.log("FLOAT TEXTURES NOT SUPPORTED!");
	}
	
	if(debug == true)
	{
		console.log("DEBUG: " + debug_tex);
		console.log("TEXTURE SIZE: " + size);
		console.log("BUFFER(" + buffer.length + ")"); // + buffer);
		console.log("TYPE: " + rgb);
	}
	var texture = new THREE.Texture();
	texture.needsUpdate = false;
	texture.__webglTexture = gl.createTexture();
	gl.bindTexture( gl.TEXTURE_2D, texture.__webglTexture );
	gl.texImage2D(gl.TEXTURE_2D, 0, rgb, size, size, 0, rgb, gl.FLOAT, new Float32Array(buffer));
	texture.__webglInit = false;
	gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE );
	gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE );
	gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );
	gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_NEAREST );
	gl.generateMipmap( gl.TEXTURE_2D );
	if(debug == true)
	{
		console.log("TEXTURE: " + texture);
	}
	return texture;
}