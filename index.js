document.addEventListener('DOMContentLoaded', () => {

    buildSHEAS('complete', document.getElementById('sheas_container'))
    
 // Audio context
 c = new AudioContext;
 // createAnalyzer() gets an Analyzer Node that listens to the audio stream and, leaving it unchanged, yields time and frequency information about the signal it listens.
 a = c.createAnalyser()
 a.fftSize = 128

 // Canvas is an area on which js has pixel control.
 canvas = document.getElementById("cvs");
 // getContext() gets the actually drawable surface
 ctx = canvas.getContext("2d")

 // frequencyBinCount is half of the fft size, basically the buffer size for the vistalzation
 // Uint8Array typed array represents an array of 8-bit unsigned integers
 //  Data is therefore an array of values to be displayed "at a time"
 var data = new Uint8Array(a.frequencyBinCount)

 // Draws the frame that shows the last fragment of time of sound amplitude.
 function drawAnalyser() {
   // We ask the browser to wait until the next frame is free to be used to draw the picture
   requestAnimationFrame(drawAnalyser); 

   ctx.clearRect(0,0,canvas.width, canvas.height); // Clear the canvas
   ctx.beginPath(); // Start to draw
   a.getByteTimeDomainData(data); // getByteTimeDomainData() method of the AnalyserNode Interface copies the current waveform, or time-domain, data into a Uint8Array (unsigned byte array) passed into it.
   // Draw all the lines between samples incrementing the base coord horizontally.
   for(i=0;i<data.length;i++) {
     ctx.lineTo(i, data[i])
   }
   ctx.stroke() // Actually draw
 }

 // navigator is the webAPI element that deals with the current user hardware.
 // mediadevices handles the media devices available within the current user's computer
 // getUserMedia accesses the actual mic.
 p = navigator.mediaDevices.getUserMedia({audio:true})

 // Just after accessing the mic we create the audio stream from it and connect it to the Analyzer Node.
 p.then(function(ms) {
   mss = c.createMediaStreamSource(ms);
   mss.connect(a)
 })

 drawAnalyser()

 // In case the audiocontext stops for example when exiting the page into another tab.
 canvas.onclick = function() {c.resume()}
})