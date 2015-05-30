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
var mhb_data;
var model;
var mhb_loaded = false;
function init()
{
	initAudio();
	
	//console.log("MHB INFO: " + mhb);
	canvas = document.getElementById("canvas");
	renderer = new THREE.WebGLRenderer({ clearAlpha: 1, antialias: true } );

	canvas.appendChild(renderer.domElement);
	gl = renderer.getContext();

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
	readMHB("models/male.mhb", function(mhb_)
	{
		mhb_data = mhb_;
		mhb(model);
	});
	
	controls = new THREE.TrackballControls(camera, renderer.domElement);
	setControls();

	renderer.setSize(canvas_w, canvas_h);
	console.log('WebGL initialized.')
	animate();
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
	
	loader.load('models/male.obj', function ( object ) 
	{
		var model = new THREE.Mesh(object);
		object.position.x = 0;
		object.position.y = 0;
		object.position.z = 0;
  		//object.scale.set(0.2,0.2,);
  		model = object;
  
		scene.add(object);
	}
	);
	
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

function readMHB(mhb_fp, callback)
{
	var request = new XMLHttpRequest();
	request.open("GET", mhb_fp, true);
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

function initArray(arr, size)
{
	for(var i = 0; i < size; i++)
	{
		// fill with 0's
		arr.push(0);
	}

}

function mhb(model)
{
	
	var harmonic_count = 50;
	var vert_count = mhb_data.length / harmonic_count;

	var mhb_length = Math.pow(2, Math.ceil( Math.log(Math.ceil(Math.sqrt(mhb_data.length/4))) / Math.log(2)));
	var mht_length = Math.pow(2, Math.ceil( Math.log(Math.ceil(Math.sqrt(harmonic_count))) / Math.log(2)));
	console.log("MHB Length: " + mhb_length);
	console.log("MHT Length: " + mht_length);

	var size_mhb = mhb_length*mhb_length*4;
	var size_mht = mht_length*mht_length*3;
		
		console.log("Vert count: " +vert_count);	

	// MHB -- START
	var mhb_buff = new Array();
	initArray(mhb_buff, size_mhb);
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


	//for(var i = 0; i < model.geometry.vertices.length; i++)
	//{

	//}

	// MHT -- START
	var mht_buff = new Array();
	initArray(mht_buff, size_mht);
	// RANGE ERROR IN CHROME ;(
	//Array.apply(null, new Array(size_mht)).map(Number.prototype.valueOf,0);
	for(var i = 0; i < vert_count; i++)
	{
		for(var j = 0; j < harmonic_count; j++)
		{
			
		}
	}

	var mht_tex = getNewTexture();
	rgb = gl.RGB;
	setTexture(mht_tex, mht_length, mht_buff, rgb);
	// MHT -- END


	// Inverse MHT -- START
	// Inverse MHT -- END
	
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
function setShader(mhb_tex, mht_tex, imht_tex, vert_count, harmonic_count, mhb_size, mht_size)
{

}