// 720P HD
var canvas_w = 1280;
var canvas_h = 720;

// WEBGL
var canvas;
var renderer;
var camera;
var controls;
var scene;
var gl;
var ratio = (canvas_w / canvas_h);

// LIGHT
var ambient;
var directionalLight;
var angle = 1.0;

// UTIL
var loader;
var manager;

// IMPORTANT VARS
var gain = 5;
var posArray;
var model_mesh;

// SHADER STUFF
var shader_vars;
var vertex_shader;
var fragment_shader;

// DEBUG VARS
var debug;
var mhb_data_arr;
var mht_data_arr;
var imht_data_arr;
var diff_data_arr;

// Textures
var mhb_tex;
var mht_tex;
var imht_tex;
var diff_tex;
var mhb_parse_data;

// 
var harmonic_count;
var audio_intialized = false;


function init()
{
	debug = false;
	harmonic_count = 50;
	initAudio( function ( initialized )
	{
		audio_intialized = initialized;
	});
	initShaders();
	posArray = new Array();
	//console.log("MHB INFO: " + mhb);
	canvas = document.getElementById("canvas");
	renderer = new THREE.WebGLRenderer({ clearAlpha: 1, antialias: true } );

	canvas.appendChild(renderer.domElement);
	gl = renderer.getContext();
	gl.clearColor(0.0, 0.52, 0.63, 1.0);
	scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera(20, ratio, 0.1, 10000);
	setCamera(0,0,1);
	setLight();
	scene.add(camera);
		
	manager = new THREE.LoadingManager();
	manager.onProgress  = function(item, loaded, total)
	{
		console.log("Model loaded:" + item, loaded, total);
	}
	loader = new THREE.OBJLoader(manager);
	setLoader();
	
	controls = new THREE.TrackballControls(camera, renderer.domElement);
	setControls();

	renderer.setSize(canvas_w, canvas_h);
	console.log('WebGL initialized.')
	animate();
}

function initShaders()
{
	// TODO: FIND OUT WHY OBJECT DISAPPEARS
	// SOMETHING TODO WITH THE POS VECTOR???
	vertex_shader = 
	"uniform sampler2D mhb; \n" +
	"uniform sampler2D mht; \n" +
	"uniform sampler2D imht; \n" +
	"uniform sampler2D diff; \n" +
	"uniform int num_vert; \n" +

	"uniform int mhb_size; \n" +
	"uniform int mht_size; \n" +
	"uniform int diff_size; \n"+

	"varying vec3 normal_v; \n"+
	"varying vec3 eye; \n"+
	"const int num_harmonics = 50;\n" +
	
	"vec2 texCoord(float tex_size, float vidx) \n"+
	"{ \n" +
		"float x = floor(vidx / tex_size); \n" +
	 	"float y = mod(vidx, tex_size); \n" +
	 	"return vec2(y/(tex_size - 1.0), x/(tex_size - 1.0)); \n" +
	"}\n" +
    
	"vec2 texCoordRGB(float tex_size, float vidx) \n"+
	"{\n"+
	 	"float tex_idx = floor(vidx / 4.0); \n"+
	 	"float x = floor(tex_idx / tex_size); \n"+
	 	"float y = mod(tex_idx , tex_size); \n"+
	 	"return vec2(y/(tex_size - 1.0), x/(tex_size - 1.0)); \n"+
	"}\n" +
	
 
	"void main() \n"+
	"{ \n"+
	 	"vec3 displacement = vec3(0.0, 0.0, 0.0); \n"+
		
	 	"float vidx = position.x; \n"+
		
	 	"for(int i = 0; i < num_harmonics; i++) \n"+
	 	"{ \n"+
	 		"float mhb_idx = float(i) * float(num_vert) + vidx; \n"+
	 		"vec2 mhb_coords = texCoordRGB(float(mhb_size), mhb_idx); \n"+
	 		"vec4 mhb_texel = texture2D(mhb, mhb_coords).xyzw; \n"+
			
	 		"vec2 mht_coords = texCoord(float(mht_size), float(i)); \n"+
	 		"vec3 coeffs = texture2D(mht, mht_coords).xyz; \n"+
	 		"vec3 imht_coord = texture2D(imht, mht_coords).xyz; \n"+
			
	 		"float mhb_val; \n"+
	 		"int mhb_coord = int(mod(mhb_idx, 4.0)); \n"+
			
	 		"if(mhb_coord == 0) \n"+
	 		"{\n" +
	 			"mhb_val = mhb_texel[0]; \n"+
	 		"} \n"+
	 		"else if(mhb_coord == 1) \n"+
	 		"{ \n"+
	 			"mhb_val = mhb_texel[1]; \n"+
	 		"} \n"+
	 		"else if(mhb_coord == 2) \n"+
	 		"{ \n"+
	 			"mhb_val = mhb_texel[2]; \n"+
	 		"} \n"+
	 		"else if (mhb_coord == 3) \n"+
	 		"{ \n"+
	 			"mhb_val = mhb_texel[3]; \n"+
	 		"} \n"+
	 		"vec3 mhb_vec_val = vec3(mhb_val, mhb_val, mhb_val); \n"+
	 		"displacement = displacement + (coeffs * imht_coord * mhb_vec_val) ; \n"+
	 	"}\n" +
		
		"vec2 diff_coords = texCoord(float(diff_size), vidx); \n"+
	  	"vec3 diff_vec = texture2D(diff, diff_coords).xyz; \n"+
		
	 	"normal_v = normalMatrix * normal; \n"+
	 
	 	"eye = vec3(modelViewMatrix * vec4((displacement + diff_vec), 1.0)); \n"+
	 	"gl_Position = projectionMatrix * vec4(eye, 1.0); \n"+
	"}";

	fragment_shader = 
	"uniform vec3 ambient; \n" +
	"uniform vec3 light_dir;\n" +
	"uniform vec3 color;\n" +
	"uniform vec3 mat_color;\n" +
	"uniform vec3 spec_color;\n" +

	"varying vec3 normal_v;\n" +
	"varying vec3 eye;\n" +	
				
	"void main() \n" +
	"{\n" +
		 "vec3 color = mat_color;\n" +
		 "float lambert = dot(normalize(normal_v),normalize(light_dir));\n" +

		 
		 "vec3 reflection = reflect(-normalize(light_dir), normalize(normal_v));\n" +
		 "float specular = pow( max(dot(normalize(reflection), normalize(eye)), 0.0), 15.0);\n" +
		 "color += color * lambert + spec_color * specular;\n" +
					
		 "gl_FragColor = vec4(color, 1.0);\n" +
 	"}";


}

