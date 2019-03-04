(function() {
  // https://gist.github.com/callumlocke/cc258a193839691f60dd
  function scaleCanvas(canvas, context, width, height) {
    // assume the device pixel ratio is 1 if the browser doesn't specify it
    const devicePixelRatio = window.devicePixelRatio || 1;

    // determine the 'backing store ratio' of the canvas context
    const backingStoreRatio = (
      context.webkitBackingStorePixelRatio ||
      context.mozBackingStorePixelRatio ||
      context.msBackingStorePixelRatio ||
      context.oBackingStorePixelRatio ||
      context.backingStorePixelRatio || 1
    );

    // determine the actual ratio we want to draw at
    const ratio = devicePixelRatio / backingStoreRatio;

    if (devicePixelRatio !== backingStoreRatio) {
      // set the 'real' canvas size to the higher width/height
      canvas.width = width * ratio;
      canvas.height = height * ratio;

      // ...then scale it back down with CSS
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
    }
    else {
      // this is a normal 1:1 device; just scale it simply
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = '';
      canvas.style.height = '';
    }

    // scale the drawing context so everything will work at the higher ratio
    context.scale(ratio, ratio);
  }

  const container = document.getElementById('canvas-container');
  container.innerHTML = '';
  const keySuggest = document.createElement('div');
  const control = document.createElement('div');
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const maxWin = Math.max(window.innerHeight, window.innerWidth);
  const boardDimension = 60;

  const frequencies = [174.61,196,207.65,231.12,233.08,261.63,293.66,349.22,392,415.3,462.24,466.16,523.26,587.32,698.44,784,830.6,924.48,932.32,1046.52,1174.64,1396.88,1568,1661.2,1864.64,2093.04];
  const characters = ['z', 'x', 'c', 'v', 'b', 'n', 'm', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'];
  let activeFreqs = [];

  container.style.height = window.innerHeight + 'px';

  const overflow = 100;
  const canvasWidth = window.innerWidth + overflow;
  const canvasHeight = window.innerHeight + overflow;
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  scaleCanvas(canvas, ctx, canvasWidth, canvasHeight)
  container.appendChild(canvas);

  let bells;
  const hex = hexagonPrototypeGenerator(maxWin / boardDimension)
  const hexCollect = [];
  let lastMouseVector = [hex.radius * 14, window.innerHeight - hex.radius * 8];

  keySuggest.classList.add('key-suggest');
  keySuggest.innerHTML = `<i class="fa fa-keyboard-o" aria-hidden="true"></i>`;
  container.appendChild(keySuggest);

  control.classList.add('control');
  control.innerHTML = `<i data-action="decrement" class="fa fa-minus volume" aria-hidden="true"></i><i data-action="toggle" class="fa fa-volume-up" aria-hidden="true"></i><i data-action="increment" class="fa fa-plus volume" aria-hidden="true"></i>`;
  container.appendChild(control);
  setControlBackground(control, bells);

  control.addEventListener('click', e => {
    initBells();
    if (!e.target || !e.target.dataset || !e.target.dataset.action) { return; }

    switch (e.target.dataset.action) {
      case 'decrement':
        bells.decrementVolume();
        break;
      case 'increment':
        bells.incrementVolume();
        break;
      case 'toggle':
        bells.toggleVolume();
        break;
    }

    setControlBackground(control, bells);
  });

  canvas.addEventListener('mousemove', e => {
    lastMouseVector = [e.offsetX, e.offsetY];
    drawForMouseAndClick(ctx, e.offsetX, e.offsetY);
  });

  canvas.addEventListener('click', e => {
    initBells();
    drawForMouseAndClick(ctx, e.offsetX, e.offsetY, bells);
  });

  window.addEventListener('keydown', e => {
    initBells();
    if (e.key === '-' || e.key === '_') {
      bells.decrementVolume();
      setControlBackground(control, bells);
      return;
    } else if (e.key === '+' || e.key === '=') {
      bells.incrementVolume();
      setControlBackground(control, bells);
      return;
    }

    let freq = frequencies[characters.indexOf(e.key)]
    if (freq && activeFreqs.indexOf(freq) === -1) {
      activeFreqs.push(freq);
      drawForKeyPress(ctx, activeFreqs, freq);
    }
  });

  window.addEventListener('keyup', e => {
    let freq = frequencies[characters.indexOf(e.key)]
    activeFreqs.splice(activeFreqs.indexOf(freq), 1);
    if (lastMouseVector && activeFreqs.length === 0) {
      drawForMouseAndClick(ctx, lastMouseVector[0], lastMouseVector[1]);
    } else {
      drawForKeyPress(ctx, activeFreqs);
    }
  });

  // Init
  for (let i = 0, index = 0, x, y; i < boardDimension; i++) {
    for (let j = 0; j < boardDimension; j++) {
      x = Math.floor(i * hex.rectangleWidth + ((j % 2) * hex.radius));
      y = Math.floor(j * (hex.sideLength + hex.height));

      hexCollect.push(Hexagon(x, y, index++, frequencies[Math.floor(Math.random() * frequencies.length)], hex));
    }
  }

  drawForMouseAndClick(ctx, lastMouseVector[0], lastMouseVector[1]);

  // Helpers
  function drawForMouseAndClick(canvasContext, mouseX, mouseY, bells) {
    canvasContext.clearRect(0, 0, canvas.width, canvas.height);
    hexCollect.forEach(hex => {
      hex.drawMouse(canvasContext, mouseX, mouseY, bells);
    });
  }

  function drawForKeyPress(canvasContext, activeFreqs, newFreq) {
    canvasContext.clearRect(0, 0, canvas.width, canvas.height);
    hexCollect.forEach(hex => {
      hex.drawKey(canvasContext, activeFreqs);
    });
    if (newFreq) {
      bells.ringBell(newFreq);
    }
  }

  function setControlBackground(control, bells) {
    const volume = bells ? bells.masterGain.gain.value : 0.3;
    const volumePercent = (volume / 1) * 100;
    control.style.background = `linear-gradient(to right, #800000 0%, #800000 ${volumePercent}%, #a64c4c ${volumePercent}%, #a64c4c 100%)`;
  }

  function initBells() {
    // Stupid hack because of stupid Chrome:
    // https://developers.google.com/web/updates/2017/09/autoplay-policy-changes#webaudio
    if (!bells) bells = new BellChorus(SimpleReverb, frequencies.length);
  }
})();
