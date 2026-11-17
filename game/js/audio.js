'use strict';
// WebAudio: engine hum, three procedural radio stations, siren and effects.
// Everything is synthesized; no audio files, no network.
CH.Audio = {
  ctx: null, master: null, engineOsc: null, engineGain: null, engineFilter: null,
  sirenOsc: null, sirenGain: null, noiseBuf: null,
  muted: false, radioStation: 0, radioTimer: 0, radioStep: 0, radioOn: true,
  stations: [
    { name: 'KCOY 88.1 — Desert Country', wave: 'triangle', base: 110, tempo: 0.26,
      notes: [0, 3, 5, 7, 10, 7, 5, 3, 0, 3, 5, 7, 12, 10, 7, 5] },
    { name: 'KROK 101.5 — Highway Rock', wave: 'sawtooth', base: 82.4, tempo: 0.19,
      notes: [0, 0, 7, 0, 10, 0, 12, 10, 0, 0, 7, 5, 3, 5, 7, 12] },
    { name: 'KSUN 95.9 — Strip Nights', wave: 'sine', base: 130.8, tempo: 0.22,
      notes: [0, 5, 7, 12, 7, 5, 3, 0, 0, 5, 7, 10, 12, 10, 7, 3] }
  ],

  init: function () {
    if (this.ctx) return;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain(); this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
      var len = this.ctx.sampleRate;
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      var d = this.noiseBuf.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.engineOsc = this.ctx.createOscillator(); this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.value = 60;
      this.engineFilter = this.ctx.createBiquadFilter(); this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.value = 500;
      this.engineGain = this.ctx.createGain(); this.engineGain.gain.value = 0;
      this.engineOsc.connect(this.engineFilter); this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.master); this.engineOsc.start();
      this.sirenOsc = this.ctx.createOscillator(); this.sirenOsc.type = 'square';
      this.sirenOsc.frequency.value = 750;
      this.sirenGain = this.ctx.createGain(); this.sirenGain.gain.value = 0;
      this.sirenOsc.connect(this.sirenGain); this.sirenGain.connect(this.master);
      this.sirenOsc.start();
    } catch (e) { this.ctx = null; }
  },

  resume: function () { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); },

  setEngine: function (speed01, driving) {
    if (!this.ctx) return;
    var t = this.ctx.currentTime;
    this.engineGain.gain.setTargetAtTime(driving ? 0.035 + speed01 * 0.05 : 0.0, t, 0.1);
    this.engineOsc.frequency.setTargetAtTime(55 + speed01 * 165, t, 0.08);
  },

  setSiren: function (on) {
    if (!this.ctx) return;
    var t = this.ctx.currentTime;
    this.sirenGain.gain.setTargetAtTime(on ? 0.028 : 0, t, 0.2);
    if (on) this.sirenOsc.frequency.setTargetAtTime((Math.floor(t * 2) % 2 === 0) ? 720 : 980, t, 0.05);
  },

  note: function (freq, dur, wave, vol, when) {
    if (!this.ctx) return;
    var t = (when || this.ctx.currentTime);
    var o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = wave || 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol || 0.12, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(this.master);
    o.start(t); o.stop(t + dur + 0.05);
  },

  radioTick: function (dt) {
    if (!this.ctx || !this.radioOn || this.muted) return;
    this.radioTimer -= dt;
    if (this.radioTimer > 0) return;
    var st = this.stations[this.radioStation];
    this.radioTimer = st.tempo;
    var n = st.notes[this.radioStep % st.notes.length];
    var freq = st.base * Math.pow(2, n / 12);
    this.note(freq, st.tempo * 1.8, st.wave, 0.07);
    if (this.radioStep % 4 === 0) this.note(st.base / 2, st.tempo * 3, 'sine', 0.09);
    this.radioStep++;
  },

  nextStation: function () {
    this.radioStation = (this.radioStation + 1) % this.stations.length;
    this.radioStep = 0;
    return this.stations[this.radioStation].name;
  },

  burst: function (dur, vol, freq) {
    if (!this.ctx) return;
    var t = this.ctx.currentTime;
    var src = this.ctx.createBufferSource(); src.buffer = this.noiseBuf;
    var f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = freq || 1200;
    var g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f); f.connect(g); g.connect(this.master);
    src.start(t); src.stop(t + dur + 0.05);
  },

  sfx: function (name) {
    if (!this.ctx) return;
    if (name === 'shot') { this.burst(0.12, 0.25, 3000); this.note(180, 0.08, 'square', 0.1); }
    else if (name === 'crash') this.burst(0.3, 0.3, 500);
    else if (name === 'pickup') { this.note(660, 0.12, 'sine', 0.14); this.note(990, 0.18, 'sine', 0.14, this.ctx.currentTime + 0.09); }
    else if (name === 'coin') { this.note(1320, 0.1, 'sine', 0.12); this.note(1760, 0.16, 'sine', 0.12, this.ctx.currentTime + 0.07); }
    else if (name === 'mission') { var t = this.ctx.currentTime; this.note(523, 0.15, 'triangle', 0.14, t); this.note(659, 0.15, 'triangle', 0.14, t + 0.12); this.note(784, 0.3, 'triangle', 0.16, t + 0.24); }
    else if (name === 'busted') { var t2 = this.ctx.currentTime; this.note(392, 0.25, 'sawtooth', 0.12, t2); this.note(311, 0.4, 'sawtooth', 0.12, t2 + 0.2); }
    else if (name === 'punch') this.burst(0.08, 0.2, 900);
    else if (name === 'steal') { this.note(220, 0.1, 'square', 0.1); this.note(330, 0.14, 'square', 0.1, this.ctx.currentTime + 0.08); }
  },

  toggleMute: function () {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.5;
    return this.muted;
  }
};
