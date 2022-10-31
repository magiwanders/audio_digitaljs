let outAudio, micTrack, outTrackGenerator, outTrack, dspProcessor, micAudio, processedAudio, inputCells, d3vl;

window.onload = async function () {
  outAudio = document.getElementById('outAudio');
  document.getElementById('startListening').onclick = startListening;
  document.getElementById('stopListening').onclick = stopListening;
  buildSHEAS('complete', document.getElementById('sheas_container'), buildChip())
  inputCells = circuit['sheas_container'].getInputCells()
  d3vl = circuit['sheas_container']._display3vl
}

async function startListening() {
  document.getElementById('startListening').disabled = true;
  micAudio = (await navigator.mediaDevices.getUserMedia({audio: true})).getAudioTracks()[0];
  // micAudio = (await navigator.mediaDevices.getUserMedia({
  //   audio: {
  //     sampleRate: {exact: 8000}, 
  //     sampleSize: 8,  
  //     channelCount: 1
  //   }
  // })).getAudioTracks()[0];
  // const upsampledMicAudio = await navigator.mediaDevices.getUserMedia({audio: true});
  // const audioContext = new AudioContext({
  //   sampleRate: 8000
  // });
  // const micAudio = audioContext.createMediaStreamSource(upsampledMicAudio)
  micTrack = new MediaStreamTrackProcessor(micAudio).readable;
  outTrackGenerator = new MediaStreamTrackGenerator('audio');
  outTrack = outTrackGenerator.writable
  dspProcessor = new TransformStream({transform: dsp()});
  micTrack.pipeThrough(dspProcessor).pipeTo(outTrack);
  processedAudio = new MediaStream();
  processedAudio.addTrack(outTrackGenerator);
  outAudio.srcObject = processedAudio;
  document.getElementById('stopListening').disabled = false;
  await outAudio.play();
}

async function stopListening() {
  document.getElementById('stopListening').disabled = true;
  outAudio.pause();
  outAudio.srcObject = null;
  micAudio.stop()
  document.getElementById('startListening').disabled = false;
}

function dsp() {
  const format = 'f32-planar';
  return (data, controller) => {
    var samples = new Float32Array(data.numberOfFrames);
    data.copyTo(samples, {planeIndex: 0, format});
    /////////////////////// FIXED 480 samples at a time on 16 DigitalJS nodes
    console.log(samples.length)
    console.log(data.sampleRate)
    for (let i = 0; i < 16; i++) {
      // samples[i] = lastValue;
      // if (samples[i]>0.1) {
      //     samples[i] = 0.1
      // }
      // for (let j = 0; j < 30; j++)
      inputCells[i].setInput(d3vl.read('dec', (parseInt(samples[i*30]*127)+128).toString(), 8))
    }

    for (let i = 0; i < 16; i++) {
      // for (let j = 0; j < 30; j++)
      samples[i*30] = (circuit['sheas_container'].getOutputCells()[i].get('inputSignals').in.toNumber()-128)/127
    }
    ///////////////////////
    controller.enqueue(new AudioData({
      format,
      sampleRate: data.sampleRate,
      numberOfFrames: data.numberOfFrames,
      numberOfChannels: data.numberOfChannels,
      timestamp: data.timestamp,
      data: samples
    }));
  };
}

function buildChip() {

  var fft_chip = get_empty_chip()

  var bin = 16

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
              'id': 'dev'+(bin+i),//'dev'+(2*bin-i-1),
              'port': 'in', 
          },
      }
  }
  return LZString.compressToBase64(JSON.stringify(new digitaljs.Circuit(fft_chip).toJSON()))
}