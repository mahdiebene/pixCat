import { GameState } from './types';

export interface VoiceMimicCallbacks {
  onToast: (msg: string) => void;
  onFallbackMeow: () => void;
  onMimicStarted: (durationSec: number) => void;
  onMimicEnded: () => void;
}

export class RetroAudio {
  private ctx: AudioContext | null = null;
  private noiseBuf: AudioBuffer | null = null;
  private showerNode: AudioBufferSourceNode | null = null;
  private showerGain: GainNode | null = null;

  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private micSource: MediaStreamAudioSourceNode | null = null;
  private micAnalyser: AnalyserNode | null = null;
  private micData: Uint8Array<ArrayBuffer> | null = null;
  private playAnalyser: AnalyserNode | null = null;
  private playData: Uint8Array<ArrayBuffer> | null = null;
  private playGain: GainNode | null = null;
  private activeSource: AudioBufferSourceNode | null = null;
  private recordTimeout: number | null = null;
  private recordRequestId = 0;
  private muted = false;

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (muted) {
      this.setShowerSound(false);
    }
    if (this.playGain) {
      this.playGain.gain.value = muted ? 0 : 1.15;
    }
  }

  ensure(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
      const len = this.ctx.sampleRate;
      this.noiseBuf = this.ctx.createBuffer(1, len, len);
      const ch = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) {
        ch[i] = Math.random() * 2 - 1;
      }
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private tone(
    freq: number,
    endFreq: number,
    dur: number,
    type: OscillatorType = 'square',
    vol = 0.11,
    delay = 0,
  ): void {
    if (this.muted) return;
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq !== freq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(30, endFreq), now + dur);
    }
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  }

  playClick(): void {
    this.tone(540, 720, 0.055, 'square', 0.075);
  }

  playPickUp(): void {
    this.tone(420, 620, 0.07, 'triangle', 0.1);
  }

  playDrop(): void {
    this.tone(520, 340, 0.07, 'triangle', 0.09);
  }

  playStartChime(): void {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, i) => this.tone(n, n, 0.11, 'square', 0.085, i * 0.065));
  }

  playCoin(): void {
    this.tone(987.77, 987.77, 0.065, 'square', 0.085, 0);
    this.tone(1318.5, 1318.5, 0.16, 'square', 0.085, 0.065);
  }

  playBoop(): void {
    const jitter = 0.94 + Math.random() * 0.12;
    this.tone(360 * jitter, 760 * jitter, 0.1, 'triangle', 0.15);
    this.tone(760 * jitter, 520 * jitter, 0.09, 'sine', 0.11, 0.08);
  }

  playMeow(variant = 0): void {
    if (this.muted) return;
    const base = [620, 700, 560, 780][variant % 4];
    this.tone(base, base * 1.45, 0.14, 'triangle', 0.14, 0);
    this.tone(base * 1.45, base * 0.92, 0.22, 'triangle', 0.12, 0.12);
    this.tone(base * 1.01, base * 1.44, 0.14, 'square', 0.03, 0);
  }

  playPurr(): void {
    if (this.muted) return;
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    const mainGain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(52, now);
    lfo.frequency.setValueAtTime(24, now);
    lfoGain.gain.setValueAtTime(0.05, now);
    mainGain.gain.setValueAtTime(0.001, now);
    mainGain.gain.linearRampToValueAtTime(0.055, now + 0.05);
    mainGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 180;

    lfo.connect(lfoGain);
    lfoGain.connect(mainGain.gain);
    osc.connect(filter);
    filter.connect(mainGain);
    mainGain.connect(ctx.destination);
    osc.start(now);
    lfo.start(now);
    osc.stop(now + 0.36);
    lfo.stop(now + 0.36);
  }

  playBubblePop(): void {
    const f = 460 + Math.random() * 440;
    this.tone(f, f * 2.1, 0.065, 'sine', 0.1);
  }

  playDuckSqueak(): void {
    this.tone(1150, 1520, 0.085, 'square', 0.075, 0);
    this.tone(1480, 1020, 0.1, 'triangle', 0.1, 0.07);
  }

  playKettleWhistle(): void {
    this.tone(880, 1180, 0.18, 'sine', 0.09, 0);
    this.tone(1180, 1320, 0.2, 'sine', 0.07, 0.16);
  }

  playSparkle(): void {
    const notes = [880, 1174.66, 1567.98];
    notes.forEach((n, i) => this.tone(n, n * 1.05, 0.08, 'triangle', 0.08, i * 0.045));
  }

  playCrunch(): void {
    if (this.muted) return;
    const ctx = this.ensure();
    if (!ctx || !this.noiseBuf) return;
    for (let i = 0; i < 3; i++) {
      const now = ctx.currentTime + i * 0.13;
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuf;
      const filt = ctx.createBiquadFilter();
      filt.type = 'bandpass';
      filt.frequency.value = 1200 + i * 240;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.13, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.075);
      src.connect(filt);
      filt.connect(g);
      g.connect(ctx.destination);
      src.start(now);
      src.stop(now + 0.085);
    }
  }

  playLullabyNote(step: number): void {
    const melody = [523.25, 659.25, 783.99, 659.25, 587.33, 659.25, 523.25, 392.0];
    const f = melody[step % melody.length];
    this.tone(f, f, 0.4, 'triangle', 0.055);
  }

  setShowerSound(on: boolean): void {
    if (this.muted || !on) {
      if (this.showerNode) {
        try {
          this.showerNode.stop();
        } catch {
          // ignore already stopped
        }
        this.showerNode.disconnect();
        this.showerNode = null;
      }
      if (this.showerGain) {
        this.showerGain.disconnect();
        this.showerGain = null;
      }
      return;
    }
    const ctx = this.ensure();
    if (!ctx || !this.noiseBuf || this.showerNode) return;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    const filt = ctx.createBiquadFilter();
    filt.type = 'bandpass';
    filt.frequency.value = 1900;
    filt.Q.value = 0.6;
    const g = ctx.createGain();
    g.gain.value = 0.05;
    src.connect(filt);
    filt.connect(g);
    g.connect(ctx.destination);
    src.start();
    this.showerNode = src;
    this.showerGain = g;
  }

  async startRecording(state: GameState, cb: VoiceMimicCallbacks): Promise<void> {
    if (state.playroom.recording) return;
    const reqId = ++this.recordRequestId;
    const ctx = this.ensure();
    if (!ctx) {
      cb.onToast('Audio unavailable — Mochi meowed instead!');
      cb.onFallbackMeow();
      return;
    }
    if (
      typeof MediaRecorder === 'undefined' ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      cb.onToast('Mic unavailable here — Mochi meowed instead!');
      cb.onFallbackMeow();
      return;
    }

    try {
      this.stopMimicPlayback(state);

      if (!this.mediaStream) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Abort cleanly if user left playroom, muted/cancelled, or started another request while permission prompt was open
        if (
          reqId !== this.recordRequestId ||
          state.screen !== 'playroom' ||
          state.playroom.miniGame.active
        ) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        this.mediaStream = stream;
      }

      if (
        reqId !== this.recordRequestId ||
        state.screen !== 'playroom' ||
        state.playroom.miniGame.active
      ) {
        return;
      }

      if (this.micSource) {
        try {
          this.micSource.disconnect();
        } catch {
          // ignore disconnect errors
        }
        this.micSource = null;
      }
      this.micSource = ctx.createMediaStreamSource(this.mediaStream);
      this.micAnalyser = ctx.createAnalyser();
      this.micAnalyser.fftSize = 256;
      this.micData = new Uint8Array(new ArrayBuffer(this.micAnalyser.frequencyBinCount));
      this.micSource.connect(this.micAnalyser);

      this.recordedChunks = [];
      this.mediaRecorder = new MediaRecorder(this.mediaStream);
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) this.recordedChunks.push(e.data);
      };
      this.mediaRecorder.onstop = () => {
        if (reqId === this.recordRequestId) {
          void this.processAndMimic(state, cb, reqId);
        }
      };

      this.mediaRecorder.start();
      state.playroom.recording = true;
      state.cat.speechText = 'LISTENING...';
      state.cat.speechTimer = 5.2;

      if (this.recordTimeout !== null) window.clearTimeout(this.recordTimeout);
      this.recordTimeout = window.setTimeout(() => {
        if (state.playroom.recording) this.stopRecording(state);
      }, 5000);
    } catch {
      if (reqId !== this.recordRequestId) return;
      state.playroom.recording = false;
      cb.onToast('Mic permission needed — Mochi meowed instead!');
      cb.onFallbackMeow();
    }
  }

  stopRecording(state: GameState, discard = false): void {
    if (discard) {
      this.recordRequestId++;
    }
    if (this.recordTimeout !== null) {
      window.clearTimeout(this.recordTimeout);
      this.recordTimeout = null;
    }
    if (this.micSource) {
      try {
        this.micSource.disconnect();
      } catch {
        // ignore
      }
      this.micSource = null;
    }
    if (!state.playroom.recording) return;
    state.playroom.recording = false;
    state.playroom.micLevel = 0;
    if (discard && state.cat.speechText === 'LISTENING...') {
      state.cat.speechTimer = 0;
    }
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        if (discard) {
          this.mediaRecorder.onstop = null;
        }
        this.mediaRecorder.stop();
      } catch {
        // ignore stop errors
      }
    }
  }

  stopMimicPlayback(state: GameState): void {
    if (this.activeSource) {
      try {
        this.activeSource.onended = null;
        this.activeSource.stop();
      } catch {
        // ignore
      }
      this.activeSource.disconnect();
      this.activeSource = null;
    }
    if (this.playGain) {
      try {
        this.playGain.disconnect();
      } catch {
        // ignore
      }
      this.playGain = null;
    }
    state.playroom.mimicking = false;
    state.playroom.audioAmp = 0;
    state.cat.mouthOpen = 0;
  }

  stopAll(state: GameState): void {
    this.setShowerSound(false);
    this.stopRecording(state, true);
    this.stopMimicPlayback(state);
  }

  private async processAndMimic(
    state: GameState,
    cb: VoiceMimicCallbacks,
    reqId: number,
  ): Promise<void> {
    const ctx = this.ensure();
    if (!ctx || this.recordedChunks.length === 0) return;
    if (reqId !== this.recordRequestId) return;
    if (state.screen !== 'playroom' || state.playroom.miniGame.active) return;

    try {
      const blob = new Blob(this.recordedChunks);
      const arrBuf = await blob.arrayBuffer();
      if (reqId !== this.recordRequestId) return;
      const audioBuf = await ctx.decodeAudioData(arrBuf);
      if (
        reqId !== this.recordRequestId ||
        state.screen !== 'playroom' ||
        state.playroom.miniGame.active
      ) {
        return;
      }

      if (audioBuf.duration < 0.16) {
        cb.onFallbackMeow();
        return;
      }

      const src = ctx.createBufferSource();
      src.buffer = audioBuf;
      src.playbackRate.value = 1.48;

      this.playAnalyser = ctx.createAnalyser();
      this.playAnalyser.fftSize = 256;
      this.playData = new Uint8Array(new ArrayBuffer(this.playAnalyser.frequencyBinCount));

      const gain = ctx.createGain();
      gain.gain.value = this.muted ? 0 : 1.15;
      this.playGain = gain;

      src.connect(this.playAnalyser);
      this.playAnalyser.connect(gain);
      gain.connect(ctx.destination);

      this.activeSource = src;
      state.playroom.mimicking = true;
      cb.onMimicStarted(audioBuf.duration / 1.48);

      src.onended = () => {
        state.playroom.mimicking = false;
        state.playroom.audioAmp = 0;
        state.cat.mouthOpen = 0;
        this.activeSource = null;
        this.playGain = null;
        cb.onMimicEnded();
      };

      src.start();
    } catch {
      if (reqId === this.recordRequestId) {
        cb.onFallbackMeow();
      }
    }
  }

  sampleAmplitude(state: GameState): void {
    if (state.playroom.recording && this.micAnalyser && this.micData) {
      this.micAnalyser.getByteTimeDomainData(this.micData);
      let sum = 0;
      for (let i = 0; i < this.micData.length; i++) {
        const v = (this.micData[i] - 128) / 128;
        sum += v * v;
      }
      state.playroom.micLevel = Math.min(1, Math.sqrt(sum / this.micData.length) * 4.5);
    }
    if (state.playroom.mimicking && this.playAnalyser && this.playData) {
      this.playAnalyser.getByteTimeDomainData(this.playData);
      let sum = 0;
      for (let i = 0; i < this.playData.length; i++) {
        const v = (this.playData[i] - 128) / 128;
        sum += v * v;
      }
      const amp = Math.min(1, Math.sqrt(sum / this.playData.length) * 5.2);
      state.playroom.audioAmp = amp;
      state.cat.mouthOpen = amp > 0.08 ? Math.min(1, amp * 1.4) : 0;
    }
  }

  dispose(state: GameState): void {
    this.stopAll(state);
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}
