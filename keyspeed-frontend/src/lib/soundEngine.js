// Web Audio API Keyboard Sound Synthesizer
// Provides ultra-low latency (<5ms) synthesized mechanical, typewriter, and soft click sounds

class SoundEngine {
  constructor() {
    this.audioCtx = null;
    this.enabled = true;
    this.volume = 0.5;
    this.soundType = 'mechanical'; // 'mechanical' | 'typewriter' | 'soft'

    // Load initial settings from localStorage
    try {
      const saved = localStorage.getItem('typing_arena_sound_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.enabled === 'boolean') this.enabled = parsed.enabled;
        if (typeof parsed.volume === 'number') this.volume = parsed.volume;
        if (parsed.soundType) this.soundType = parsed.soundType;
      }
    } catch (e) {
      // Ignore
    }
  }

  initContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  setSettings({ enabled, volume, soundType }) {
    if (typeof enabled === 'boolean') this.enabled = enabled;
    if (typeof volume === 'number') this.volume = Math.max(0, Math.min(1, volume));
    if (soundType) this.soundType = soundType;

    try {
      localStorage.setItem(
        'typing_arena_sound_settings',
        JSON.stringify({
          enabled: this.enabled,
          volume: this.volume,
          soundType: this.soundType,
        })
      );
    } catch (e) {
      // Ignore
    }
  }

  getSettings() {
    return {
      enabled: this.enabled,
      volume: this.volume,
      soundType: this.soundType,
    };
  }

  playKey(key = '') {
    if (!this.enabled || this.volume <= 0) return;

    this.initContext();
    if (!this.audioCtx) return;

    const ctx = this.audioCtx;
    const now = ctx.currentTime;
    const isSpecial = key === ' ' || key === 'Enter' || key === 'Backspace';

    // Slight random variation to sound organic
    const pitchOffset = (Math.random() - 0.5) * 0.12;

    switch (this.soundType) {
      case 'typewriter':
        this.playTypewriter(ctx, now, isSpecial, pitchOffset);
        break;
      case 'soft':
        this.playSoftClick(ctx, now, isSpecial, pitchOffset);
        break;
      case 'mechanical':
      default:
        this.playMechanicalClick(ctx, now, isSpecial, pitchOffset);
        break;
    }
  }

  // 1. Mechanical Switch (Cherry MX Clicky transient + bottom-out body)
  playMechanicalClick(ctx, now, isSpecial, pitchOffset) {
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(this.volume * (isSpecial ? 1.1 : 0.9), now);
    masterGain.connect(ctx.destination);

    // High click transient (noise burst)
    const bufferSize = ctx.sampleRate * 0.015; // 15ms
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = (isSpecial ? 2200 : 3400) * (1 + pitchOffset);
    filter.Q.value = 3.5;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.4, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

    whiteNoise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(masterGain);

    whiteNoise.start(now);
    whiteNoise.stop(now + 0.02);

    // Resonant mechanical body (short sine thump)
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime((isSpecial ? 380 : 520) * (1 + pitchOffset), now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.035);

    oscGain.gain.setValueAtTime(0.5, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.038);

    osc.connect(oscGain);
    oscGain.connect(masterGain);

    osc.start(now);
    osc.stop(now + 0.04);
  }

  // 2. Vintage Typewriter (Heavy metal strike + key bottom thump)
  playTypewriter(ctx, now, isSpecial, pitchOffset) {
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(this.volume * 1.1, now);
    masterGain.connect(ctx.destination);

    // Metallic ping
    const metalOsc = ctx.createOscillator();
    const metalGain = ctx.createGain();
    metalOsc.type = 'sine';
    metalOsc.frequency.setValueAtTime((isSpecial ? 1200 : 1800) * (1 + pitchOffset), now);
    metalOsc.frequency.exponentialRampToValueAtTime(600, now + 0.04);

    metalGain.gain.setValueAtTime(0.3, now);
    metalGain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

    metalOsc.connect(metalGain);
    metalGain.connect(masterGain);
    metalOsc.start(now);
    metalOsc.stop(now + 0.05);

    // Heavy mechanical body thud
    const thudOsc = ctx.createOscillator();
    const thudGain = ctx.createGain();
    thudOsc.type = 'triangle';
    thudOsc.frequency.setValueAtTime((isSpecial ? 180 : 260) * (1 + pitchOffset), now);
    thudOsc.frequency.exponentialRampToValueAtTime(60, now + 0.05);

    thudGain.gain.setValueAtTime(0.6, now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);

    thudOsc.connect(thudGain);
    thudGain.connect(masterGain);
    thudOsc.start(now);
    thudOsc.stop(now + 0.06);
  }

  // 3. Soft Click / Modern Bubble
  playSoftClick(ctx, now, isSpecial, pitchOffset) {
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(this.volume * 0.7, now);
    masterGain.connect(ctx.destination);

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime((isSpecial ? 650 : 900) * (1 + pitchOffset), now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.025);

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.028);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(now);
    osc.stop(now + 0.03);
  }
}

export const soundEngine = new SoundEngine();

