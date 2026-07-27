/**
 * Splat Blade - Web Audio API Sound Synthesizer Engine
 * Generates all sound effects and background music procedurally.
 */

class AudioEngine {
  constructor() {
    this.ctx = null;
    
    // Master gains
    this.sfxGainNode = null;
    this.bgmGainNode = null;
    
    // Volumes (0.0 to 1.0)
    this.sfxVolume = 0.8;
    this.musicVolume = 0.4;
    
    // BGM state
    this.bgmPlaying = false;
    this.bgmTimerId = null;
    this.nextNoteTime = 0.0;
    this.currentBeat = 0;
    this.tempo = 120.0; // BPM
    this.lookahead = 25.0; // ms
    this.scheduleAheadTime = 0.1; // seconds
  }

  init() {
    if (this.ctx) return;
    
    // Create AudioContext (standard or webkit)
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    this.ctx = new AudioContextClass();
    
    // Setup FX gain
    this.sfxGainNode = this.ctx.createGain();
    this.sfxGainNode.gain.value = this.sfxVolume;
    this.sfxGainNode.connect(this.ctx.destination);

    // Setup Music gain
    this.bgmGainNode = this.ctx.createGain();
    this.bgmGainNode.gain.value = this.musicVolume;
    this.bgmGainNode.connect(this.ctx.destination);
  }

  resume() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setSoundVolume(val) {
    this.sfxVolume = val;
    if (this.sfxGainNode) {
      this.sfxGainNode.gain.setValueAtTime(val, this.ctx.currentTime);
    }
  }

  setMusicVolume(val) {
    this.musicVolume = val;
    if (this.bgmGainNode) {
      this.bgmGainNode.gain.setValueAtTime(val, this.ctx.currentTime);
    }
  }

  // Create a buffer filled with white noise (for splats, whooshes, explosions)
  getNoiseBuffer() {
    if (!this.ctx) return null;
    const bufferSize = this.ctx.sampleRate * 2; // 2 seconds of noise
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  playClick() {
    this.resume();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.sfxGainNode);

    osc.type = 'sine';
    const now = this.ctx.currentTime;
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.05);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

