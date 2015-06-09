// AUDIO STUFF
var context;
var analyzer;
var processor;
var source;
var buffer;
var bufferLoader;
var freq = 512;
var freq_data;

// BOOLEANS -- PLAYBACK
var playing;
var pausedAt;
var paused;
var startedAt;

// INIT FUNCTION
function audio(callback)
{
	// Tried with buffer loader.
	// Buffer loader does not like me.
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


	// INIT PROCESSOR
	processor = context.createScriptProcessor(2048, 1, 1);
	processor.connect(context.destination);
	// INIT ANALYZER
	analyzer = context.createAnalyser();
	analyzer.fftSize = freq;
	// SET UP SOURCE BUFFER
	source = context.createBufferSource();
	// CONNECT THEM
	source.connect(analyzer);
	analyzer.connect(processor);
	source.connect(context.destination);

	// LOAD SOUND
	freq_data = new Uint8Array(analyzer.frequencyBinCount);
		//loadSound('music/test2.mp3');
	loadSound('music/queen.mp3');

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
			document.getElementById("play").style.color = '#0086a2';
        }, onError);
    }
    request.send();
}

 // log if an error occurs
 function onError(e) {
        console.log(e);
 }

// From Buffer Loader - failed try.
function finishedLoading(bufferList, callback)
{
	source = context.createBufferSource();
	source.buffer = bufferList[0];
	source.connect(context.destination);	
	$("#play").attr("disabled", false);
	console.log("Song: " + bufferLoader.urlList[0] + " loaded.")
}
var trans_array;

// GET FREQUENCIES FOR IMHT_TEX
function getFrequencies(min ,max, num_harmonics)
{
	var ret, idx;
	//console.log("Gain:" + gain);
	// IF PLAYING COMPUTE
	if(playing)
	{
		analyzer.getByteFrequencyData(freq_data);
		var ratio = num_harmonics / freq_data.length;

		frequencies = new Float32Array(num_harmonics);
		var g;

		for(var i = 0; i < freq_data.length; i++)
		{
			idx = Math.round(i*ratio);
			g = (i*i) / (freq_data.length*freq_data.length);
			frequencies[idx] += freq_data[i] + freq_data[i]*g
		}
		
		ret = new Float32Array(frequencies.length);

		for(var i = 0; i < frequencies.length; i++)
		{
			ret[i] = (frequencies[i] * (max - min)) / (255/ratio) + min;
		}

	}
	// ELSE RETURN 1's
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


// PLAY
function play()
{
	$("#play").attr("disabled", true);
	$("#stop").attr("disabled", false);
	
	document.getElementById("play").style.color = 'gray';
	document.getElementById("stop").style.color = '#0086a2';
	
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


// STOP
function stop()
{
	$("#play").attr("disabled", false);
	$("#stop").attr("disabled", true);
	
	document.getElementById("play").style.color = '#0086a2';
	document.getElementById("stop").style.color = 'gray';
	
	source.stop(0);
	pausedAt = Date.now() - startedAt;
	playing = false;
	paused = true;
}