function setLight()
{
	ambient = new THREE.AmbientLight(0xffffff);
	directionalLight = new THREE.DirectionalLight(0xffffff);
    directionalLight.position.set(1, 1, 1).normalize();
    scene.add(ambient);
    scene.add(directionalLight);
}


function setLoader()
{
	
	loader.load('models/ship.obj', function ( object )
	{
		posArray = new Array();
		//var material = new THREE.MeshLambertMaterial({ color: 0xa65e00 });
		//model = object;
		if(object instanceof THREE.Object3D)
		{
			object.traverse(function ( mesh )
			{
				if(mesh instanceof THREE.Mesh)
				{
					
					//mesh.material = new THREE.MeshLambertMaterial({ color: 0xa65e00 });
					mesh.geometry.computeVertexNormals();
					mesh.geometry.computeFaceNormals();	
					
					var vertexArray = mesh.geometry.vertices;
					var idx = 0;
					//compute pos array
					for(var i = 0; i < vertexArray.length; i++)
					{
						posArray.push(vertexArray[i].x);
						posArray.push(vertexArray[i].y);
						posArray.push(vertexArray[i].z);
						
						mesh.geometry.vertices[i].x = idx;
						idx++;
					}
					posArray = new Float32Array(posArray);
					mesh.needsUpdate = true;
					mesh.geometry.needsUpdate = true;
					model_mesh = mesh;
					//console.log(mesh.geometry);
				}
			});
		}
		model_mesh.scale.set(0.2,0.2,0.2);

		readMHB("models/ship.mhb.txt", function ( mhb_ )
		{
			parseMHB(mhb_, function ( mhb_arr )
			{
			//	mhb_parse_data = mhb_arr;
			//	mhb(mhb_arr);
				mhb(mhb_arr, function ( done )
				{
					if(done == true)
					{
						
						scene.add(model_mesh);
					}
					// add object to scene
				});
			});
			// mhb(mhb_, function ( done )
			// 	{
			// 		if(done == true)
			// 		{
						
			// 			scene.add(model_mesh);
			// 		}
			// 		// add object to scene
			// 	});
		});
		
	});
	
}

function setCamera(x,y,z)
{
	camera.position.set(x,y,z);
}


function setControls()
{
	controls.rotateSpeed = 5.0;
	controls.zoomSpeed = 5;
	controls.panSpeed = 2;
	controls.noZoom = false;
	controls.noPan = true;
	controls.staticMoving = true;
	controls.dynamicDampingFactor = 0.3;
	controls.target.set(0, 0, 0);
}

