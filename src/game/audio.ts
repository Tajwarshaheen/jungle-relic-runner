/**
 * Authentic Temple Run Procedural Web Audio API Soundtrack & SFX Engine
 * 100% self-contained, zero external file dependencies or 404s.
 * 
 * Features:
 * - High-energy 134 BPM African tribal percussion groove (djembe bass, conga slaps, shakers, woodblocks)
 * - The iconic Temple Run wooden marimba / balafon syncopated pentatonic riff
 * - Resonant bamboo pan flute melodic phrase
 * - Dynamic adrenaline pursuit war drums and double-beat heartbeat when demon beast is chasing
 */

const MARIMBA_NOTES: Record<string, number> = {
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  G4: 392.00,
  A4: 440.00,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  F5: 698.46,
  G5: 783.99,
  A5: 880.00,
};

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterMusicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private pursuitGain: GainNode | null = null;
  private isMusicPlaying: boolean = false;
  private isPursuitActive: boolean = false;

  // Music sequencer timing
  private schedulerTimerId: number | null = null;
  private nextStepTime: number = 0;
  private current16thStep: number = 0;
  private pursuitHeartTimerId: number | null = null;
  private footstepTimer: number = 0;

  // Cached noise buffer for crisp shakers
  private shakerBuffer: AudioBuffer | null = null;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    if (this.ctx && !this.shakerBuffer) {
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.05);
      this.shakerBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = this.shakerBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.28));
      }
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.ctx) {
      if (this.masterMusicGain) {
        this.masterMusicGain.gain.setValueAtTime(muted ? 0 : 0.26, this.ctx.currentTime);
      }
      if (this.sfxGain) {
        this.sfxGain.gain.setValueAtTime(muted ? 0 : 0.85, this.ctx.currentTime);
      }
      if (this.pursuitGain) {
        this.pursuitGain.gain.setValueAtTime(muted ? 0 : (this.isPursuitActive ? 0.32 : 0), this.ctx.currentTime);
      }
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  // =========================================================================
  // AUTHENTIC TEMPLE RUN PROCEDURAL SOUNDTRACK (134 BPM TRIBAL MARIMBA)
  // =========================================================================

  public startJungleAtmosphere() {
    if (this.isMusicPlaying) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      this.isMusicPlaying = true;

      // Master music bus
      if (!this.masterMusicGain) {
        this.masterMusicGain = this.ctx.createGain();
        this.masterMusicGain.gain.setValueAtTime(this.isMuted ? 0 : 0.26, this.ctx.currentTime);
        this.masterMusicGain.connect(this.ctx.destination);
      }

      // SFX bus
      if (!this.sfxGain) {
        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.setValueAtTime(this.isMuted ? 0 : 0.85, this.ctx.currentTime);
        this.sfxGain.connect(this.ctx.destination);
      }

      // Beast pursuit bus
      if (!this.pursuitGain) {
        this.pursuitGain = this.ctx.createGain();
        this.pursuitGain.gain.setValueAtTime(0, this.ctx.currentTime);
        this.pursuitGain.connect(this.ctx.destination);
      }

      // Initialize sequencer
      this.current16thStep = 0;
      this.nextStepTime = this.ctx.currentTime + 0.05;

      if (this.schedulerTimerId !== null) {
        window.clearInterval(this.schedulerTimerId);
      }
      this.schedulerTimerId = window.setInterval(() => this.scheduleNextNotes(), 30);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  private scheduleNextNotes() {
    if (!this.ctx || !this.isMusicPlaying) return;

    // Lookahead: schedule 120ms ahead
    const secondsPer16thStep = 60 / 134 / 4; // 134 BPM 16th note (~0.1119s)

    while (this.nextStepTime < this.ctx.currentTime + 0.12) {
      this.playSequencedStep(this.current16thStep, this.nextStepTime);
      this.nextStepTime += secondsPer16thStep;
      this.current16thStep = (this.current16thStep + 1) % 64; // 64 16th steps = 4 bars
    }
  }

  private playSequencedStep(step: number, time: number) {
    if (!this.ctx || !this.masterMusicGain || this.isMuted) return;

    const barStep = step % 16; // Step within 16-step bar

    // 1. Continuous African Shaker / Shekere Shuffle
    const isDownbeat = barStep % 4 === 0;
    const isBackbeat = barStep % 4 === 2;
    const shakerVol = isDownbeat ? 0.065 : isBackbeat ? 0.045 : 0.026;
    this.synthesizeShaker(time, shakerVol);

    // 2. Heavy African Djembe Bass Drum (Syncopated driving pulse)
    if (barStep === 0 || barStep === 6 || barStep === 8 || barStep === 14) {
      const isAccent = barStep === 0;
      this.synthesizeDjembe(time, isAccent);
    }

    // Additional driving war-drums during beast pursuit
    if (this.isPursuitActive && (barStep === 3 || barStep === 11)) {
      this.synthesizeDjembe(time, false);
    }

    // 3. Mid/High Conga Slaps (Syncopated tribal polyrhythm)
    if (barStep === 2 || barStep === 10) {
      this.synthesizeConga(time, false); // Mid tone
    } else if (barStep === 4 || barStep === 12) {
      this.synthesizeConga(time, true); // High slap
    }

    // 4. Wooden Temple Agogo / Woodblock
    if (barStep === 4 || barStep === 11 || barStep === 14) {
      this.synthesizeWoodblock(time);
    }

    // 5. The Iconic Temple Run Wooden Marimba Pentatonic Melody
    const marimbaNote = this.getMarimbaNoteForStep(step);
    if (marimbaNote) {
      this.synthesizeMarimba(marimbaNote, time, 0.2);
    }

    // 6. Bamboo Pan Flute Call (Floats across bars 3 and 4)
    if (!this.isPursuitActive) {
      const fluteNote = this.getFluteNoteForStep(step);
      if (fluteNote) {
        this.synthesizeFlute(fluteNote.freq, time, fluteNote.duration);
      }
    }
  }

  /**
   * The signature Temple Run wooden marimba melody mapped across 4 bars (64 steps)
   */
  private getMarimbaNoteForStep(step: number): number | null {
    switch (step) {
      // Bar 1: Driving signature hook
      case 0: return MARIMBA_NOTES.D4;
      case 3: return MARIMBA_NOTES.F4;
      case 6: return MARIMBA_NOTES.G4;
      case 8: return MARIMBA_NOTES.A4;
      case 11: return MARIMBA_NOTES.F4;
      case 14: return MARIMBA_NOTES.D4;

      // Bar 2: Answering run
      case 16: return MARIMBA_NOTES.C4;
      case 19: return MARIMBA_NOTES.D4;
      case 22: return MARIMBA_NOTES.F4;
      case 24: return MARIMBA_NOTES.G4;
      case 26: return MARIMBA_NOTES.F4;
      case 28: return MARIMBA_NOTES.D4;
      case 30: return MARIMBA_NOTES.C4;

      // Bar 3: Octave leap excitement
      case 32: return MARIMBA_NOTES.D4;
      case 35: return MARIMBA_NOTES.A4;
      case 38: return MARIMBA_NOTES.C5;
      case 40: return MARIMBA_NOTES.D5;
      case 43: return MARIMBA_NOTES.C5;
      case 46: return MARIMBA_NOTES.A4;

      // Bar 4: Resolution lick into next loop
      case 48: return MARIMBA_NOTES.G4;
      case 51: return MARIMBA_NOTES.F4;
      case 54: return MARIMBA_NOTES.D4;
      case 56: return MARIMBA_NOTES.F4;
      case 59: return MARIMBA_NOTES.E4;
      case 62: return MARIMBA_NOTES.D4;

      default: return null;
    }
  }

  /**
   * Ambient jungle pan flute accents
   */
  private getFluteNoteForStep(step: number): { freq: number; duration: number } | null {
    switch (step) {
      case 32: return { freq: MARIMBA_NOTES.D5, duration: 0.38 };
      case 36: return { freq: MARIMBA_NOTES.F5, duration: 0.38 };
      case 40: return { freq: MARIMBA_NOTES.G5, duration: 0.28 };
      case 42: return { freq: MARIMBA_NOTES.A5, duration: 0.55 };
      case 48: return { freq: MARIMBA_NOTES.F5, duration: 0.32 };
      case 52: return { freq: MARIMBA_NOTES.D5, duration: 0.52 };
      case 56: return { freq: MARIMBA_NOTES.C5, duration: 0.32 };
      case 60: return { freq: MARIMBA_NOTES.D5, duration: 0.65 };
      default: return null;
    }
  }

  // --- Instrument Synthesizers ---

  /**
   * Warm wooden marimba / balafon bar with quick mallet click overtone
   */
  private synthesizeMarimba(freq: number, time: number, volume: number = 0.2) {
    if (!this.ctx || !this.masterMusicGain) return;

    // Fundamental wooden resonance
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, time);

    gain1.gain.setValueAtTime(0.001, time);
    gain1.gain.linearRampToValueAtTime(volume, time + 0.003);
    gain1.gain.exponentialRampToValueAtTime(0.001, time + 0.22);

    osc1.connect(gain1);
    gain1.connect(this.masterMusicGain);
    osc1.start(time);
    osc1.stop(time + 0.25);

    // Rosewood bar harmonic overtone (~3.92x fundamental)
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 3.92, time);

    gain2.gain.setValueAtTime(0.001, time);
    gain2.gain.linearRampToValueAtTime(volume * 0.38, time + 0.002);
    gain2.gain.exponentialRampToValueAtTime(0.001, time + 0.065);

    osc2.connect(gain2);
    gain2.connect(this.masterMusicGain);
    osc2.start(time);
    osc2.stop(time + 0.08);
  }

  /**
   * Deep African Djembe Bass Drum with pitch drop
   */
  private synthesizeDjembe(time: number, isAccent: boolean = false) {
    if (!this.ctx || !this.masterMusicGain) return;

    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    const startFreq = isAccent ? 140 : 115;
    const endFreq = isAccent ? 44 : 36;
    const vol = isAccent ? 0.35 : 0.24;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, time);
    osc.frequency.exponentialRampToValueAtTime(endFreq, time + 0.24);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(260, time);

    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterMusicGain);

    osc.start(time);
    osc.stop(time + 0.32);
  }

  /**
   * Snappy Conga slap drum
   */
  private synthesizeConga(time: number, isHigh: boolean = false) {
    if (!this.ctx || !this.masterMusicGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const startFreq = isHigh ? 330 : 240;
    const endFreq = isHigh ? 130 : 90;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(startFreq, time);
    osc.frequency.exponentialRampToValueAtTime(endFreq, time + 0.12);

    gain.gain.setValueAtTime(isHigh ? 0.18 : 0.13, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

    osc.connect(gain);
    gain.connect(this.masterMusicGain);

    osc.start(time);
    osc.stop(time + 0.16);
  }

  /**
   * High-passed shaker / cabasa noise burst
   */
  private synthesizeShaker(time: number, volume: number = 0.04) {
    if (!this.ctx || !this.masterMusicGain || !this.shakerBuffer) return;

    const noise = this.ctx.createBufferSource();
    noise.buffer = this.shakerBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(5400, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.045);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterMusicGain);

    noise.start(time);
    noise.stop(time + 0.05);
  }

  /**
   * Resonant hollow woodblock / temple bell
   */
  private synthesizeWoodblock(time: number) {
    if (!this.ctx || !this.masterMusicGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(960, time);
    osc.frequency.exponentialRampToValueAtTime(620, time + 0.045);

    gain.gain.setValueAtTime(0.12, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

    osc.connect(gain);
    gain.connect(this.masterMusicGain);

    osc.start(time);
    osc.stop(time + 0.055);
  }

  /**
   * Airy bamboo pan flute with expressive vibrato
   */
  private synthesizeFlute(freq: number, time: number, duration: number = 0.35) {
    if (!this.ctx || !this.masterMusicGain) return;

    const osc = this.ctx.createOscillator();
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);

    // Warm natural vibrato
    lfo.frequency.setValueAtTime(5.4, time);
    lfoGain.gain.setValueAtTime(4.2, time);
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(freq * 1.4, time);
    filter.Q.value = 1.6;

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(0.085, time + 0.035);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterMusicGain);

    lfo.start(time);
    lfo.stop(time + duration + 0.05);
    osc.start(time);
    osc.stop(time + duration + 0.05);
  }

  // =========================================================================
  // DYNAMIC PURSUIT PANIC HEARTBEAT
  // =========================================================================

  public setBeastPursuit(active: boolean) {
    this.isPursuitActive = active;
    if (!this.ctx || !this.pursuitGain) return;

    if (active) {
      this.pursuitGain.gain.setValueAtTime(this.isMuted ? 0 : 0.32, this.ctx.currentTime);
      if (!this.pursuitHeartTimerId) {
        this.runPursuitHeartbeatLoop();
      }
    } else {
      this.pursuitGain.gain.setValueAtTime(0, this.ctx.currentTime);
      if (this.pursuitHeartTimerId) {
        window.clearTimeout(this.pursuitHeartTimerId);
        this.pursuitHeartTimerId = null;
      }
    }
  }

  private runPursuitHeartbeatLoop = () => {
    if (!this.isPursuitActive || !this.ctx || !this.pursuitGain) {
      this.pursuitHeartTimerId = null;
      return;
    }

    if (!this.isMuted) {
      const t = this.ctx.currentTime;
      // Double thump: LUB-DUB
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(95, t);
      osc1.frequency.exponentialRampToValueAtTime(36, t + 0.12);
      gain1.gain.setValueAtTime(0.32, t);
      gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
      osc1.connect(gain1);
      gain1.connect(this.pursuitGain);
      osc1.start(t);
      osc1.stop(t + 0.15);

      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(85, t + 0.14);
      osc2.frequency.exponentialRampToValueAtTime(32, t + 0.26);
      gain2.gain.setValueAtTime(0.26, t + 0.14);
      gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
      osc2.connect(gain2);
      gain2.connect(this.pursuitGain);
      osc2.start(t + 0.14);
      osc2.stop(t + 0.3);
    }

    // Fast adrenaline tempo
    this.pursuitHeartTimerId = window.setTimeout(this.runPursuitHeartbeatLoop, 460);
  };

  // =========================================================================
  // SOUND EFFECTS
  // =========================================================================

  public playCoin() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(987.77, t); // B5
    osc.frequency.exponentialRampToValueAtTime(1318.51, t + 0.08); // E6

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.25);
  }

  public playJump() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(580, t + 0.18);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.24);
  }

  public playSlide() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.25);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, t);
    filter.frequency.exponentialRampToValueAtTime(300, t + 0.25);
    filter.Q.value = 2.0;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.22, t);
    gain.gain.linearRampToValueAtTime(0.01, t + 0.25);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(t);
    noise.stop(t + 0.26);
  }

  public playTurn() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.18);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.22);
  }

  public playFootstep(surface: 'stone' | 'wood' = 'stone') {
    if (this.isMuted) return;
    const now = performance.now();
    if (now - this.footstepTimer < 160) return;
    this.footstepTimer = now;

    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = surface === 'wood' ? 'triangle' : 'sine';
    const baseFreq = surface === 'wood' ? 140 : 180;
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.05);

    gain.gain.setValueAtTime(0.07, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.07);
  }

  public playHit() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.35);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.45);
  }

  public playMonsterRoar() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;

    const growlOsc = this.ctx.createOscillator();
    const growlFilter = this.ctx.createBiquadFilter();
    const growlGain = this.ctx.createGain();

    growlOsc.type = 'sawtooth';
    growlOsc.frequency.setValueAtTime(75, t);
    growlOsc.frequency.linearRampToValueAtTime(110, t + 0.18);
    growlOsc.frequency.exponentialRampToValueAtTime(38, t + 0.7);

    growlFilter.type = 'lowpass';
    growlFilter.frequency.setValueAtTime(420, t);
    growlFilter.frequency.exponentialRampToValueAtTime(140, t + 0.7);

    growlGain.gain.setValueAtTime(0.38, t);
    growlGain.gain.exponentialRampToValueAtTime(0.001, t + 0.75);

    growlOsc.connect(growlFilter);
    growlFilter.connect(growlGain);
    growlGain.connect(this.sfxGain);

    growlOsc.start(t);
    growlOsc.stop(t + 0.8);

    const snarlOsc = this.ctx.createOscillator();
    const snarlGain = this.ctx.createGain();
    snarlOsc.type = 'triangle';
    snarlOsc.frequency.setValueAtTime(260, t + 0.05);
    snarlOsc.frequency.exponentialRampToValueAtTime(95, t + 0.6);

    snarlGain.gain.setValueAtTime(0.2, t + 0.05);
    snarlGain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

    snarlOsc.connect(snarlGain);
    snarlGain.connect(this.sfxGain);

    snarlOsc.start(t + 0.05);
    snarlOsc.stop(t + 0.65);
  }

  public playBeastPounce() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;

    const slamOsc = this.ctx.createOscillator();
    const slamGain = this.ctx.createGain();
    slamOsc.type = 'sawtooth';
    slamOsc.frequency.setValueAtTime(180, t);
    slamOsc.frequency.exponentialRampToValueAtTime(28, t + 0.8);
    slamGain.gain.setValueAtTime(0.55, t);
    slamGain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);

    slamOsc.connect(slamGain);
    slamGain.connect(this.sfxGain);
    slamOsc.start(t);
    slamOsc.stop(t + 0.85);

    const shriekOsc = this.ctx.createOscillator();
    const shriekGain = this.ctx.createGain();
    shriekOsc.type = 'sawtooth';
    shriekOsc.frequency.setValueAtTime(320, t + 0.1);
    shriekOsc.frequency.exponentialRampToValueAtTime(60, t + 0.9);
    shriekGain.gain.setValueAtTime(0.35, t + 0.1);
    shriekGain.gain.exponentialRampToValueAtTime(0.001, t + 0.9);

    shriekOsc.connect(shriekGain);
    shriekGain.connect(this.sfxGain);
    shriekOsc.start(t + 0.1);
    shriekOsc.stop(t + 0.95);
  }

  public playStumble() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(240, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.32);

    gain.gain.setValueAtTime(0.42, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.36);
  }

  public playPowerup() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const noteTime = t + idx * 0.06;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.15, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.15);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(noteTime);
      osc.stop(noteTime + 0.18);
    });
  }

  public stopAll() {
    if (this.schedulerTimerId !== null) {
      window.clearInterval(this.schedulerTimerId);
      this.schedulerTimerId = null;
    }
    if (this.pursuitHeartTimerId !== null) {
      window.clearTimeout(this.pursuitHeartTimerId);
      this.pursuitHeartTimerId = null;
    }
    this.isMusicPlaying = false;
    this.isPursuitActive = false;
  }
}

export const soundEngine = new SoundEngine();
