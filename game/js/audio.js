// Procedural WebAudio: engine hum, siren, gunshots, pickups and three
// radio stations (all notes synthesized, no audio files, no network).
import { RADIO_STATIONS } from './config.js';

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.station = 0;
    this.radioOn = true;
    this.engineOsc = null;
    this.engineGain = null;
    this.sirenOsc = null;
    this.sirenGain = null;
    this.sirenOn = false;
    this.nextNoteTime = 0;
    this.noteStep = 0;
  }

  ensure() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      // Engine: low sawtooth through a lowpass, pitch follows speed.
      this.engineOsc = this.ctx.createOscillator();
      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.value = 55;
      const lp = this.ctx.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = 320;
      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.value = 0;
      this.engineOsc.connect(lp); lp.connect(this.engineGain); this.engineGain.connect(this.ctx.destination);
      this.engineOsc.start();
      // Siren: two-tone triangle.
      this.sirenOsc = this.ctx.createOscillator();
      this.sirenOsc.type = 'triangle';
      this.sirenOsc.frequency.value = 700;
      this.sirenGain = this.ctx.createGain();
      this.sirenGain.gain.value = 0;
      this.sirenOsc.connect(this.sirenGain); this.sirenGain.connect(this.ctx.destination);
      this.sirenOsc.start();
      this.nextNoteTime = this.ctx.currentTime + 0.1;
    } catch (e) { this.ctx = null; }
  }

  setEngine(speed01, driving) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    this.engineGain.gain.setTargetAtTime(driving ? 0.05 + speed01 * 0.06 : 0.0, t, 0.08);
    this.engineOsc.frequency.setTargetAtTime(48 + speed01 * 130, t, 0.08);
  }

  setSiren(on) {
    if (!this.ctx) return;
    this.sirenOn = on;
    const t = this.ctx.currentTime;
    this.sirenGain.gain.setTargetAtTime(on && !this.muted ? 0.035 : 0, t, 0.1);
  }

  update(dt, wanted) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    if (this.sirenOn) {
      const phase = Math.floor(t * 2.2) % 2;
      this.sirenOsc.frequency.setTargetAtTime(phase === 0 ? 660 : 880, t, 0.05);
    }
    if (wanted > 0) this.setSiren(true); else this.setSiren(false);
    // Radio sequencer: one short note per step, station defines scale/tempo.
    if (!this.radioOn) return;
    const st = RADIO_STATIONS[this.station];
    const stepDur = 60 / st.tempo / 2;
    while (this.nextNoteTime < t + 0.15) {
      const step = this.noteStep++;
      if (step % 2 === 0) {
        const scale = st.scale;
        const idx = (step * 7 + Math.floor(step / 8) * 3) % scale.length;
        const octave = step % 16 === 14 ? 2 : 1;
        const freq = st.root * Math.pow(2, scale[idx] / 12) * octave;
        const o = this.ctx.createOscillator();
        o.type = st.wave;
        o.frequency.value = freq;
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.0001, this.nextNoteTime);
        g.gain.linearRampToValueAtTime(0.05, this.nextNoteTime + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, this.nextNoteTime + stepDur * 0.9);
        o.connect(g); g.connect(this.ctx.destination);
        o.start(this.nextNoteTime);
        o.stop(this.nextNoteTime + stepDur);
      }
      this.nextNoteTime += stepDur;
    }
    if (this.nextNoteTime < t - 1) this.nextNoteTime = t + 0.05;
  }

  blip(freq, dur, type, vol) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    o.type = type || 'square';
    o.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol || 0.08, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(this.ctx.destination);
    o.start(t); o.stop(t + dur);
  }

  shoot() { this.blip(180, 0.12, 'square', 0.12); this.blip(90, 0.1, 'sawtooth', 0.08); }
  punch() { this.blip(120, 0.08, 'sine', 0.1); }
  pickup() { this.blip(660, 0.09, 'sine', 0.09); this.blip(990, 0.12, 'sine', 0.07); }
  mission() { this.blip(523, 0.15, 'triangle', 0.1); this.blip(784, 0.25, 'triangle', 0.1); }
  busted() { this.blip(220, 0.4, 'sawtooth', 0.1); this.blip(165, 0.5, 'sawtooth', 0.1); }
  click() { this.blip(880, 0.05, 'square', 0.05); }

  toggleMute() {
    this.muted = !this.muted;
    if (this.ctx) {
      const t = this.ctx.currentTime;
      if (this.engineGain) this.engineGain.gain.setTargetAtTime(0, t, 0.05);
      if (this.sirenGain) this.sirenGain.gain.setTargetAtTime(0, t, 0.05);
    }
    return this.muted;
  }
}
