class Bell {
  constructor(audioContext, index) {
    const gain = audioContext.createGain();
    gain.gain.value = 0;

    const triangle = audioContext.createOscillator();
    triangle.type = 'sine';

    const sine = audioContext.createOscillator();
    sine.type = 'triangle';

    sine.connect(gain);
    triangle.connect(gain);

    sine.start();
    triangle.start();

    this.index        = index;
    this.gain         = gain;
    this.sine         = sine;
    this.triangle     = triangle;
    this.audioContext = audioContext;
  }

  ring (freq) {
    this.sine.frequency.setValueAtTime(freq, 0);
    this.triangle.frequency.setValueAtTime(freq, 0);

    this.gain.gain.linearRampToValueAtTime(1, this.audioContext.currentTime + 0.2);
    this.gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 1);
    this.gain.gain.setValueAtTime(0, this.audioContext.currentTime + 1);
  }
}

class BellChorus {
  constructor (simpleReverb, numberOfBells = 4) {
    const ac = new (window.AudioContext || window.webkitAudioContext)();

    const masterGain = ac.createGain();
    masterGain.gain.value = 0.3;

    const compressor = ac.createDynamicsCompressor();

    const reverb = new simpleReverb(ac);
    const wet = ac.createGain();
    wet.gain.value = 0.8;
    const dry = ac.createGain();
    dry.gain.value = 0.2;

    const filter = ac.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 800;

    const bellCollection = [];
    for (let i = 0; i < numberOfBells; i++) {
      let bell = new Bell(ac, i);
      bell.gain.connect(compressor);
      bellCollection.push(bell);
    }

    compressor.connect(filter);
    filter.connect(wet);
    filter.connect(dry);
    wet.connect(reverb.input)
    reverb.connect(masterGain);
    dry.connect(masterGain);
    masterGain.connect(ac.destination);

    this.count = 0;
    this.masterGain = masterGain;
    this.bellCollection = bellCollection;
  }

  ringBell(frequency) {
    this.bellCollection[this.count % this.bellCollection.length].ring(frequency);
    this.count++;
  }

  incrementVolume() {
    if (this.masterGain.gain.value < 1) {
      this.masterGain.gain.value = (this.masterGain.gain.value + 0.1).toFixed(1);
    }
  }

  decrementVolume() {
    if (this.masterGain.gain.value > 0) {
      this.masterGain.gain.value = (this.masterGain.gain.value - 0.1).toFixed(1);
    }
  }

  toggleVolume() {
    this.masterGain.gain.value = this.masterGain.gain.value ? 0 : 1;
  }
}