    osc.start(now);
    osc.stop(now + 0.06);
  }

  playSlice() {
    this.resume();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const noiseBuffer = this.getNoiseBuffer();

    if (noiseBuffer) {
      // Swipe/Whoosh noise component
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1000, now);
      filter.frequency.exponentialRampToValueAtTime(150, now + 0.15);
      filter.Q.value = 8;

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.4, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.sfxGainNode);

      noise.start(now);
      noise.stop(now + 0.16);
    }

    // Metallic slash component
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(2000, now + 0.1);

    oscGain.gain.setValueAtTime(0.15, now);
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc.connect(oscGain);
    oscGain.connect(this.sfxGainNode);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  playSplat(sizeFactor = 1.0) {
    this.resume();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const noiseBuffer = this.getNoiseBuffer();

    // Squishy noise splat (frequency scaled based on fruit size)
    if (noiseBuffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      // Larger fruits = deeper splat (lower filter cut)
      const initialFreq = 600 / sizeFactor;
      filter.frequency.setValueAtTime(initialFreq, now);
      filter.frequency.exponentialRampToValueAtTime(50, now + 0.25);
      filter.Q.value = 5;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.6, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGainNode);

      noise.start(now);
      noise.stop(now + 0.26);
    }

    // High pop pitch
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();

    osc.type = 'sine';
    const pitch = 250 / sizeFactor;
    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.setValueAtTime(pitch * 2, now + 0.03);
    osc.frequency.exponentialRampToValueAtTime(10, now + 0.15);

    oscGain.gain.setValueAtTime(0.25, now);
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.connect(oscGain);
    oscGain.connect(this.sfxGainNode);

    osc.start(now);
    osc.stop(now + 0.16);
  }

  playBomb() {
    this.resume();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    
    // Deep explosion thud
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.linearRampToValueAtTime(20, now + 0.6);

    // Filter to warm it up
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, now);
    filter.frequency.linearRampToValueAtTime(80, now + 0.6);

    gain.gain.setValueAtTime(0.9, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.7);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGainNode);

    osc.start(now);
    osc.stop(now + 0.75);

    // White noise explosion burst
    const noiseBuffer = this.getNoiseBuffer();
    if (noiseBuffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.setValueAtTime(800, now);
      noiseFilter.frequency.exponentialRampToValueAtTime(100, now + 0.8);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.8, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.85);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.sfxGainNode);

      noise.start(now);
      noise.stop(now + 0.9);
    }
  }

  playFreeze() {
    this.resume();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Chilled bells chime arpeggio
    const notes = [400, 600, 800, 1000];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.2, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.08 + 0.3);

      osc.connect(gain);
      gain.connect(this.sfxGainNode);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.35);
    });
  }

  playPowerup() {
    this.resume();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Energetic rising arpeggio
    const scale = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
    scale.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);

      gain.gain.setValueAtTime(0.15, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.06 + 0.25);

      osc.connect(gain);
      gain.connect(this.sfxGainNode);

      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.3);
    });
  }

  playGameOver() {
    this.resume();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Melancholy descending chime
    const notes = [600, 500, 400, 300];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.15);

      gain.gain.setValueAtTime(0.25, now + idx * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.15 + 0.4);

      osc.connect(gain);
      gain.connect(this.sfxGainNode);

      osc.start(now + idx * 0.15);
      osc.stop(now + idx * 0.15 + 0.45);
    });
  }

  // --- PROCEDURAL BGM ENGINE ---
  startBGM() {
    this.resume();
    if (this.bgmPlaying) return;
    this.bgmPlaying = true;
    this.nextNoteTime = this.ctx.currentTime;
    this.currentBeat = 0;
    this.scheduler();
  }

  stopBGM() {
    this.bgmPlaying = false;
    if (this.bgmTimerId) {
      clearTimeout(this.bgmTimerId);
      this.bgmTimerId = null;
    }
  }

  scheduler() {
    if (!this.bgmPlaying || !this.ctx) return;
    
    while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadTime) {
      this.scheduleNote(this.currentBeat, this.nextNoteTime);
      this.nextInterval();
    }
    
    this.bgmTimerId = setTimeout(() => this.scheduler(), this.lookahead);
  }

  nextInterval() {
    const secondsPerBeat = 60.0 / this.tempo / 2; // 8th notes
    this.nextNoteTime += secondsPerBeat;
    this.currentBeat = (this.currentBeat + 1) % 16; // 16 beats loop
  }

  scheduleNote(beat, time) {
    if (!this.ctx) return;

    // Upbeat minor-pentatonic bass line progression (key of A minor)
    // Measures 1-2: Am (A, C, D, E)
    // Measures 3-4: G (G, B, D, G)
    const amBass = [55.0, 65.41, 73.42, 82.41]; // A1, C2, D2, E2
    const gBass = [49.0, 58.27, 73.42, 98.0];   // G1, B1, D2, G2
    
    // Choose chord based on 16-beat cycle
    const currentChordNotes = beat < 8 ? amBass : gBass;
    
    // Simple 8th-note bass pattern: alternate roots and 5ths
    let bassFreq = currentChordNotes[0];
    if (beat % 4 === 1) bassFreq = currentChordNotes[1];
    if (beat % 4 === 2) bassFreq = currentChordNotes[2];
    if (beat % 4 === 3) bassFreq = currentChordNotes[3];

    // Trigger Bass synth (warm triangle waves)
    if (beat % 2 === 0 || (beat === 5 || beat === 13)) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(bassFreq, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(150, time);

      gain.gain.setValueAtTime(0.4, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.22);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.bgmGainNode);

      osc.start(time);
      osc.stop(time + 0.25);
    }

    // High melody synth overlay (subtle, arpeggiated)
    // Only triggers on certain beats to keep it atmospheric and clean
    const melodyNotes = [220.0, 261.63, 293.66, 329.63, 392.00, 440.0, 523.25]; // A3-C5 Scale
    const melodyPattern = [
      0, -1, 2, -1, 3, -1, 4, -1,
      5, -1, 3, -1, 2, 4, 1, -1
    ];
    const noteIdx = melodyPattern[beat];

    if (noteIdx !== -1 && Math.random() > 0.3) {
      const mFreq = melodyNotes[noteIdx % melodyNotes.length];
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(mFreq, time);

      gain.gain.setValueAtTime(0.08, time);
      gain.gain.exponentialRampToValueAtTime(0.005, time + 0.3);

      osc.connect(gain);
      gain.connect(this.bgmGainNode);

      osc.start(time);
      osc.stop(time + 0.35);
    }

    // Drum kick (every beat 0, 4, 8, 12)
    if (beat % 4 === 0) {
      const kickOsc = this.ctx.createOscillator();
      const kickGain = this.ctx.createGain();

      kickOsc.frequency.setValueAtTime(120, time);
      kickOsc.frequency.exponentialRampToValueAtTime(40, time + 0.08);

      kickGain.gain.setValueAtTime(0.5, time);
      kickGain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);

      kickOsc.connect(kickGain);
      kickGain.connect(this.bgmGainNode);

      kickOsc.start(time);
      kickOsc.stop(time + 0.12);
    }

    // Drum Hi-hat click (beats 2, 6, 10, 14 or offbeats)
    if (beat % 2 === 1 && Math.random() > 0.4) {
      const noiseBuffer = this.getNoiseBuffer();
      if (noiseBuffer) {
        const noise = this.ctx.createBufferSource();
        noise.buffer = noiseBuffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(7000, time);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.02, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.bgmGainNode);

        noise.start(time);
        noise.stop(time + 0.04);
      }
    }
  }
}

// Singleton audio engine instance
export const audio = new AudioEngine();
