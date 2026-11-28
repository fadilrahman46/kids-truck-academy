import type { LanguageMode, VehicleId } from '../types/game';

interface ThemeChord {
  pad: number[];
  bassRoot: number;
  bassFifth: number;
  sparkle?: number[];
}

// 8-bar sunny, chill-ambience C-major / warm-7th chord progression (96 BPM)
const THEME_CHORDS: ThemeChord[] = [
  // Bar 0: Cmaj7
  { pad: [261.63, 329.63, 392.0, 493.88], bassRoot: 130.81, bassFifth: 196.0, sparkle: [523.25, 659.25] },
  // Bar 1: Am7
  { pad: [220.0, 261.63, 329.63, 392.0], bassRoot: 110.0, bassFifth: 164.81 },
  // Bar 2: Fmaj7
  { pad: [174.61, 220.0, 261.63, 329.63], bassRoot: 87.31, bassFifth: 130.81 },
  // Bar 3: G6
  { pad: [196.0, 246.94, 293.66, 329.63], bassRoot: 98.0, bassFifth: 146.83 },
  // Bar 4: Cmaj7
  { pad: [261.63, 329.63, 392.0, 493.88], bassRoot: 130.81, bassFifth: 196.0, sparkle: [783.99, 1046.5] },
  // Bar 5: Em7
  { pad: [164.81, 196.0, 246.94, 293.66], bassRoot: 82.41, bassFifth: 123.47 },
  // Bar 6: Dm7
  { pad: [146.83, 174.61, 220.0, 261.63], bassRoot: 73.42, bassFifth: 110.0 },
  // Bar 7: G9sus4 -> cozy turnaround back to Cmaj7
  { pad: [196.0, 261.63, 293.66, 440.0], bassRoot: 98.0, bassFifth: 146.83 },
];

// Happy, gentle kalimba/marimba melody mapped across 64 eighth-note steps (8 bars × 8 steps)
const THEME_MELODY: Record<number, { freq: number; dur: number; vel?: number }> = {
  // Bar 0 (Cmaj7)
  0: { freq: 659.25, dur: 0.52, vel: 0.9 }, // E5
  3: { freq: 783.99, dur: 0.45, vel: 0.85 }, // G5
  5: { freq: 880.0, dur: 0.38, vel: 0.9 }, // A5
  6: { freq: 783.99, dur: 0.58, vel: 0.8 }, // G5
  // Bar 1 (Am7)
  8: { freq: 659.25, dur: 0.5, vel: 0.85 }, // E5
  11: { freq: 587.33, dur: 0.35, vel: 0.8 }, // D5
  12: { freq: 523.25, dur: 0.55, vel: 0.9 }, // C5
  14: { freq: 659.25, dur: 0.48, vel: 0.78 }, // E5
  // Bar 2 (Fmaj7)
  16: { freq: 880.0, dur: 0.55, vel: 0.9 }, // A5
  19: { freq: 783.99, dur: 0.42, vel: 0.85 }, // G5
  21: { freq: 659.25, dur: 0.38, vel: 0.85 }, // E5
  22: { freq: 523.25, dur: 0.55, vel: 0.8 }, // C5
  // Bar 3 (G6)
  24: { freq: 587.33, dur: 0.52, vel: 0.88 }, // D5
  27: { freq: 659.25, dur: 0.36, vel: 0.82 }, // E5
  28: { freq: 783.99, dur: 0.85, vel: 0.86 }, // G5
  // Bar 4 (Cmaj7)
  32: { freq: 659.25, dur: 0.5, vel: 0.9 }, // E5
  35: { freq: 783.99, dur: 0.42, vel: 0.85 }, // G5
  37: { freq: 1046.5, dur: 0.42, vel: 0.88 }, // C6
  38: { freq: 987.77, dur: 0.55, vel: 0.8 }, // B5
  // Bar 5 (Em7)
  40: { freq: 783.99, dur: 0.5, vel: 0.86 }, // G5
  43: { freq: 659.25, dur: 0.36, vel: 0.8 }, // E5
  44: { freq: 587.33, dur: 0.52, vel: 0.85 }, // D5
  46: { freq: 659.25, dur: 0.46, vel: 0.78 }, // E5
  // Bar 6 (Dm7)
  48: { freq: 698.46, dur: 0.5, vel: 0.88 }, // F5
  51: { freq: 659.25, dur: 0.38, vel: 0.82 }, // E5
  52: { freq: 587.33, dur: 0.5, vel: 0.85 }, // D5
  54: { freq: 523.25, dur: 0.52, vel: 0.82 }, // C5
  // Bar 7 (G9sus4 turnaround)
  56: { freq: 587.33, dur: 0.5, vel: 0.85 }, // D5
  59: { freq: 659.25, dur: 0.35, vel: 0.8 }, // E5
  60: { freq: 587.33, dur: 0.48, vel: 0.82 }, // D5
  62: { freq: 493.88, dur: 0.55, vel: 0.76 }, // B4
};