var imht_coeff;
function animate()
{
	controls.update();
	camera.lookAt(scene.position);

	if(audio_intialized && $("#play").is(":disabled") && $("#stop").is(":enabled"))
	{
		var x = Math.sin(angle);
		var y = Math.cos(angle);
		var z = Math.cos(angle); 
		
		shader_vars.light_dir.value = new THREE.Vector3(x, y, z);
		angle += 0.05;
	
		var coeffs = getCoefficients(gain,0.2,1.7,50);
		var coeff_length = Math.pow(2, Math.ceil( Math.log(Math.ceil(Math.sqrt(harmonic_count))) / Math.log(2)));
		var size_coeff = coeff_length*coeff_length*3;

		var coeff_buff = new Array();
		initArray(coeff_buff, size_coeff, 0);

		for(var i = 0; i < coeffs.length; i++)
		{
			coeff_buff[(3*i)] = coeffs[i];
			coeff_buff[(3*i) + 1] = coeffs[i];
			coeff_buff[(3*i) + 2] = coeffs[i];
		}
		imht_coeff = new Float32Array(coeff_buff);
		gl.bindTexture(gl.TEXTURE_2D, imht_tex.__webglTexture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, coeff_length, coeff_length, 0, gl.RGB, gl.FLOAT, new Float32Array(coeff_buff));
		gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE );
		gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE );
		gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );
		gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_NEAREST );
		gl.generateMipmap( gl.TEXTURE_2D );
		gl.bindTexture( gl.TEXTURE_2D, null )  		
	}
	renderer.render(scene,camera);
	requestAnimationFrame(animate);

}

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
	var float32arr = new Float32Array(out_arr);
	console.log("Parsed MHB Array size: " + float32arr.length);
	callback(float32arr);
}

function readMHB(mhb, callback)
{
 var request = new XMLHttpRequest();
 request.open("GET", mhb, true);
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

function readMHBBIN(mhb, callback)
{
	var request = new XMLHttpRequest();
    request.open("GET", mhb, true);
    request.responseType = "arraybuffer";
    
    request.onload = function(o)
    {
    	var arr = request.response;
    	if(arr)
    	{
    		arr = new Float32Array(arr);
    		
    		callback(arr);
    	}	
    }
    
    request.send(null);
    
}

function initArray(arr, size, fill)
{
	for(var i = 0; i < size; i++)
	{
		// fill with 0's / 1's
		arr.push(fill);
	}

}

function mhb(mhb_data, callback)
{
	var vert_count = mhb_data.length / harmonic_count;

	var mhb_length = Math.pow(2, Math.ceil( Math.log(Math.ceil(Math.sqrt(mhb_data.length/4))) / Math.log(2)));
	var mht_length = Math.pow(2, Math.ceil( Math.log(Math.ceil(Math.sqrt(harmonic_count))) / Math.log(2)));
	var imht_length = Math.pow(2, Math.ceil( Math.log(Math.ceil(Math.sqrt(harmonic_count))) / Math.log(2)));
	var diff_length = Math.pow(2, Math.ceil( Math.log(Math.ceil(Math.sqrt(vert_count))) / Math.log(2)));

	if(debug == true)
	{
		console.log("MHB Length: " + mhb_length);
		console.log("MHT Length: " + mht_length);
		console.log("IMHT Length:" + imht_length);
		console.log("DIFF Length:" + diff_length);
		console.log("Vert count: " + vert_count);	
	}
	var size_mhb = mhb_length*mhb_length*4;
	var size_mht = mht_length*mht_length*3;
	var size_imht = imht_length*imht_length*3;
	var size_diff = diff_length*diff_length*3;
		
	

	// MHB -- START
	var mhb_buff = new Array();
	initArray(mhb_buff, size_mhb, 0);
	// RANGE ERROR IN CHROME ;(
	//Array.apply(null, new Array(size_mhb)).map(Number.prototype.valueOf,0);
	for(var i = 0; i < size_mhb; i++)
	{
		if( i < mhb_data.length)
		{
			mhb_buff[i] = mhb_data[i];
		}
	}
	mhb_data_arr = new Float32Array(mhb_buff);
	var rgb = gl.RGBA;
	mhb_tex = getNewTexture(mhb_buff, mhb_length, rgb, "mhb");
	
	
	// MHB -- END

	// MHT -- START
	var mht_buff = new Array();
	initArray(mht_buff, size_mht, 0);
	// RANGE ERROR IN CHROME ;(
	//Array.apply(null, new Array(size_mht)).map(Number.prototype.valueOf,0);
	for(var i = 0; i < vert_count; ++i)
	{
		for(var j = 0; j < harmonic_count; ++j)
		{
			mht_buff[(3*j)] += posArray[(i*3)] * mhb_data_arr[j * vert_count + i];
			mht_buff[(3*j) + 1] += posArray[(i*3) + 1] * mhb_data_arr[j * vert_count + i];
			mht_buff[(3*j) + 2] += posArray[(i*3) + 2] * mhb_data_arr[j * vert_count + i];
		}
	}
	mht_data_arr = new Float32Array(mht_buff);
	rgb = gl.RGB;
	mht_tex = getNewTexture(mht_buff, mht_length, rgb, "mht");
	// MHT -- END


	// Inverse MHT -- START
	// Will be filled with info from Audio Processor
	var imht_buff = new Array();
	initArray(imht_buff, size_imht, 1);
	// RANGE ERROR IN CHROME ;(
	//Array.apply(null, new Array(size_imht)).map(Number.prototype.valueOf,0);
	imht_data_arr = new Float32Array(imht_buff);
	imht_tex = getNewTexture(imht_buff, imht_length, rgb, "imht");
	
	// Inverse MHT -- END

	// DIFF -- START
	var reconstructed = new Array();
	var difference = new Array();

	initArray(reconstructed, vert_count*3, 0);
	initArray(difference, vert_count*3, 0);
	
	for(var i = 0; i < vert_count; i++)
	{
		for(var j = 0; j < harmonic_count; j++)
		{
			reconstructed[(3*i)] += mht_data_arr[(j*3)] * mhb_data[j*vert_count + i];			// x
			reconstructed[(3*i) + 1] += mht_data_arr[(j*3) + 1] * mhb_data[j*vert_count + i];   // y
			reconstructed[(3*i) + 2] += mht_data_arr[(j*3) + 2] * mhb_data[j*vert_count + i];   // z
		}
	}

	for(var i = 0; i < vert_count; i++)
	{
		difference[(3*i)] = posArray[(3*i)] - reconstructed[(3*i)];				// x
		difference[(3*i) + 1] = posArray[(3*i) + 1] - reconstructed[(3*i) + 1]; // y
		difference[(3*i) + 2] = posArray[(3*i) + 2] - reconstructed[(3*i) + 2]; // z
		//console.log("I: " + i);
	}

	//console.log("DIFF LENGTH: " + difference.length);

	for(var i = difference.length; i < size_diff; i++)
	{
		//console.log("I:" + i);
		difference.push(0.0);
	}
	diff_data_arr = new Float32Array(difference);

	diff_tex = getNewTexture(difference, diff_length, rgb, "diff");
	// DIFF -- END
	// TODO: Object disappears?
	setShader(mhb_tex, mht_tex, imht_tex, diff_tex, vert_count, harmonic_count, mhb_length, mht_length, diff_length);

	callback(true);
}



function getNewTexture(buffer, size, type, debug_tex)
{
	if (!gl.getExtension("OES_texture_float")) {
		console.log("Requires OES_texture_float extension");
	}
	// DEBUG
	if(debug == true)
	{
		console.log("DEBUG: " + debug_tex);
		console.log("TEXTURE SIZE: " + size);
		console.log("BUFFER(" + buffer.length + "): " + buffer);
		console.log("TYPE: " + type);
	}
	var texture = new THREE.Texture();
	texture.needsUpdate = false;
	texture.__webglTexture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture.__webglTexture);
	gl.texImage2D(gl.TEXTURE_2D, 0, type, size, size, 0, type, gl.FLOAT, new Float32Array(buffer));
	texture.__webglInit = false;
	gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE );
	gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE );
	gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );
	gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_NEAREST );
	gl.generateMipmap( gl.TEXTURE_2D );
	gl.bindTexture( gl.TEXTURE_2D, null );
	if(debug == true)
	{
		console.log("TEXTURE: " + texture);
	}
	return texture;
}

