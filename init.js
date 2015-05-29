var canvas_w = 1024;
var canvas_h = 600;
var canvas;
var renderer;
var camera;
var controls;
var scene;
var sphere;

var ratio = (canvas_w / canvas_h);
var ambient;
var directionalLight;
var loader;
var manager;
var gain = 5;

function init()
{
	initAudio();
	
	canvas = document.getElementById("canvas");
	renderer = new THREE.WebGLRenderer({ clearAlpha: 1, antialias: true } );

	canvas.appendChild(renderer.domElement);


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
		object.position.x = 0;
		object.position.y = 0;
		object.position.z = 0;
  		//object.scale.set(0.2,0.2,);
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