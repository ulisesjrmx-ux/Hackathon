const BACKGROUND_MUSIC_URL =
  '/assets/aistudio/lexin_music-interstellar-space-117482_773387a5.mp3';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private bgm: HTMLAudioElement | null = null;
  private _muted = false;
  private baseBgmVolume = 0.34;

  public get muted(): boolean {
    return this._muted;
  }

  public set muted(value: boolean) {
    this._muted = value;
    if (this.bgm) {
      this.bgm.muted = value;
      if (!value && this.bgm.paused) {
        this.bgm.play().catch(() => {});
      }
    }
  }

  private ensureBgm(): HTMLAudioElement | null {
    if (typeof window === 'undefined') return null;
    if (!this.bgm) {
      const audio = new Audio(BACKGROUND_MUSIC_URL);
      audio.loop = true;
      audio.preload = 'auto';
      audio.volume = this.baseBgmVolume;
      audio.muted = this._muted;
      this.bgm = audio;
    }
    return this.bgm;
  }

  public ensureMusicPlaying() {
    const audio = this.ensureBgm();
    if (!audio || this._muted) return;
    if (audio.paused) {
      audio.play().catch(() => {});
    }
  }

  public setMusicDucked(ducked: boolean) {
    if (!this.bgm) return;
    this.bgm.volume = ducked ? 0.22 : this.baseBgmVolume;
  }

  private ensureContext(): AudioContext | null {
    if (this._muted) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public playCrystalPickup() {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(660, now);
    osc.frequency.exponentialRampToValueAtTime(1180, now + 0.14);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.19);
  }

  public playDownloadTick(progress: number) {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    const freq = 420 + progress * 480;
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.035, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.07);
  }

  public playObjectRescued() {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const start = now + idx * 0.07;
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.08, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.3);
    });
  }

  public playLaunchSequence() {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Deep propulsion rumble using filtered noise
    const bufferSize = ctx.sampleRate * 2.4;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(140, now);
    filter.frequency.exponentialRampToValueAtTime(900, now + 1.4);
    filter.frequency.exponentialRampToValueAtTime(200, now + 2.3);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.16, now + 0.35);
    gain.gain.exponentialRampToValueAtTime(0.002, now + 2.35);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 2.4);

    // Ascending harmonic sweep
    const sweep = ctx.createOscillator();
    const sweepGain = ctx.createGain();
    sweep.type = 'sawtooth';
    sweep.frequency.setValueAtTime(95, now);
    sweep.frequency.exponentialRampToValueAtTime(420, now + 1.8);

    sweepGain.gain.setValueAtTime(0.03, now);
    sweepGain.gain.exponentialRampToValueAtTime(0.001, now + 1.9);

    sweep.connect(sweepGain);
    sweepGain.connect(ctx.destination);
    sweep.start(now);
    sweep.stop(now + 1.95);
  }

  public playArrivalChime() {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [440, 554.37, 659.25];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const t = now + i * 0.09;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.07, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.36);
    });
  }

  public playProximityAlert() {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    [0, 0.13].forEach((offset, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      const t = now + offset;
      osc.frequency.setValueAtTime(i === 0 ? 780 : 1040, t);
      gain.gain.setValueAtTime(0.032, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.095);
    });
  }

  public playLowFuelAlert() {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    [0, 0.18].forEach((offset) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const t = now + offset;
      osc.frequency.setValueAtTime(520, t);
      osc.frequency.exponentialRampToValueAtTime(340, t + 0.11);
      gain.gain.setValueAtTime(0.055, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.14);
    });
  }

  public playAsteroidImpact() {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Low impact punch
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(38, now + 0.28);
    oscGain.gain.setValueAtTime(0.16, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.32);

    // Metallic/rocky crunch noise
    const bufLen = Math.floor(ctx.sampleRate * 0.24);
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) {
      ch[i] = (Math.random() * 2 - 1) * (1 - i / bufLen);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(620, now);
    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.14, now);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
    noise.connect(filter);
    filter.connect(nGain);
    nGain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.25);
  }
}

export const soundEngine = new SoundEngine();
