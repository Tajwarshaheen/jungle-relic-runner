/**
 * Procedural Web Audio API Sound Synthesizer for Jungle Relic Runner
 * 100% self-contained, zero external file dependencies or 404s.
 * Features an ominous, spooky ("daravna") ancient temple horror soundscape,
 * dark tribal ritual drums, dissonant horror drones, and panic heartbeat pursuit.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private ambientGain: GainNode | null = null;
  private isAmbientPlaying: boolean = false;
  private footstepTimer: number = 0;

  // Horror background sound nodes
  private droneOsc1: OscillatorNode | null = null;
  private droneOsc2: OscillatorNode | null = null;
  private droneOsc3: OscillatorNode | null = null;
  private horrorChordOscs: OscillatorNode[] = [];
  private horrorChordGain: GainNode | null = null;
  private drumTimerId: number | null = null;
  private ghostWhisperTimerId: number | null = null;

  // Beast Pursuit Panic Mode Nodes
  private isPursuitActive: boolean = false;
  private pursuitGain: GainNode | null = null;
  private pursuitHeartTimerId: number | null = null;

  constructor() {
    // AudioContext is initialized on first user interaction
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
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.setValueAtTime(muted ? 0 : 0.12, this.ctx.currentTime);
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  // --- Sound Effects ---

  public playCoin() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(987.77, t); // B5
    osc.frequency.exponentialRampToValueAtTime(1318.51, t + 0.08); // E6

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.25);
  }

  public playJump() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(580, t + 0.18);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.24);
  }

  public playSlide() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

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
    gain.connect(this.ctx.destination);

    noise.start(t);
    noise.stop(t + 0.26);
  }

  public playTurn() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.18);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.22);
  }

  public playFootstep(surface: 'stone' | 'wood' = 'stone') {
    if (this.isMuted) return;
    const now = performance.now();
    if (now - this.footstepTimer < 160) return;
    this.footstepTimer = now;

    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = surface === 'wood' ? 'triangle' : 'sine';
    const baseFreq = surface === 'wood' ? 140 : 180;
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.05);

    gain.gain.setValueAtTime(0.09, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.07);
  }

  public playHit() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.35);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.45);
  }

  /**
   * Terrifying, deep monster roar with guttural low frequencies and snarling plunge
   */
  public playMonsterRoar() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // 1. Deep guttural sub-growl
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
    growlGain.connect(this.ctx.destination);

    growlOsc.start(t);
    growlOsc.stop(t + 0.8);

    // 2. Screeching snarling overtone
    const snarlOsc = this.ctx.createOscillator();
    const snarlGain = this.ctx.createGain();
    snarlOsc.type = 'triangle';
    snarlOsc.frequency.setValueAtTime(260, t + 0.05);
    snarlOsc.frequency.exponentialRampToValueAtTime(95, t + 0.6);

    snarlGain.gain.setValueAtTime(0.2, t + 0.05);
    snarlGain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

    snarlOsc.connect(snarlGain);
    snarlGain.connect(this.ctx.destination);

    snarlOsc.start(t + 0.05);
    snarlOsc.stop(t + 0.65);
  }

  /**
   * Terrifying death capture sound when the beast catches the player
   */
  public playBeastPounce() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // Slam impact
    const slamOsc = this.ctx.createOscillator();
    const slamGain = this.ctx.createGain();
    slamOsc.type = 'sawtooth';
    slamOsc.frequency.setValueAtTime(180, t);
    slamOsc.frequency.exponentialRampToValueAtTime(28, t + 0.8);
    slamGain.gain.setValueAtTime(0.55, t);
    slamGain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);

    slamOsc.connect(slamGain);
    slamGain.connect(this.ctx.destination);
    slamOsc.start(t);
    slamOsc.stop(t + 0.85);

    // Shriek
    const shriekOsc = this.ctx.createOscillator();
    const shriekGain = this.ctx.createGain();
    shriekOsc.type = 'sawtooth';
    shriekOsc.frequency.setValueAtTime(320, t + 0.1);
    shriekOsc.frequency.exponentialRampToValueAtTime(60, t + 0.9);
    shriekGain.gain.setValueAtTime(0.35, t + 0.1);
    shriekGain.gain.exponentialRampToValueAtTime(0.001, t + 0.9);

    shriekOsc.connect(shriekGain);
    shriekGain.connect(this.ctx.destination);
    shriekOsc.start(t + 0.1);
    shriekOsc.stop(t + 0.95);
  }

  public playStumble() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(240, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.32);

    gain.gain.setValueAtTime(0.42, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.36);
  }

  public playPowerup() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

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
      gain.connect(this.ctx!.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.18);
    });
  }

  // --- Daravna (Spooky Horror) Jungle & Ancient Temple Ambient Soundtrack ---

  public startJungleAtmosphere() {
    if (this.isAmbientPlaying) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      this.isAmbientPlaying = true;
      const ambientGain = this.ctx.createGain();
      ambientGain.gain.setValueAtTime(this.isMuted ? 0 : 0.12, this.ctx.currentTime);
      ambientGain.connect(this.ctx.destination);
      this.ambientGain = ambientGain;

      // 1. Spooky Cursed Temple Drone (Subterranean multi-frequency beating)
      // A0 (27.5 Hz) + D#1 (38.89 Hz - Tritone Devil's Interval) + A1 (55 Hz)
      this.droneOsc1 = this.ctx.createOscillator();
      this.droneOsc2 = this.ctx.createOscillator();
      this.droneOsc3 = this.ctx.createOscillator();

      const droneGain = this.ctx.createGain();
      const droneFilter = this.ctx.createBiquadFilter();

      this.droneOsc1.type = 'sawtooth';
      this.droneOsc1.frequency.setValueAtTime(55, this.ctx.currentTime); // A1

      this.droneOsc2.type = 'triangle';
      this.droneOsc2.frequency.setValueAtTime(38.89, this.ctx.currentTime); // D#1 (Tritone dark horror tension)

      this.droneOsc3.type = 'sine';
      this.droneOsc3.frequency.setValueAtTime(57.4, this.ctx.currentTime); // Beating dissonance with 55Hz

      droneFilter.type = 'lowpass';
      droneFilter.frequency.setValueAtTime(160, this.ctx.currentTime);

      droneGain.gain.setValueAtTime(0.2, this.ctx.currentTime);

      this.droneOsc1.connect(droneFilter);
      this.droneOsc2.connect(droneFilter);
      this.droneOsc3.connect(droneFilter);
      droneFilter.connect(droneGain);
      droneGain.connect(ambientGain);

      this.droneOsc1.start();
      this.droneOsc2.start();
      this.droneOsc3.start();

      // 2. Chilling Ghostly Wind Ambience (Echoing through ancient tombs)
      const bufferSize = this.ctx.sampleRate * 4;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const windNoise = this.ctx.createBufferSource();
      windNoise.buffer = buffer;
      windNoise.loop = true;

      const windFilter = this.ctx.createBiquadFilter();
      windFilter.type = 'bandpass';
      windFilter.frequency.setValueAtTime(220, this.ctx.currentTime);
      windFilter.Q.value = 3.5;

      const windGain = this.ctx.createGain();
      windGain.gain.setValueAtTime(0.1, this.ctx.currentTime);

      windNoise.connect(windFilter);
      windFilter.connect(windGain);
      windGain.connect(ambientGain);
      windNoise.start();

      // 3. Eerie Dissonant Minor Chord Swells (Horror Movie Strings Pad)
      this.horrorChordGain = this.ctx.createGain();
      this.horrorChordGain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      this.horrorChordGain.connect(ambientGain);

      const horrorNotes = [110, 130.81, 155.56]; // A2, C3, D#3 (Diminished dark horror triad)
      horrorNotes.forEach((freq) => {
        const osc = this.ctx!.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx!.currentTime);
        osc.connect(this.horrorChordGain!);
        osc.start();
        this.horrorChordOscs.push(osc);
      });

      // 4. Dark Ritual Taiko/Tom Drums (Boom ... boom-boom ... Boom)
      this.startDarkRitualDrums(ambientGain);

      // 5. Periodic Creepy Whispers / Demon Growls in the Distance
      this.startSpookyWhispers(ambientGain);

      // 6. Setup Beast Pursuit Node (for panic adrenaline pulse)
      this.pursuitGain = this.ctx.createGain();
      this.pursuitGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.pursuitGain.connect(this.ctx.destination);
    } catch {
      // Audio autoplay policy catch
    }
  }

  /**
   * Procedural Dark Tribal Drums that loop in the background
   */
  private startDarkRitualDrums(destGain: GainNode) {
    if (!this.ctx) return;

    let drumStep = 0;
    const playDrumHit = () => {
      if (!this.ctx || this.isMuted) {
        this.drumTimerId = window.setTimeout(playDrumHit, 800);
        return;
      }

      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Heavy resonant jungle tom
      const isDownbeat = drumStep % 4 === 0;
      const baseFreq = isDownbeat ? 120 : 95;
      const volume = isDownbeat ? 0.22 : 0.14;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, t);
      osc.frequency.exponentialRampToValueAtTime(32, t + 0.35);

      gain.gain.setValueAtTime(volume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);

      osc.connect(gain);
      gain.connect(destGain);

      osc.start(t);
      osc.stop(t + 0.4);

      drumStep++;
      // Syncopated tribal rhythm: beats spaced at 400ms, 400ms, 800ms
      const nextDelay = drumStep % 4 === 2 ? 400 : (drumStep % 4 === 3 ? 350 : 750);
      this.drumTimerId = window.setTimeout(playDrumHit, nextDelay);
    };

    playDrumHit();
  }

  /**
   * Spooky ambient whispers and distant demon shrieks echoing randomly
   */
  private startSpookyWhispers(destGain: GainNode) {
    if (!this.ctx) return;

    const playRandomEerieEvent = () => {
      if (this.ctx && !this.isMuted) {
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        // Ghostly wail / howling wind screech
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(450 + Math.random() * 200, t);
        osc.frequency.exponentialRampToValueAtTime(220, t + 1.2);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(600, t);
        filter.Q.value = 5.0;

        gain.gain.setValueAtTime(0.04, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(destGain);

        osc.start(t);
        osc.stop(t + 1.25);
      }

      const nextDelay = 5000 + Math.random() * 7000;
      this.ghostWhisperTimerId = window.setTimeout(playRandomEerieEvent, nextDelay);
    };

    this.ghostWhisperTimerId = window.setTimeout(playRandomEerieEvent, 3000);
  }

  /**
   * Dynamic Panic Mode: Triggered when the Beast is actively chasing right behind!
   * Heightens the horror with a rapid double-beat adrenaline heartbeat & demonic snarling!
   */
  public setBeastPursuit(active: boolean) {
    this.isPursuitActive = active;
    if (!this.ctx || !this.pursuitGain) return;

    if (active) {
      this.pursuitGain.gain.setValueAtTime(this.isMuted ? 0 : 0.28, this.ctx.currentTime);
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
      // First thump (LUB)
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(90, t);
      osc1.frequency.exponentialRampToValueAtTime(35, t + 0.12);
      gain1.gain.setValueAtTime(0.3, t);
      gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
      osc1.connect(gain1);
      gain1.connect(this.pursuitGain);
      osc1.start(t);
      osc1.stop(t + 0.15);

      // Second thump (DUB)
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(80, t + 0.14);
      osc2.frequency.exponentialRampToValueAtTime(32, t + 0.26);
      gain2.gain.setValueAtTime(0.24, t + 0.14);
      gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
      osc2.connect(gain2);
      gain2.connect(this.pursuitGain);
      osc2.start(t + 0.14);
      osc2.stop(t + 0.3);
    }

    // Fast panic tempo (~120 bpm, interval 500ms)
    this.pursuitHeartTimerId = window.setTimeout(this.runPursuitHeartbeatLoop, 480);
  };

  public stopAll() {
    if (this.drumTimerId) {
      window.clearTimeout(this.drumTimerId);
      this.drumTimerId = null;
    }
    if (this.ghostWhisperTimerId) {
      window.clearTimeout(this.ghostWhisperTimerId);
      this.ghostWhisperTimerId = null;
    }
    if (this.pursuitHeartTimerId) {
      window.clearTimeout(this.pursuitHeartTimerId);
      this.pursuitHeartTimerId = null;
    }
  }
}

export const soundEngine = new SoundEngine();