const THEME_BPM = 96;
const THEME_STEP_SEC = 60 / THEME_BPM / 2; // Eighth-note step = 0.3125s
const THEME_TOTAL_STEPS = 64;
const MUSIC_BASE_GAIN = 0.2;
const MUSIC_DUCK_GAIN = 0.06;

export type NarrationMood = 'welcome' | 'explain' | 'action' | 'encourage' | 'celebrate';

const TTS_FETCH_TIMEOUT_MS = 7500;
const MAX_CLIENT_WAV_CACHE = 120;

const CELEBRATE_REGEX =
  /\b(hore|hebat|yeay|yay|bravo|bintang|berhasil|selesai|pintar|keren|mekar|amazing|great job|awesome|well done|earned a star|bloom|fantastic|wonderful)\b/i;
const ENCOURAGE_REGEX =
  /\b(coba lagi|hampir|belum|pelan|hati-hati|tunggu|almost|try again|careful|wait|ready|oops|ups)\b/i;
const WELCOME_REGEX =
  /\b(selamat datang|halo|pilih rumah|welcome|hello|pick your favorite)\b/i;
const ACTION_REGEX =
  /\b(wiu-wiu|wee-woo|melaju|berputar|memutar|menggali|menyemprot|mengantar|keluar|berhenti|jalan|driving|rolling|spinning|rushing|digging|spraying|zoom|go!)\b/i;
const HAS_PLAYFUL_OPENER_REGEX =
  /^(halo|wah|hore|yeay|ayo|yuk|wiu|hampir|ups|bagus|hebat|selamat|yay|ooh|woo|let'?s|hello|welcome|almost|great|wee|oops|nice|wow)\b/i;

function inferNarrationMood(text: string): NarrationMood {
  if (CELEBRATE_REGEX.test(text)) return 'celebrate';
  if (ENCOURAGE_REGEX.test(text)) return 'encourage';
  if (WELCOME_REGEX.test(text)) return 'welcome';
  if (ACTION_REGEX.test(text)) return 'action';
  return 'explain';
}

function enrichTextForChildren(text: string, lang: 'id' | 'en', mood: NarrationMood): string {
  const trimmed = text.trim();
  if (!trimmed) return '';
  const words = trimmed.split(/\s+/);

  // Keep short labels (truck names, numbers, colors, letters) snappy & bouncy
  if (words.length <= 3) {
    return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}!`;
  }

  if (HAS_PLAYFUL_OPENER_REGEX.test(trimmed)) {
    return trimmed;
  }

  // Deterministic friendly opener based on text length so caching stays consistent
  const variant = trimmed.length % 2;
  if (lang === 'en') {
    if (mood === 'celebrate') return `Yay! ${trimmed}`;
    if (mood === 'encourage') return `Almost there! ${trimmed}`;
    if (mood === 'action') return `Here we go! ${trimmed}`;
    if (mood === 'welcome') return `Hello friend! ${trimmed}`;
    return variant === 0 ? `Ooh, fun! ${trimmed}` : `Let's play! ${trimmed}`;
  }

  if (mood === 'celebrate') return `Hore! ${trimmed}`;
  if (mood === 'encourage') return `Hampir benar! ${trimmed}`;
  if (mood === 'action') return `Ayo melaju! ${trimmed}`;
  if (mood === 'welcome') return `Halo teman cilik! ${trimmed}`;
  return variant === 0 ? `Wah, seru! ${trimmed}` : `Yuk kita main! ${trimmed}`;
}

