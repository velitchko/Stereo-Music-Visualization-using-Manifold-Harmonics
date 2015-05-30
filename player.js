var context;
var analyzer;
var processor;
var source;

var bufferLoader;
var freq = 512;
var freq_data;
var playing;



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



		processor = context.createScriptProcessor(2048, 1, 1);
		analyzer = context.createAnalyser();
		analyzer.fftSize = freq;
		freq_data = new Uint8Array(analyzer.frequencyBinCount);

		analyzer.connect(processor);
		processor.connect(context.destination);

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

function getCoefficients(gain, min ,max, l)
{
	var ret, i, idx;
	console.log("Gain:" + gain);
	if(playing)
	{
		analyzer.getByteTimeDomainData(freq_data);
		var ratio = l / freq_data.length;
		coeffs = new Float32Array(l);
		var g;

		for(i = 0; i < freq_data.length; i++)
		{
			idx = Math.round(i*ratio);
			g = (gain*i*i) / (freq_data.length*freq_data.length);
			coeffs[idx] += freq_data[i] + freq_data[i]*g
		}
		ret = new Float32Array(coeffs.length);

		for(i = 0; i < coeffs.length; i++)
		{
			ret[i] = coeffs[i] * (max - min) / (255/ratio) + min;
		}

	}
	else
	{
		 ret = new Float32Array(l);
		
		while(idx < l) 
		{
			coeffs[i++] = 1;
		}
	}

	return ret;
}

function play()
{
	$("#play").attr("disabled", true);
	$("#stop").attr("disabled", false);
	source.start(0);
	playing = true;
}

function stop()
{
	$("#play").attr("disabled", false);
	$("#stop").attr("disabled", true);
	source.stop();
	playing = false;
}