var context;
var analyzer;
var processor;
var source;

var bufferLoader;


function initAudio()
{
	try
	{
		// Fix up for prefixing
		window.AudioContext = window.AudioContext || window.webkitAudioContext;
		context = new AudioContext();

		bufferLoader = new BufferLoader(context,
		[
		'music/Signal-to-Noise_-_10_-_Universal.mp3'
		],
		finishedLoading
		);
		bufferLoader.load();

	}
	catch(e)
	{
		alert('Web Audio API is not supported in this browser');
		console.log(e);

	}
	console.log("Audio initialized.")
}

function finishedLoading(bufferList)
{
	source = context.createBufferSource();
	source.buffer = bufferList[0];
	source.connect(context.destination);	
	$("#play").attr("disabled", false);
	console.log("Song: " + bufferLoader.urlList[0] + " loaded.")
}

function play()
{
	$("#play").attr("disabled", true);
	$("#stop").attr("disabled", false);
	source.start(0);
}

function stop()
{
	$("#play").attr("disabled", false);
	$("#stop").attr("disabled", true);
	source.stop();
}