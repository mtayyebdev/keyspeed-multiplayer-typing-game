/**
 * CarRaceAudio - Synthesizes real-time engine sound via Web Audio API.
 * Pitch and low-pass filter frequency dynamically follow car speed in km/h.
 * OFF by default with localStorage persistence.
 */
class CarRaceAudio {
  constructor() {
    this.ctx = null;
    this.osc = null;
    this.subOsc = null;
    this.gain = null;
    this.filter = null;
    this.isPlaying = false;
    // Default muted as per specification
    this.isMuted =
      typeof window !== 'undefined'
        ? localStorage.getItem('keyspeed_car_audio') !== 'enabled'
        : true;
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      // Main sawtooth oscillator for engine combustion rumble
      this.osc = this.ctx.createOscillator();
      this.osc.type = 'sawtooth';
      this.osc.frequency.setValueAtTime(45, this.ctx.currentTime);

      // Sub-oscillator for bass engine roar
      this.subOsc = this.ctx.createOscillator();
      this.subOsc.type = 'triangle';
      this.subOsc.frequency.setValueAtTime(22.5, this.ctx.currentTime);

      // Lowpass filter to muffle harsh harmonics
      this.filter = this.ctx.createBiquadFilter();
      this.filter.type = 'lowpass';
      this.filter.frequency.setValueAtTime(200, this.ctx.currentTime);

      // Master gain
      this.gain = this.ctx.createGain();
      this.gain.gain.setValueAtTime(this.isMuted ? 0 : 0.08, this.ctx.currentTime);

      // Connect graph
      this.osc.connect(this.filter);
      this.subOsc.connect(this.filter);
      this.filter.connect(this.gain);
      this.gain.connect(this.ctx.destination);

      this.osc.start();
      this.subOsc.start();
      this.isPlaying = true;
    } catch {
      // AudioContext policy or unsupported
    }
  }

  setSpeed(kmh, state = 'running') {
    if (!this.ctx || !this.isPlaying) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    const now = this.ctx.currentTime;
    const clampedSpeed = Math.max(0, Math.min(400, kmh));

    if (this.isMuted) {
      this.gain.gain.setTargetAtTime(0, now, 0.05);
      return;
    }

    if (state === 'stalled') {
      // Stalled engine: low stuttering frequency, then cut
      this.osc.frequency.setTargetAtTime(30, now, 0.05);
      this.filter.frequency.setTargetAtTime(120, now, 0.05);
      this.gain.gain.setTargetAtTime(0.02, now, 0.1);
      return;
    }

    if (clampedSpeed === 0 || state === 'idle') {
      // Idle engine rumble: ~45 Hz
      this.osc.frequency.setTargetAtTime(45, now, 0.1);
      this.subOsc.frequency.setTargetAtTime(22.5, now, 0.1);
      this.filter.frequency.setTargetAtTime(180, now, 0.1);
      this.gain.gain.setTargetAtTime(0.05, now, 0.1);
      return;
    }

    // Dynamic pitch: 45 Hz at 0 km/h up to ~320 Hz at 320 km/h
    const targetFreq = 45 + (clampedSpeed / 320) * 270;
    this.osc.frequency.setTargetAtTime(targetFreq, now, 0.08);
    this.subOsc.frequency.setTargetAtTime(targetFreq / 2, now, 0.08);

    // Filter opens up as revs increase
    const targetFilter = 200 + (clampedSpeed / 320) * 800;
    this.filter.frequency.setTargetAtTime(targetFilter, now, 0.08);

    // Gentle gain scaling
    this.gain.gain.setTargetAtTime(0.08, now, 0.05);
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('keyspeed_car_audio', this.isMuted ? 'disabled' : 'enabled');
    }

    if (!this.ctx && !this.isMuted) {
      this.init();
    }

    if (this.ctx && this.gain) {
      const now = this.ctx.currentTime;
      this.gain.gain.setTargetAtTime(this.isMuted ? 0 : 0.08, now, 0.05);
    }

    return this.isMuted;
  }

  stop() {
    try {
      if (this.osc) this.osc.stop();
      if (this.subOsc) this.subOsc.stop();
      if (this.ctx) this.ctx.close();
    } catch {
      // ignore cleanup errors
    }
    this.ctx = null;
    this.osc = null;
    this.subOsc = null;
    this.gain = null;
    this.filter = null;
    this.isPlaying = false;
  }
}

export const carRaceAudio = new CarRaceAudio();
