// Every sound in MOLT is synthesized live. No samples, no downloads, no mercy.

import { settings, saveSettings } from "./config.js";

export class Sound {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.musicGain = null;
    this.noiseBuf = null;
    this.musicOn = false;
    this.musicDesired = false;
    this.step = 0;
    this.nextTime = 0;
    this.stepDur = 60 / 112 / 2;
  }

  init() {
    if (this.ctx) {
      if (this.ctx.state === "suspended") this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    const comp = this.ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.knee.value = 24;
    comp.ratio.value = 8;
    comp.attack.value = 0.003;
    comp.release.value = 0.2;

    this.master = this.ctx.createGain();
    this.master.gain.value = settings.audio.muted ? 0 : 0.72;
    this.master.connect(comp);
    comp.connect(this.ctx.destination);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.2;
    this.musicGain.connect(this.master);

    const len = Math.floor(this.ctx.sampleRate * 1.2);
    this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  }

  applyMix() {
    if (!this.master || !this.ctx) return;
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setTargetAtTime(settings.audio.muted ? 0 : 0.72, t, 0.02);
  }

  toggleMute() {
    settings.audio.muted = !settings.audio.muted;
    saveSettings();
    this.applyMix();
    return settings.audio.muted;
  }

  setMuted(muted) {
    settings.audio.muted = !!muted;
    saveSettings();
    this.applyMix();
  }

  setMusicEnabled(enabled) {
    settings.audio.music = !!enabled;
    saveSettings();
    if (!settings.audio.music) this.musicOn = false;
  }

  setSfxEnabled(enabled) {
    settings.audio.sfx = !!enabled;
    saveSettings();
  }

  resume() {
    this.init();
    if (this.ctx?.state === "suspended") this.ctx.resume();
  }

  noise(time, dur, { gain = 0.2, type = "bandpass", freq = 1200, q = 1, sweepTo = null, dest = null } = {}) {
    if (!this.ctx || !this.noiseBuf) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const filt = this.ctx.createBiquadFilter();
    filt.type = type;
    filt.frequency.setValueAtTime(freq, time);
    if (sweepTo) filt.frequency.exponentialRampToValueAtTime(Math.max(30, sweepTo), time + dur);
    filt.Q.value = q;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, time);
    g.gain.linearRampToValueAtTime(gain, time + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    src.connect(filt);
    filt.connect(g);
    g.connect(dest || this.master);
    src.start(time);
    src.stop(time + dur + 0.02);
  }

  tone(time, dur, { type = "sine", freq = 220, to = null, gain = 0.2, attack = 0.004, dest = null } = {}) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);
    if (to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), time + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, time);
    g.gain.linearRampToValueAtTime(gain, time + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    osc.connect(g);
    g.connect(dest || this.master);
    osc.start(time);
    osc.stop(time + dur + 0.02);
  }

  sfx(name, power = 1) {
    if (!this.ctx || !settings.audio.sfx || settings.audio.muted) return;
    const t = this.ctx.currentTime;
    switch (name) {
      case "light":
      case "hit":
        this.noise(t, 0.07, { gain: 0.3 * power, freq: 1500, sweepTo: 450, q: 0.8 });
        this.tone(t, 0.1, { freq: 190, to: 70, gain: 0.35 * power });
        break;
      case "heavy":
        this.noise(t, 0.13, { gain: 0.46, freq: 1000, sweepTo: 180, q: 0.7 });
        this.tone(t, 0.2, { freq: 150, to: 42, gain: 0.52 });
        this.tone(t, 0.06, { type: "square", freq: 90, to: 50, gain: 0.12 });
        break;
      case "block":
        this.noise(t, 0.05, { gain: 0.22, type: "highpass", freq: 1800 });
        this.tone(t, 0.06, { type: "triangle", freq: 620, to: 380, gain: 0.18 });
        break;
      case "whiff":
        this.noise(t, 0.08, { gain: 0.1, type: "bandpass", freq: 2200, sweepTo: 700, q: 1.4 });
        break;
      case "special":
        this.tone(t, 0.3, { type: "sawtooth", freq: 120, to: 480, gain: 0.13 });
        this.noise(t, 0.3, { gain: 0.16, type: "bandpass", freq: 500, sweepTo: 2400, q: 1.2 });
        break;
      case "jump":
        this.tone(t, 0.08, { type: "triangle", freq: 280, to: 520, gain: 0.08 });
        break;
      case "land":
        this.noise(t, 0.07, { gain: 0.12, type: "lowpass", freq: 500, sweepTo: 150 });
        this.tone(t, 0.07, { freq: 110, to: 60, gain: 0.1 });
        break;
      case "ko":
        this.noise(t, 0.5, { gain: 0.5, type: "lowpass", freq: 800, sweepTo: 80 });
        this.tone(t, 0.55, { freq: 120, to: 30, gain: 0.55 });
        this.tone(t + 0.02, 0.3, { type: "square", freq: 70, to: 38, gain: 0.16 });
        break;
      case "ui":
        this.tone(t, 0.05, { type: "square", freq: 620, gain: 0.05 });
        break;
      case "confirm":
        this.tone(t, 0.07, { type: "square", freq: 520, gain: 0.07 });
        this.tone(t + 0.06, 0.1, { type: "square", freq: 780, gain: 0.07 });
        break;
      case "deny":
        this.tone(t, 0.12, { type: "square", freq: 120, to: 90, gain: 0.07 });
        break;
      case "round":
        this.tone(t, 0.5, { freq: 330, gain: 0.12 });
        this.tone(t, 0.6, { type: "triangle", freq: 495, gain: 0.06 });
        this.noise(t, 0.4, { gain: 0.05, type: "lowpass", freq: 800 });
        break;
      case "fight":
        this.tone(t, 0.16, { type: "square", freq: 440, gain: 0.09 });
        this.tone(t + 0.13, 0.4, { type: "square", freq: 660, gain: 0.09 });
        this.noise(t, 0.3, { gain: 0.14, type: "bandpass", freq: 1400, sweepTo: 500 });
        break;
      case "win":
        this.tone(t, 0.18, { type: "triangle", freq: 392, gain: 0.12 });
        this.tone(t + 0.15, 0.18, { type: "triangle", freq: 523, gain: 0.12 });
        this.tone(t + 0.3, 0.44, { type: "triangle", freq: 659, gain: 0.13 });
        break;
      default:
        break;
    }
  }

  startMusic() {
    this.musicDesired = true;
    this.step = 0;
    if (!this.ctx) return;
    this.nextTime = this.ctx.currentTime + 0.06;
  }

  stopMusic() {
    this.musicDesired = false;
    this.musicOn = false;
  }

  update() {
    if (!this.ctx) return;
    const enabled =
      this.musicDesired &&
      settings.audio.music &&
      !settings.audio.muted &&
      this.ctx.state === "running";
    if (!enabled) {
      this.musicOn = false;
      return;
    }
    if (!this.musicOn) {
      this.musicOn = true;
      this.nextTime = this.ctx.currentTime + 0.06;
    }
    const horizon = this.ctx.currentTime + 0.16;
    let guard = 0;
    while (this.nextTime < horizon && guard < 16) {
      this.playStep(this.step, this.nextTime);
      this.nextTime += this.stepDur;
      this.step = (this.step + 1) % 32;
      guard++;
    }
  }

  playStep(step, t) {
    const m = this.musicGain;
    const beat = step % 16;

    if (beat % 4 === 0) this.kick(t);
    if (beat === 4 || beat === 12) this.snare(t);
    if (beat % 2 === 0) this.noise(t, 0.035, { gain: beat % 4 === 2 ? 0.05 : 0.028, type: "highpass", freq: 7200, dest: m });
    if (beat === 7 || beat === 14) this.hat(t, 0.08);

    const bassA = [55, 0, 55, 0, 65.4, 0, 55, 0, 82.4, 0, 55, 0, 73.4, 0, 65.4, 0];
    const bassB = [55, 0, 55, 0, 65.4, 0, 55, 0, 98, 0, 82.4, 0, 73.4, 0, 65.4, 0];
    const line = step < 16 ? bassA : bassB;
    const note = line[beat];
    if (note) this.bass(t, note);

    if ((step === 6 || step === 22) && Math.random() < 0.85) {
      this.tone(t, 0.18, { type: "triangle", freq: 880, gain: 0.045, dest: m });
    }
  }

  kick(t) {
    const m = this.musicGain;
    this.tone(t, 0.22, { freq: 140, to: 42, gain: 0.5, dest: m });
    this.noise(t, 0.035, { gain: 0.1, type: "lowpass", freq: 900, dest: m });
  }

  snare(t) {
    this.noise(t, 0.12, { gain: 0.2, type: "bandpass", freq: 1900, q: 0.7, dest: this.musicGain });
    this.tone(t, 0.07, { type: "triangle", freq: 200, to: 120, gain: 0.09, dest: this.musicGain });
  }

  hat(t, gain = 0.05) {
    this.noise(t, 0.03, { gain, type: "highpass", freq: 8200, dest: this.musicGain });
  }

  bass(t, freq) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = freq;
    const sub = this.ctx.createOscillator();
    sub.type = "sine";
    sub.frequency.value = freq / 2;
    const filt = this.ctx.createBiquadFilter();
    filt.type = "lowpass";
    filt.frequency.setValueAtTime(480, t);
    filt.frequency.exponentialRampToValueAtTime(150, t + 0.22);
    filt.Q.value = 7;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.13, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.26);
    const sg = this.ctx.createGain();
    sg.gain.setValueAtTime(0.0001, t);
    sg.gain.linearRampToValueAtTime(0.1, t + 0.014);
    sg.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);
    osc.connect(filt);
    filt.connect(g);
    g.connect(this.musicGain);
    sub.connect(sg);
    sg.connect(this.musicGain);
    osc.start(t);
    sub.start(t);
    osc.stop(t + 0.28);
    sub.stop(t + 0.26);
  }
}
