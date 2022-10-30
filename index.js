var analyzer, audio_context, audio_canvas, fft_canvas, audio_ctx, fft_ctx, audio_data, fft_data, p, output_buffer, output_buffer_data, output_source

document.addEventListener('DOMContentLoaded', () => {
    buildAudio()
})

function buildAudio() {

    // Audio context
    audio_context = new AudioContext({sampleRate: 22050});
    // createAnalyzer() gets an Analyzer Node that listens to the audio stream and, leaving it unchanged, yields time and frequency information about the signal it listens.
    analyzer = audio_context.createAnalyser()

    // Canvas is an area on which js has pixel control.
    audio_canvas = document.getElementById("audio");
    // getContext() gets the actually drawable surface
    audio_ctx = audio_canvas.getContext("2d")

    // Canvas is an area on which js has pixel control.
    fft_canvas = document.getElementById("fft");
    // getContext() gets the actually drawable surface
    fft_ctx = fft_canvas.getContext("2d")

    analyzer.fftSize = parseInt(document.getElementById("FFT").value)
    audio_canvas.width = analyzer.frequencyBinCount
    fft_canvas.width = analyzer.frequencyBinCount

    // frequencyBinCount is half of the fft size, basically the buffer size for the vistalzation
    // Uint8Array typed array represents an array of 8-bit unsigned integers
    // Data is therefore an array of values to be displayed "at a time"
    audio_data = new Uint8Array(analyzer.frequencyBinCount)
    fft_data = new Uint8Array(analyzer.frequencyBinCount)

    // Build DIGITALJS
    buildSHEAS('complete', document.getElementById('sheas_container'), buildChip())

    // navigator is the webAPI element that deals with the current user hardware.
    // mediadevices handles the media devices available within the current user's computer
    // getUserMedia accesses the actual mic.
    userMedia = navigator.mediaDevices.getUserMedia({audio:true})

    // Just after accessing the mic we create the audio stream from it and connect it to the Analyzer Node.
    userMedia.then(function(device) {
        mic = audio_context.createMediaStreamSource(device);
        mic.connect(analyzer)
        // analyzer.connect(audio_context.destination)
    })

    drawAnalyser()

    // In case the audiocontext stops for example when exiting the page into another tab.
    audio_canvas.onclick = function() {audio_context.resume()}
}



// Draws the frame that shows the last fragment of time of sound amplitude.
function drawAnalyser() {
    // We ask the browser to wait until the next frame is free to be used to draw the picture
    requestAnimationFrame(drawAnalyser); 

    audio_ctx.clearRect(0,0,audio_canvas.width, audio_canvas.height); // Clear the canvas
    audio_ctx.beginPath(); // Start to draw
    analyzer.getByteTimeDomainData(audio_data); // getByteTimeDomainData() method of the AnalyserNode Interface copies the current waveform, or time-domain, data into a Uint8Array (unsigned byte array) passed into it.
    // Draw all the lines between samples incrementing the base coord horizontally.
    for(i=0;i<audio_data.length;i++) {
        circuit['sheas_container'].getInputCells()[i].setInput(circuit['sheas_container']._display3vl.read('dec', audio_data[i], 8))
        audio_ctx.lineTo(i, audio_data[i])
        audio_data[i]+=100
    }
    audio_ctx.stroke() // Actually draw

    fft_ctx.clearRect(0,0,fft_canvas.width, fft_canvas.height); // Clear the canvas
    fft_ctx.beginPath(); // Start to draw
    fft_ctx.strokeStyle = "#000000"; 
    analyzer.getByteFrequencyData(fft_data); // getByteTimeDomainData() method of the AnalyserNode Interface copies the current waveform, or time-domain, data into a Uint8Array (unsigned byte array) passed into it.
    // Draw all the lines between samples incrementing the base coord horizontally.
    for(i=0;i<fft_data.length;i++) {
        fft_ctx.lineTo(i, fft_canvas.height-fft_data[i])
    }
    fft_ctx.stroke() // Actually draw

    fft_ctx.beginPath();
    fft_ctx.strokeStyle = "#FF0000"; 
    for(i=0;i<fft_data.length;i++) {
        var out = circuit['sheas_container'].getOutputCells()[i].get('inputSignals').in.toNumber()
        fft_ctx.lineTo(i, out)
    }
    fft_ctx.stroke()
}

function buildChip() {

    var fft_chip = get_empty_chip()

    var bin = parseInt(document.getElementById("FFT").value)/2

    for (var i=0; i<bin; i++) {
        fft_chip.devices['dev'+i] = { 
            type: "NumEntry", 
            label: "in_"+i,
            net: "in_"+i,
            bits: 8,
            numbase: 'hex',
            position: {
                x:0,
                y:50*i
            }
            }

        fft_chip.devices['dev'+(i+bin)] = { 
            type: "NumDisplay", 
            label: "out_"+i,
            net: "out_"+i,
            bits: 8,
            numbase: 'hex',
            position: {
                x:500,
                y:50*i
            }
            }
        fft_chip.connectors[i] = {
            'from': {
                'id': 'dev'+i,
                'port': 'out',
            },
            'to': {
                'id': 'dev'+(2*bin-i-1),
                'port': 'in', 
            },
        }
    }

    console.log("CHIIIP")
    console.log(fft_chip)
    return LZString.compressToBase64(JSON.stringify(new digitaljs.Circuit(fft_chip).toJSON()))
}

// READ IN: circuit['sheas_container'].getInputCells()[0].get('outputSignals').out.toNumber()
// WRITE IN: circuit['sheas_container'].getInputCells()[0].setInput(circuit['sheas_container']._display3vl.read('dec', '23', 8))
// READ OUT: circuit['sheas_container'].getOutputCells()[0].get('inputSignals').in.toNumber()