import type { VehicleId } from '../types/game';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private enabled = true;
  private speechTimer: number | null = null;
  private voicesLoaded = false;
  private idVoice: SpeechSynthesisVoice | null = null;
  private enVoice: SpeechSynthesisVoice | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          this.voicesLoaded = true;
          this.idVoice =
            voices.find((v) => v.lang.toLowerCase().startsWith('id')) || null;
          this.enVoice =
            voices.find((v) => v.lang.toLowerCase() === 'en-us') ||
            voices.find((v) => v.lang.toLowerCase().startsWith('en')) ||
            null;
        }
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.stopSpeech();
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  private ensureContext(): AudioContext | null {
    if (!this.enabled || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public unlock(): void {
    this.ensureContext();
  }

  public stopSpeech(): void {
    if (this.speechTimer !== null) {
      window.clearTimeout(this.speechTimer);
      this.speechTimer = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore speech cancellation errors on restricted browsers
      }
    }
  }

  public speakBilingual(idText: string, enText?: string): void {
    if (!this.enabled || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }
    this.stopSpeech();
    if (!this.voicesLoaded) {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        this.voicesLoaded = true;
        this.idVoice = voices.find((v) => v.lang.toLowerCase().startsWith('id')) || null;
        this.enVoice =
          voices.find((v) => v.lang.toLowerCase() === 'en-us') ||
          voices.find((v) => v.lang.toLowerCase().startsWith('en')) ||
          null;
      }
    }

    const speakEn = () => {
      if (!this.enabled || !enText) return;
      try {
        const uEn = new SpeechSynthesisUtterance(enText);
        uEn.lang = 'en-US';
        if (this.enVoice) uEn.voice = this.enVoice;
        uEn.rate = 0.92;
        uEn.pitch = 1.15;
        uEn.volume = 0.95;
        window.speechSynthesis.speak(uEn);
      } catch {
        // Ignore
      }
    };

    try {
      const uId = new SpeechSynthesisUtterance(idText);
      uId.lang = 'id-ID';
      if (this.idVoice) uId.voice = this.idVoice;
      uId.rate = 0.94;
      uId.pitch = 1.12;
      uId.volume = 1.0;
      uId.onend = () => {
        if (enText) {
          this.speechTimer = window.setTimeout(speakEn, 180);
        }
      };
      uId.onerror = () => {
        if (enText) {
          this.speechTimer = window.setTimeout(speakEn, 150);
        }
      };
      window.speechSynthesis.speak(uId);
    } catch {
      // Ignore
    }
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    gainPeak = 0.14,
    startOffset = 0,
    endFreq?: number,
  ): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime + startOffset;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);
    }
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(gainPeak, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  public playPop(): void {
    this.playTone(520, 0.09, 'sine', 0.16, 0, 780);
  }

  public playTryAgain(): void {
    this.playTone(320, 0.14, 'triangle', 0.14, 0, 250);
    this.playTone(260, 0.16, 'triangle', 0.12, 0.14, 210);
  }

  public playSuccessChime(): void {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, idx) => {
      this.playTone(n, 0.18, 'triangle', 0.16, idx * 0.07);
    });
  }

  public playCelebrateFanfare(): void {
    const melody = [
      { f: 523.25, t: 0, d: 0.14 },
      { f: 659.25, t: 0.12, d: 0.14 },
      { f: 783.99, t: 0.24, d: 0.14 },
      { f: 1046.5, t: 0.38, d: 0.38 },
      { f: 783.99, t: 0.56, d: 0.14 },
      { f: 1046.5, t: 0.7, d: 0.45 },
    ];
    melody.forEach((m) => this.playTone(m.f, m.d, 'triangle', 0.18, m.t));
  }

  public playHorn(vehicleId: VehicleId): void {
    switch (vehicleId) {
      case 'molen':
        // Warm deep dual honk
        this.playTone(230, 0.16, 'sawtooth', 0.08, 0);
        this.playTone(290, 0.16, 'sawtooth', 0.08, 0);
        this.playTone(230, 0.22, 'sawtooth', 0.08, 0.22);
        this.playTone(290, 0.22, 'sawtooth', 0.08, 0.22);
        break;
      case 'angkut':
        // Cheerful tin-tin!
        this.playTone(392, 0.13, 'square', 0.07, 0);
        this.playTone(493.88, 0.13, 'square', 0.06, 0);
        this.playTone(392, 0.18, 'square', 0.07, 0.18);
        this.playTone(493.88, 0.18, 'square', 0.06, 0.18);
        break;
      case 'tangki':
        // Air horn bass chord
        this.playTone(220, 0.38, 'sawtooth', 0.07, 0);
        this.playTone(277.18, 0.38, 'sawtooth', 0.07, 0);
        break;
      case 'crane':
        // Safety beep-beep-beep
        this.playTone(880, 0.1, 'sine', 0.13, 0);
        this.playTone(880, 0.1, 'sine', 0.13, 0.15);
        this.playTone(880, 0.1, 'sine', 0.13, 0.3);
        break;
      case 'pemadam':
        // Friendly wee-woo siren
        this.playSirenBurst();
        break;
      case 'sampah':
        // Friendly low-high honk
        this.playTone(260, 0.15, 'triangle', 0.14, 0, 310);
        this.playTone(340, 0.22, 'triangle', 0.14, 0.18, 390);
        break;
    }
  }

  public playSirenBurst(): void {
    this.playTone(620, 0.28, 'sine', 0.14, 0, 920);
    this.playTone(920, 0.28, 'sine', 0.14, 0.28, 600);
    this.playTone(600, 0.28, 'sine', 0.14, 0.56, 940);
  }

  public playEngineRev(): void {
    this.playTone(95, 0.25, 'sawtooth', 0.06, 0, 145);
    this.playTone(145, 0.35, 'sawtooth', 0.05, 0.25, 115);
  }

  public playMixerSpin(): void {
    for (let i = 0; i < 6; i++) {
      this.playTone(180 + (i % 2) * 55, 0.16, 'triangle', 0.1, i * 0.16, 220);
    }
  }

  public playWaterSplash(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    // Bubble chimes + filtered noise burst
    this.playTone(420, 0.12, 'sine', 0.12, 0, 680);
    this.playTone(540, 0.14, 'sine', 0.1, 0.08, 860);
    const bufferSize = Math.floor(ctx.sampleRate * 0.22);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1100;
    const gain = ctx.createGain();
    gain.gain.value = 0.08;
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
  }

  public playPipeClick(): void {
    this.playTone(340, 0.07, 'triangle', 0.15, 0, 440);
  }

  public playCraneMove(): void {
    this.playTone(280, 0.1, 'sine', 0.1, 0, 310);
  }
}

export const soundEngine = new SoundEngine();
