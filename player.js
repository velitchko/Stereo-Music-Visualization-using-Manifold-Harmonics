var context;
var analyzer;
var processor;
var source;
var buffer;
var bufferLoader;
var freq = 512;
var freq_data;
var playing;
var pausedAt;
var paused;
var startedAt;


function initAudio(callback)
{
	// try
	// {
	// 	// Fix up for prefixing
		window.AudioContext = window.AudioContext || window.webkitAudioContext;
		context = new AudioContext();

		// bufferLoader = new BufferLoader(context,
		// [
		// 'music/test2.mp3'
		// ],
		// finishedLoading
		// );
		// bufferLoader.load();



		processor = context.createScriptProcessor(2048, 1, 1);
		processor.connect(context.destination);

		analyzer = context.createAnalyser();
		analyzer.fftSize = freq;
		

		source = context.createBufferSource();
		source.connect(analyzer);
		analyzer.connect(processor);
		source.connect(context.destination);
		freq_data = new Uint8Array(analyzer.frequencyBinCount);
		loadSound('music/test2.mp3');

	//}
	// catch(e)
	// {
	// 	alert('Web Audio API is not supported in this browser');
	// 	console.log(e);

	// }
	console.log("Audio initialized.")
	callback(true);
}

// load the specified sound
function loadSound(url) {
    var request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.responseType = 'arraybuffer';
    // When loaded decode the data
    request.onload = function () {
	    // decode the data
        context.decodeAudioData(request.response, function (buff) {
        // when the audio is decoded play the sound
            
            source.buffer = buff;

            $("#play").attr("disabled", false);
            console.log("Song loaded " + url + ".");
        }, onError);
    }
    request.send();
}

 // log if an error occurs
 function onError(e) {
        console.log(e);
 }

function finishedLoading(bufferList, callback)
{
	source = context.createBufferSource();
	source.buffer = bufferList[0];
	source.connect(context.destination);	
	$("#play").attr("disabled", false);
	console.log("Song: " + bufferLoader.urlList[0] + " loaded.")
}
var trans_array;

function getCoefficients(gain, min ,max, l)
{
	var ret, idx;
	//console.log("Gain:" + gain);
	if(playing)
	{
		analyzer.getByteFrequencyData(freq_data);
		var ratio = l / freq_data.length;
		
		trans_array = freq_data;
		coeffs = new Float32Array(l);
		var g;

		for(var i = 0; i < freq_data.length; i++)
		{
			idx = Math.round(i*ratio);
			g = (gain*i*i) / (freq_data.length*freq_data.length);
			coeffs[idx] += freq_data[i] + freq_data[i]*g
		}
		ret = new Float32Array(coeffs.length);

		for(var i = 0; i < coeffs.length; i++)
		{
			ret[i] = (coeffs[i] * (max - min)) / (255/ratio) + min;
		}

	}
	else
	{
		ret = new Float32Array(l);
		
		for(var i = 0; i < l; i++)
		{
			ret[i] = 1.0;
		}
	}

	return ret;
}

function play()
{
	$("#play").attr("disabled", true);
	$("#stop").attr("disabled", false);
	
	document.getElementById("play").value="\u23F8";
	
	//source.start(0);
	//source.loop = true;
	paused = false;
	playing = true;

	if(pausedAt)
	{
		startedAt = Date.now() - pausedAt;
		source.start(0, pausedAt / 1000);
	}
	else
	{
		startedAt = Date.now();
		source.start(0);
	}
}

function stop()
{
	$("#play").attr("disabled", false);
	$("#stop").attr("disabled", true);
	document.getElementById("play").value="\u25B6";
	source.stop(0);
	pausedAt = Date.now() - startedAt;
	playing = false;
	paused = true;
}