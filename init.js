// 720P HD
var canvas_w = 1280;
var canvas_h = 720;

var canvas;
var renderer;
var camera;
var controls;
var scene;
var gl;

var ratio = (canvas_w / canvas_h);
var ambient;
var directionalLight;
var loader;
var manager;
var gain = 5;
var model;
var mhb_loaded = false;
var vertexArray;
var posArray;
var model_mesh;
var vertex_shader;
var fragment_shader;
var mhb_file_data_txt;
var mhb_file_data_arr;
var mhb_data_arr;

function init()
{
	initAudio();
	initShaders();
	posArray = new Array();
	//console.log("MHB INFO: " + mhb);
	canvas = document.getElementById("canvas");
	renderer = new THREE.WebGLRenderer({ clearAlpha: 1, antialias: true } );

	canvas.appendChild(renderer.domElement);
	gl = renderer.getContext();
	gl.clearColor(0.0, 0.52, 0.63, 1.0);
	scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera(20, ratio, 0.1, 1000);
	setCamera(10,10,10);
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
	vertex_shader = 
	"uniform sampler2D mhb; " +
	"uniform sampler2D mht; " +
	"uniform sampler2D imht; " +
	"uniform sampler2D diff; " +
	"uniform int num_vert; " +
	"uniform int num_harm; " +
	"uniform int mhb_size; " +
	"uniform int mht_size; " +
	"uniform int diff_size; "+
 
	"varying vec3 normal_v; "+
	"varying vec3 eye; "+
	
	
	"vec2 texCoord(float tex_size, float vidx) "+
	"{ " +
		"float x = floor(vidx / tex_size); " +
		"float y = mod(vidx, tex_size); " +
		"return vec2(y/(tex_size - 1.0), x/(tex_size - 1.0)); " +
	"}" +
    
	"vec2 textCoordRGB(float tex_size, float vidx) "+
	"{"+
		"float tex_idx = floor(vidx / 4.0); "+
		"float x = floor(tex_idx / tex_size); "+
		"float y = mod(tex_idx , tex_size); "+
		"return vec2(y/(tex_size - 1.0), x/(tex_size - 1.0)); "+
	"}" +
	
	"void main() "+
	"{ "+
		"vec3 pos = vec3(0.0, 0.0, 0.0); "+
		
		"float vidx = position.x; "+
		
		"for(int i = 0; i < 50; i++) "+
		"{ "+
			"float mhb_idx = float(i) * float(num_vert) + vidx; "+
			"vec2 mhb_coords = textCoordRGB(float(mhb_size), mhb_idx); "+
			"vec4 mhb_texel = texture2D(mhb, mhb_coords).xyzw; "+
			
			"vec2 mht_coords = texCoord(float(mht_size), float(i)); "+
			"vec3 coeffs = texture2D(mht, mht_coords).xyz; "+
			"vec3 imht_coord = texture2D(imht, mht_coords).xyz; "+
			
			
			"float mhb_val; "+
			"int mhb_coord = int(mod(mhb_idx, 4.0)); "+
			
			"if(mhb_coord == 0) "+
			"{" +
				"mhb_val = mhb_texel[0]; "+
			"} "+
			"else if(mhb_coord == 1) "+
			"{ "+
				"mhb_val = mhb_texel[1]; "+
			"} "+
			"else if(mhb_coord == 2) "+
			"{ "+
				"mhb_val = mhb_texel[2]; "+
			"} "+
			"else if (mhb_coord == 3) "+
			"{ "+
				"mhb_val = mhb_texel[3]; "+
			"} "+
			"vec3 mhb_vec_val = vec3(mhb_val, mhb_val, mhb_val); "+
			"pos = pos + (coeffs * imht_coord * mhb_vec_val); "+
		"}" +
		
		"vec2 diff_coords = texCoord(float(diff_size), vidx); "+
		"vec3 diff_vec = texture2D(diff, diff_coords).xyz; "+
		
		"normal_v = normalMatrix* normal; "+
		"eye = vec3(modelViewMatrix * vec4((pos + diff_vec), 1.0)); "+
		"gl_Position = projectionMatrix * vec4(eye, 1.0); "+
	"}";

	fragment_shader = 
	"uniform vec3 ambient;" +
	"uniform vec3 light_dir;" +
	"uniform vec3 color;" +
	"uniform vec3 mat_color;" +
	"uniform vec3 spec_color;" +

	"varying vec3 normal_v;" +
	"varying vec3 eye;" +	
				
	"void main() " +
	"{" +
		"float l = max(dot(normalize(normal_v), normalize(light_dir)), 0.0);" +
		"vec3 lightMag = ambient + color * l;" +
				
		"vec3 color = mat_color;" +
		"float lambert = dot(normalize(normal_v),normalize(light_dir));" +

		"if(lambert > 0.0)" +
		"{" +
			"vec3 reflection = reflect(-normalize(light_dir), normalize(normal_v));" +
			"float specular = pow( max(dot(normalize(reflection), normalize(eye)), 0.0), 15.0);" +
			"color += color * lambert + spec_color * specular;" +
		"}" +
					
		"gl_FragColor = vec4(color, 1.0);" +
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

var geo;
function setLoader()
{
	
	loader.load('models/ship.obj', function ( object )
	{
		
		//var material = new THREE.MeshLambertMaterial({ color: 0xa65e00 });
		model = object;
		if(object instanceof THREE.Object3D)
		{
			object.traverse(function ( mesh )
			{
				if(mesh instanceof THREE.Mesh)
				{
					
					mesh.material = new THREE.MeshLambertMaterial({ color: 0xa65e00 });
					mesh.geometry.computeVertexNormals();
					mesh.geometry.computeFaceNormals();	
					model_mesh = mesh;
					console.log(mesh.geometry);
				}
			});

		}
		object.position.x = 0;
		object.position.y = 0;
		object.position.z = 0;
		object.scale.set(5,5,5);

		//compute pos array;

		readMHB("models/ship.mhb.txt", function ( mhb_ )
		{
			parseMHB(mhb_, function ( mhb_arr )
			{
				//mhb(mhb_arr);
			});
		});
		scene.add(object);
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
	controls.noPan = false;
	controls.staticMoving = true;
	controls.dynamicDampingFactor = 0.3;
}


function animate()
{

	controls.update();
	camera.lookAt(scene.position);
	if(playing)
	{
		var coeffs = getCoefficients(gain,0.1,2.0,50);
		
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

function initArray(arr, size, fill)
{
	for(var i = 0; i < size; i++)
	{
		// fill with 0's / 1's
		arr.push(fill);
	}

}

function mhb(mhb_data)
{
	
	var harmonic_count = 50;
	var vert_count = mhb_data.length / harmonic_count;

	var mhb_length = Math.pow(2, Math.ceil( Math.log(Math.ceil(Math.sqrt(mhb_data.length/4))) / Math.log(2)));
	var mht_length = Math.pow(2, Math.ceil( Math.log(Math.ceil(Math.sqrt(harmonic_count))) / Math.log(2)));
	var imht_length = Math.pow(2, Math.ceil( Math.log(Math.ceil(Math.sqrt(harmonic_count))) / Math.log(2)));
	var diff_length = Math.pow(2, Math.ceil( Math.log(Math.ceil(Math.sqrt(vert_count))) / Math.log(2)));
	console.log("MHB Length: " + mhb_length);
	console.log("MHT Length: " + mht_length);

	var size_mhb = mhb_length*mhb_length*4;
	var size_mht = mht_length*mht_length*3;
	var size_imht = imht_length*imht_length*3;
	var size_diff = diff_length*diff_length*3;
		
	console.log("Vert count: " +vert_count);	

	// MHB -- START
	var mhb_buff = new Array();
	initArray(mhb_buff, size_mhb, 0);
	// RANGE ERROR IN CHROME ;(
	//Array.apply(null, new Array(size_mhb)).map(Number.prototype.valueOf,0);
	for(var i = 0; i < size_mhb; i++)
	{
		if( i < mhb_data.length)
		{
			mhb_buff.push(mhb_data[i]);
		}
	}

	var mhb_tex = getNewTexture();
	var rgb = gl.RGBA;
	setTexture(mhb_tex, mhb_length, mhb_buff, rgb);
	// MHB -- END

	// MHT -- START
	var mht_buff = new Array();
	initArray(mht_buff, size_mht, 0);
	// RANGE ERROR IN CHROME ;(
	//Array.apply(null, new Array(size_mht)).map(Number.prototype.valueOf,0);
	for(var i = 0; i < vert_count; i++)
	{
		for(var j = 0; j < harmonic_count; j++)
		{
			mht_buff[(3*j)] += posArray[(i*3)] + mhb_buff[j * vert_count + i];
			mht_buff[(3*j) + 1] += posArray[(i*3) + 1] + mhb_buff[j * vert_count + i];
			mht_buff[(3*j) + 2] += posArray[(i*3) + 2] + mhb_buff[j * vert_count + i];
		}
	}

	var mht_tex = getNewTexture();
	rgb = gl.RGB;
	setTexture(mht_tex, mht_length, mht_buff, rgb);
	// MHT -- END


	// Inverse MHT -- START
	var imht_buff = new Array();
	initArray(imht_buff, size_imht, 1);
	// RANGE ERROR IN CHROME ;(
	//Array.apply(null, new Array(size_imht)).map(Number.prototype.valueOf,0);
	var imht_tex = getNewTexture();
	setTexture(imht_tex, imht_length, imht_buff, rgb);
	// Inverse MHT -- END

	// 
	var reconstructed = new Array();
	var difference = new Array();
	initArray(reconstructed, vert_count, 0);
	initArray(difference, vert_count, 0);
	for(var i = 0; i < vert_count; i++)
	{
		for(var j = 0; j < harmonic_count; j++)
		{
			reconstructed[(3*i)] += mht_buff[(j*3)] * mhb_buff[j*vert_count + i];
			reconstructed[(3*i) + 1] += mht_buff[(j*3) + 1] * mhb_buff[j*vert_count + i];
			reconstructed[(3*i) + 2] += mht_buff[(j*3) + 2] * mhb_buff[j*vert_count + i];
		}
	}


	for(var i = 0; i < vert_count; i++)
	{
		difference[(3*i)] = posArray[(3*i)] - reconstructed[(3*i)];
		difference[(3*i) + 1] = posArray[(3*i) + 1] - reconstructed[(3*i) + 1];
		difference[(3*i) + 2] = posArray[(3*i) + 2] - reconstructed[(3*i) + 2];
	}

	var diff_tex = getNewTexture();

	for(var i = difference.length; i < size_diff; i++)
	{
		difference.push(0);
	}
	setTexture(diff_tex, diff_length, difference, rgb);

	setShader(mhb_tex, mht_tex, imht_tex, diff_tex, vert_count, harmonic_count, mhb_length, mht_length, diff_length);
}

function getNewTexture()
{
	var texture = new THREE.Texture();
	texture.needsUpdate = false;
	texture.__webglTexture = gl.createTexture();
	texture.__webglInit = false;
	return texture;
}

function setTexture(texture, buffer, size, type)
{
	gl.bindTexture(gl.TEXTURE_2D, texture.__webglTexture);
	gl.texImage2D(gl.TEXTURE_2D, 0, type, size, size, 0, type, gl.FLOAT, new Float32Array(buffer));
	gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE );
	gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE );
	gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );
	gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_NEAREST );
	gl.generateMipmap( gl.TEXTURE_2D );
	gl.bindTexture( gl.TEXTURE_2D, null );
}

// diffSize / diffTex?
function setShader(mhb_text, mht_text, imht_text, diff_text, vert_count, harmonic_count, mhb_size, mht_size, diff_size)
{
	var shader_vars =
	{
		mhb  : {type : "t", value : 0, texture : mhb_text},
		mht  : {type : "t", value : 1, texture : mht_text},
		imht : {type : "t", value : 2, texture : imht_text},
		diff : {type : "t", value : 3, texture : diff_text},
		ambient    : {type : "v3", value : new THREE.Vector3(1.0, 1.0, 1.0)},
		light_dir  : {type : "v3", value : new THREE.Vector3(1.0, 0.0, 0.0)},
		color      : {type : "v3", value : new THREE.Vector3(0.2, 0.4, 0.3)},
		mat_color  : {type : "v3", value : new THREE.Vector3(0.2, 0.6, 1.0)},
		spec_color : {type : "v3", value : new THREE.Vector3(0.3, 0.6, 0.5)},
		num_vert  : { type : "i", value : vert_count},
		num_harm  : { type : "i", value : harmonic_count},
		mhb_size  : { type : "i", value : mhb_size},
		mht_size  : { type : "i", value : mht_size},
		diff_size : { type : "i", value : diff_size}
	};

	model_mesh.material = new THREE.ShaderMaterial
	({
		uniforms: shader_vars,
		vertexShader : vertex_shader,
		fragmentShader : fragment_shader
	});

}