class SoundEngine {
  private ctx: AudioContext | null = null;
  private sfxEnabled = true;
  private musicEnabled = true;
  private languageMode: LanguageMode = 'id';
  private userUnlocked = false;
  private speechTimer: number | null = null;
  private duckReleaseTimer: number | null = null;
  private voicesLoaded = false;
  private idVoice: SpeechSynthesisVoice | null = null;
  private enVoice: SpeechSynthesisVoice | null = null;

  // Expressive Gemini TTS (Kore) playback & caching state
  private speechSeq = 0;
  private ttsAbort: AbortController | null = null;
  private activeVoiceSource: AudioBufferSourceNode | null = null;
  private activeVoiceHtmlAudio: HTMLAudioElement | null = null;
  private activeVoiceBlobUrl: string | null = null;
  private wavCache: Map<string, ArrayBuffer> = new Map();
  private isSpeaking = false;
  private speakingListeners: Set<(speaking: boolean) => void> = new Set();

  // Chill-happy background theme song state
  private musicBusGain: GainNode | null = null;
  private musicFilter: BiquadFilterNode | null = null;
  private shakerBuffer: AudioBuffer | null = null;
  private themeRequested = false;
  private themeRunning = false;
  private themeStep = 0;
  private themeNextStepTime = 0;
  private themeSchedulerId: number | null = null;
  private speechDuckActive = false;

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

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.pauseThemeScheduler();
        } else if (this.themeRequested && this.musicEnabled) {
          this.beginThemeLoop();
        }
      });
    }
  }

  public setSfxEnabled(enabled: boolean): void {
    this.sfxEnabled = enabled;
    if (!enabled) {
      this.stopSpeech();
    }
  }

  public isSfxEnabled(): boolean {
    return this.sfxEnabled;
  }

  /** Backward-compatible alias for Sound FX & voice toggle */
  public setEnabled(enabled: boolean): void {
    this.setSfxEnabled(enabled);
  }

  public isEnabled(): boolean {
    return this.sfxEnabled;
  }

  public setMusicEnabled(enabled: boolean): void {
    this.musicEnabled = enabled;
    if (!enabled) {
      this.pauseThemeScheduler();
    } else if (this.themeRequested) {
      this.beginThemeLoop();
    }
  }

  public isMusicEnabled(): boolean {
    return this.musicEnabled;
  }

  public setLanguageMode(mode: LanguageMode): void {
    if (this.languageMode !== mode) {
      this.stopSpeech();
    }
    this.languageMode = mode;
  }

  public getLanguageMode(): LanguageMode {
    return this.languageMode;
  }

  public subscribeSpeaking(listener: (speaking: boolean) => void): () => void {
    this.speakingListeners.add(listener);
    listener(this.isSpeaking);
    return () => {
      this.speakingListeners.delete(listener);
    };
  }

  private setSpeakingState(next: boolean): void {
    if (this.isSpeaking === next) return;
    this.isSpeaking = next;
    this.speakingListeners.forEach((fn) => fn(next));
  }

  public isThemePlaying(): boolean {
    return this.themeRunning && this.musicEnabled;
  }

  private hasUserActivation(): boolean {
    if (this.userUnlocked) return true;
    const nav =
      typeof navigator !== 'undefined'
        ? (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } })
        : null;
    return Boolean(nav?.userActivation?.hasBeenActive);
  }

  private ensureContext(): AudioContext | null {
    if ((!this.sfxEnabled && !this.musicEnabled) || typeof window === 'undefined') return null;
    if (!this.ctx) {
      if (!this.hasUserActivation()) return null;
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended' && this.hasUserActivation()) {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private ensureMusicBus(ctx: AudioContext): BiquadFilterNode {
    if (!this.musicBusGain || !this.musicFilter) {
      this.musicFilter = ctx.createBiquadFilter();
      this.musicFilter.type = 'lowpass';
      this.musicFilter.frequency.value = 2600;
      this.musicFilter.Q.value = 0.6;

      this.musicBusGain = ctx.createGain();
      this.musicBusGain.gain.value = 0.0001;

      this.musicFilter.connect(this.musicBusGain);
      this.musicBusGain.connect(ctx.destination);
    }

    if (!this.shakerBuffer) {
      const len = Math.floor(ctx.sampleRate * 0.06);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const ch = buf.getChannelData(0);
      for (let i = 0; i < len; i++) {
        ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.2);
      }
      this.shakerBuffer = buf;
    }

    return this.musicFilter;
  }

  private setSpeechDucking(ducking: boolean): void {
    this.speechDuckActive = ducking;
    if (this.duckReleaseTimer !== null) {
      window.clearTimeout(this.duckReleaseTimer);
      this.duckReleaseTimer = null;
    }
    if (!this.ctx || !this.musicBusGain || !this.themeRunning) return;
    const now = this.ctx.currentTime;
    const target = ducking ? MUSIC_DUCK_GAIN : MUSIC_BASE_GAIN;
    const timeConstant = ducking ? 0.12 : 0.32;
    this.musicBusGain.gain.cancelScheduledValues(now);
    this.musicBusGain.gain.setTargetAtTime(target, now, timeConstant);
  }

  public unlock(): void {
    this.userUnlocked = true;
    this.ensureContext();
    if (this.themeRequested && this.musicEnabled && !this.themeRunning) {
      this.beginThemeLoop();
    }
  }

  public startThemeMusic(): void {
    this.themeRequested = true;
    if (!this.musicEnabled) return;
    this.beginThemeLoop();
  }

  public stopThemeMusic(): void {
    this.themeRequested = false;
    this.pauseThemeScheduler();
  }

  private pauseThemeScheduler(): void {
    this.themeRunning = false;
    if (this.themeSchedulerId !== null) {
      window.clearInterval(this.themeSchedulerId);
      this.themeSchedulerId = null;
    }
    if (this.ctx && this.musicBusGain) {
      const now = this.ctx.currentTime;
      this.musicBusGain.gain.cancelScheduledValues(now);
      this.musicBusGain.gain.setTargetAtTime(0.0001, now, 0.14);
    }
  }

  private beginThemeLoop(): void {
    if (this.themeRunning || !this.musicEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    this.ensureMusicBus(ctx);
    this.themeRunning = true;
    this.themeNextStepTime = ctx.currentTime + 0.08;

    if (this.musicBusGain) {
      const now = ctx.currentTime;
      const target = this.speechDuckActive ? MUSIC_DUCK_GAIN : MUSIC_BASE_GAIN;
      this.musicBusGain.gain.cancelScheduledValues(now);
      this.musicBusGain.gain.setValueAtTime(Math.max(0.0001, this.musicBusGain.gain.value), now);
      this.musicBusGain.gain.linearRampToValueAtTime(target, now + 1.0);
    }

    const scheduleAhead = () => {
      if (!this.themeRunning || !this.ctx || !this.musicEnabled) return;
      const lookAheadSec = 0.28;
      // Avoid catching up huge bursts if tab throttled
      if (this.themeNextStepTime < this.ctx.currentTime - 0.5) {
        this.themeNextStepTime = this.ctx.currentTime + 0.05;
      }
      while (this.themeNextStepTime < this.ctx.currentTime + lookAheadSec) {
        this.scheduleThemeStep(this.ctx, this.themeStep, this.themeNextStepTime);
        this.themeStep = (this.themeStep + 1) % THEME_TOTAL_STEPS;
        this.themeNextStepTime += THEME_STEP_SEC;
      }
    };

    scheduleAhead();
    this.themeSchedulerId = window.setInterval(scheduleAhead, 110);
  }

  private scheduleThemeStep(ctx: AudioContext, step: number, time: number): void {
    const bus = this.ensureMusicBus(ctx);
    const barIdx = Math.floor(step / 8);
    const stepInBar = step % 8;
    const chord = THEME_CHORDS[barIdx];

    // 1. Warm Rhodes / Electric-Piano Ambient Pad (on beat 1 of each bar)
    if (stepInBar === 0) {
      const padDur = THEME_STEP_SEC * 7.8;
      chord.pad.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, time);
        // Subtle warm chorus detune for dreamy chill ambience
        osc.detune.setValueAtTime((idx - 1.5) * 3.5, time);

        const peak = idx === 0 ? 0.1 : 0.072;
        gain.gain.setValueAtTime(0.0001, time);
        gain.gain.linearRampToValueAtTime(peak, time + 0.14);
        gain.gain.exponentialRampToValueAtTime(peak * 0.48, time + padDur * 0.65);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + padDur);

        osc.connect(gain);
        gain.connect(bus);
        osc.start(time);
        osc.stop(time + padDur + 0.04);
      });

      // Gentle morning sun glockenspiel sparkle on phrase starts (bar 0 and bar 4)
      if (chord.sparkle) {
        chord.sparkle.forEach((sf, sIdx) => {
          const t0 = time + sIdx * 0.16;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(sf, t0);
          gain.gain.setValueAtTime(0.0001, t0);
          gain.gain.linearRampToValueAtTime(0.045, t0 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.95);
          osc.connect(gain);
          gain.connect(bus);
          osc.start(t0);
          osc.stop(t0 + 1.0);
        });
      }
    }

    // 2. Cozy Plucky Acoustic Bass (chill happy bounce on steps 0, 5, and soft 6)
    if (stepInBar === 0 || stepInBar === 5) {
      const freq = stepInBar === 0 ? chord.bassRoot : chord.bassFifth;
      const dur = stepInBar === 0 ? THEME_STEP_SEC * 2.6 : THEME_STEP_SEC * 1.8;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);

      const peak = stepInBar === 0 ? 0.22 : 0.15;
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(peak, time + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);

      osc.connect(gain);
      gain.connect(bus);
      osc.start(time);
      osc.stop(time + dur + 0.03);
    }

    // 3. Cheerful Soft Kalimba / Toy Marimba Melody
    const mel = THEME_MELODY[step];
    if (mel) {
      const vel = mel.vel ?? 0.85;
      // Warm fundamental body
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(mel.freq, time);
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(0.18 * vel, time + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + mel.dur);
      osc.connect(gain);
      gain.connect(bus);
      osc.start(time);
      osc.stop(time + mel.dur + 0.03);

      // Soft woody marimba overtone transient (short 40ms plink)
      const overtone = ctx.createOscillator();
      const ovGain = ctx.createGain();
      overtone.type = 'sine';
      overtone.frequency.setValueAtTime(mel.freq * 2, time);
      ovGain.gain.setValueAtTime(0.0001, time);
      ovGain.gain.linearRampToValueAtTime(0.055 * vel, time + 0.008);
      ovGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.08);
      overtone.connect(ovGain);
      ovGain.connect(bus);
      overtone.start(time);
      overtone.stop(time + 0.1);
    }

    // 4. Ultra-Soft Brushed Shaker on off-beats for sunny chill groove
    if (stepInBar % 2 === 1 && this.shakerBuffer) {
      const src = ctx.createBufferSource();
      src.buffer = this.shakerBuffer;
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 1800;
      const gain = ctx.createGain();
      gain.gain.value = stepInBar === 3 || stepInBar === 7 ? 0.022 : 0.013;
      src.connect(hp);
      hp.connect(gain);
      gain.connect(bus);
      src.start(time);
    }
  }

  private getCachedClientWav(key: string): ArrayBuffer | null {
    const hit = this.wavCache.get(key);
    if (!hit) return null;
    this.wavCache.delete(key);
    this.wavCache.set(key, hit);
    return hit;
  }

  private setCachedClientWav(key: string, data: ArrayBuffer): void {
    if (this.wavCache.has(key)) {
      this.wavCache.delete(key);
    }
    this.wavCache.set(key, data);
    while (this.wavCache.size > MAX_CLIENT_WAV_CACHE) {
      const oldest = this.wavCache.keys().next().value;
      if (oldest === undefined) break;
      this.wavCache.delete(oldest);
    }
  }

  private cleanupActiveAudioNodes(): void {
    if (this.activeVoiceSource) {
      try {
        this.activeVoiceSource.onended = null;
        this.activeVoiceSource.stop();
        this.activeVoiceSource.disconnect();
      } catch {
        // Ignore already stopped source
      }
      this.activeVoiceSource = null;
    }
    if (this.activeVoiceHtmlAudio) {
      try {
        this.activeVoiceHtmlAudio.onended = null;
        this.activeVoiceHtmlAudio.onerror = null;
        this.activeVoiceHtmlAudio.pause();
        this.activeVoiceHtmlAudio.src = '';
      } catch {
        // Ignore media pause error
      }
      this.activeVoiceHtmlAudio = null;
    }
    if (this.activeVoiceBlobUrl) {
      URL.revokeObjectURL(this.activeVoiceBlobUrl);
      this.activeVoiceBlobUrl = null;
    }
  }

  public stopSpeech(): void {
    this.speechSeq += 1;
    if (this.ttsAbort) {
      this.ttsAbort.abort();
      this.ttsAbort = null;
    }
    if (this.speechTimer !== null) {
      window.clearTimeout(this.speechTimer);
      this.speechTimer = null;
    }
    this.cleanupActiveAudioNodes();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore speech cancellation errors on restricted browsers
      }
    }
    this.setSpeechDucking(false);
    this.setSpeakingState(false);
  }

  /** Quietly pre-warm a frequent line in the WAV cache so playback is instant */
  public prefetchSpeech(idText: string, enText?: string, explicitMood?: NarrationMood): void {
    if (typeof window === 'undefined' || !this.sfxEnabled) return;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return;

    const lang: 'id' | 'en' = this.languageMode === 'en' ? 'en' : 'id';
    const baseText = (lang === 'en' ? enText || idText : idText).trim();
    if (!baseText) return;
    const mood = explicitMood ?? inferNarrationMood(baseText);
    const spokenText = enrichTextForChildren(baseText, lang, mood);
    const cacheKey = `${lang}|${mood}|${spokenText}`;
    if (this.wavCache.has(cacheKey)) return;

    void fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: spokenText, language: lang, mood }),
    })
      .then((res) => (res.ok ? res.arrayBuffer() : null))
      .then((buf) => {
        if (buf && buf.byteLength > 44) {
          this.setCachedClientWav(cacheKey, buf);
        }
      })
      .catch(() => {
        // Ignore background prefetch errors
      });
  }

  private async playWavArrayBuffer(wavBytes: ArrayBuffer, seq: number): Promise<boolean> {
    if (seq !== this.speechSeq || !this.sfxEnabled) return false;

    const finish = () => {
      if (seq !== this.speechSeq) return;
      this.cleanupActiveAudioNodes();
      this.setSpeechDucking(false);
      this.setSpeakingState(false);
    };

    // Prefer unlocked Web AudioContext (immune to iOS Safari async-fetch autoplay blocks)
    const ctx = this.ensureContext();
    if (ctx) {
      try {
        const decoded = await ctx.decodeAudioData(wavBytes.slice(0));
        if (seq !== this.speechSeq || !this.sfxEnabled) return false;
        if (ctx.state === 'suspended') {
          await ctx.resume().catch(() => {});
        }
        const source = ctx.createBufferSource();
        const gain = ctx.createGain();
        source.buffer = decoded;
        // Subtle 12ms fade-in prevents click pops
        const now = ctx.currentTime;
        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(1.0, now + 0.012);
        source.connect(gain);
        gain.connect(ctx.destination);
        source.onended = finish;
        this.activeVoiceSource = source;
        source.start(0);
        return true;
      } catch {
        // Fall through to HTMLAudioElement if decodeAudioData fails
      }
    }

    // Fallback to HTMLAudioElement for WAV playback
    try {
      const blob = new Blob([wavBytes], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.volume = 1.0;
      this.activeVoiceBlobUrl = url;
      this.activeVoiceHtmlAudio = audio;
      audio.onended = finish;
      audio.onerror = finish;
      await audio.play();
      return true;
    } catch {
      this.cleanupActiveAudioNodes();
      return false;
    }
  }

  /** Expressive multi-clause browser Web Speech fallback with dynamic mood & punctuation pitch contour */
  private speakWithProsodicBrowserVoice(
    text: string,
    lang: 'id' | 'en',
    mood: NarrationMood,
    seq: number,
  ): void {
    if (
      seq !== this.speechSeq ||
      !this.sfxEnabled ||
      typeof window === 'undefined' ||
      !('speechSynthesis' in window)
    ) {
      if (seq === this.speechSeq) {
        this.setSpeechDucking(false);
        this.setSpeakingState(false);
      }
      return;
    }

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

    // Split text on natural punctuation boundaries to create musical rising & falling intonation
    const clauses = text
      .split(/(?<=[!?.,])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (clauses.length === 0) {
      this.setSpeechDucking(false);
      this.setSpeakingState(false);
      return;
    }

    const moodProfile: Record<NarrationMood, { pitch: number; rate: number }> = {
      welcome: { pitch: 1.24, rate: 0.96 },
      explain: { pitch: 1.18, rate: 0.95 },
      action: { pitch: 1.26, rate: 1.03 },
      encourage: { pitch: 1.12, rate: 0.91 },
      celebrate: { pitch: 1.34, rate: 1.01 },
    };
    const base = moodProfile[mood];

    const speakClause = (index: number) => {
      if (seq !== this.speechSeq || !this.sfxEnabled) return;
      if (index >= clauses.length) {
        this.setSpeechDucking(false);
        this.setSpeakingState(false);
        return;
      }

      const clause = clauses[index];
      const endsExclaim = clause.endsWith('!');
      const endsQuestion = clause.endsWith('?');
      const endsComma = clause.endsWith(',');
      const pitchShift = endsExclaim ? 0.08 : endsQuestion ? 0.1 : endsComma ? 0.04 : -0.02;
      const rateShift = endsExclaim ? 0.03 : endsQuestion ? -0.03 : 0;

      try {
        const u = new SpeechSynthesisUtterance(clause);
        u.lang = lang === 'en' ? 'en-US' : 'id-ID';
        const voice = lang === 'en' ? this.enVoice : this.idVoice;
        if (voice) u.voice = voice;
        u.pitch = Math.min(1.55, Math.max(0.9, base.pitch + pitchShift));
        u.rate = Math.min(1.18, Math.max(0.84, base.rate + rateShift));
        u.volume = 1.0;

        const nextStep = () => {
          if (seq !== this.speechSeq) return;
          if (index + 1 >= clauses.length) {
            this.setSpeechDucking(false);
            this.setSpeakingState(false);
            return;
          }
          const pauseMs = endsExclaim || endsQuestion ? 120 : 85;
          this.speechTimer = window.setTimeout(() => speakClause(index + 1), pauseMs);
        };

        u.onend = nextStep;
        u.onerror = nextStep;
        window.speechSynthesis.speak(u);
      } catch {
        this.setSpeechDucking(false);
        this.setSpeakingState(false);
      }
    };

    speakClause(0);
  }

  public speakBilingual(idText: string, enText?: string, explicitMood?: NarrationMood): void {
    if (!this.sfxEnabled || typeof window === 'undefined') {
      return;
    }

    this.stopSpeech();
    const seq = this.speechSeq;

    const lang: 'id' | 'en' = this.languageMode === 'en' ? 'en' : 'id';
    const rawText = (lang === 'en' ? enText || idText : idText).trim();
    if (!rawText) return;

    const mood = explicitMood ?? inferNarrationMood(rawText);
    const spokenText = enrichTextForChildren(rawText, lang, mood);
    const cacheKey = `${lang}|${mood}|${spokenText}`;

    // Gently duck background theme song while narrating
    this.setSpeakingState(true);
    this.setSpeechDucking(true);
    this.duckReleaseTimer = window.setTimeout(() => {
      if (seq === this.speechSeq) {
        this.setSpeechDucking(false);
        this.setSpeakingState(false);
      }
    }, 11000);

    // 1. Instant hit from browser WAV cache
    const cachedWav = this.getCachedClientWav(cacheKey);
    if (cachedWav) {
      void this.playWavArrayBuffer(cachedWav, seq).then((played) => {
        if (!played && seq === this.speechSeq) {
          this.speakWithProsodicBrowserVoice(spokenText, lang, mood, seq);
        }
      });
      return;
    }

    // 2. Offline check -> go directly to prosodic browser voice
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      this.speakWithProsodicBrowserVoice(spokenText, lang, mood, seq);
      return;
    }

    // 3. Request expressive Gemini TTS (Kore) WAV from Express /api/tts with timeout & fallback
    const controller = new AbortController();
    this.ttsAbort = controller;
    const timeoutId = window.setTimeout(() => controller.abort(), TTS_FETCH_TIMEOUT_MS);

    void fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: spokenText, language: lang, mood }),
      signal: controller.signal,
    })
      .then(async (res) => {
        window.clearTimeout(timeoutId);
        if (!res.ok) throw new Error(`TTS HTTP ${res.status}`);
        const wavBytes = await res.arrayBuffer();
        if (wavBytes.byteLength <= 44) throw new Error('Invalid WAV audio');
        this.setCachedClientWav(cacheKey, wavBytes);
        if (seq !== this.speechSeq) return;
        const played = await this.playWavArrayBuffer(wavBytes, seq);
        if (!played && seq === this.speechSeq) {
          this.speakWithProsodicBrowserVoice(spokenText, lang, mood, seq);
        }
      })
      .catch(() => {
        window.clearTimeout(timeoutId);
        if (seq !== this.speechSeq) return;
        this.speakWithProsodicBrowserVoice(spokenText, lang, mood, seq);
      });
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    gainPeak = 0.14,
    startOffset = 0,
    endFreq?: number,
  ): void {
    if (!this.sfxEnabled) return;
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
      case 'ekskavator':
        // Sturdy cheerful construction double-toot
        this.playTone(185, 0.16, 'sawtooth', 0.08, 0, 210);
        this.playTone(246.94, 0.16, 'triangle', 0.11, 0);
        this.playTone(185, 0.22, 'sawtooth', 0.08, 0.2, 220);
        this.playTone(246.94, 0.22, 'triangle', 0.11, 0.2);
        break;
      case 'bus':
        // Classic friendly two-tone school bus horn
        this.playTone(440, 0.15, 'triangle', 0.14, 0);
        this.playTone(554.37, 0.15, 'triangle', 0.11, 0);
        this.playTone(349.23, 0.24, 'triangle', 0.14, 0.18);
        this.playTone(440, 0.24, 'triangle', 0.11, 0.18);
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
    if (!this.sfxEnabled) return;
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

  public playDigScoop(): void {
    if (!this.sfxEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    // Hydraulic dip + earthy scoop crunch
    this.playTone(170, 0.18, 'triangle', 0.12, 0, 260);
    this.playTone(320, 0.14, 'sine', 0.11, 0.14, 520);
    const bufferSize = Math.floor(ctx.sampleRate * 0.16);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 1.5);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 520;
    const gain = ctx.createGain();
    gain.gain.value = 0.11;
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
  }

  public playTrafficDing(): void {
    this.playTone(880, 0.12, 'sine', 0.12, 0);
    this.playTone(1174.66, 0.18, 'sine', 0.1, 0.07);
  }

  public playPipeClick(): void {
    this.playTone(340, 0.07, 'triangle', 0.15, 0, 440);
  }

  public playCraneMove(): void {
    this.playTone(280, 0.1, 'sine', 0.1, 0, 310);
  }
}

export const soundEngine = new SoundEngine();