// diffSize / diffTex?
function setShader(mhb_text, mht_text, imht_text, diff_text, vert_count, mhb_size, mht_size, diff_size)
{
	shader_vars =
	{
		mhb  : {type : "t", value : 0, texture : mhb_text},
		mht  : {type : "t", value : 1, texture : mht_text},
		imht : {type : "t", value : 2, texture : imht_text},
		diff : {type : "t", value : 3, texture : diff_text},
		num_vert  : { type : "i", value : vert_count},
		mhb_size  : { type : "i", value : mhb_size},
		mht_size  : { type : "i", value : mht_size},
		diff_size : { type : "i", value : diff_size},
		ambient    : {type : "v3", value : new THREE.Vector3(1.0, 1.0, 1.0)},
		light_dir  : {type : "v3", value : new THREE.Vector3(1.0, 0.0, 0.0)},
		color      : {type : "v3", value : new THREE.Vector3(0.64, 0.36, 0.0)},
		mat_color  : {type : "v3", value : new THREE.Vector3(0.64, 0.36, 0.0)},
		spec_color : {type : "v3", value : new THREE.Vector3(0.64, 0.36, 0.0)}
	};

	model_mesh.material = new THREE.ShaderMaterial
	({
		uniforms: shader_vars,
		vertexShader : vertex_shader,
		fragmentShader : fragment_shader
	});
	//console.log("SHADER FUNC: " + model_mesh.material);
}