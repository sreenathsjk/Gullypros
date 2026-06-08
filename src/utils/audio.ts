/**
 * Custom Web Audio API ambient soundscape designer for CricketVerse.
 * Generates custom simulated sports stadium background music, crickets chirping,
 * crowd mumurs, and interactive cheers entirely client-side without relying on external assets.
 */

class CricketAudioEngine {
  private audioCtx: AudioContext | null = null;
  private primaryGain: GainNode | null = null;
  private crowdGain: GainNode | null = null;
  private cricketTimer: any = null;
  private chordTimer: any = null;
  private bgmPlaying = false;
  private volumeLevel = 0.15; // 15% volume default is pleasant

  constructor() {
    // Lazy instance
  }

  private initCtx() {
    if (this.audioCtx) return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    this.audioCtx = new AudioContextClass();
    this.primaryGain = this.audioCtx.createGain();
    this.primaryGain.gain.setValueAtTime(this.volumeLevel, this.audioCtx.currentTime);
    this.primaryGain.connect(this.audioCtx.destination);

    // Submix for crowd
    this.crowdGain = this.audioCtx.createGain();
    this.crowdGain.gain.setValueAtTime(0.4, this.audioCtx.currentTime);
    this.crowdGain.connect(this.primaryGain);
  }

  /**
   * Generates low-frequency brownian/white noise representing a live stadium crowd murmur.
   */
  private startCrowdMurmur() {
    if (!this.audioCtx || !this.crowdGain) return;

    const bufferSize = 2 * this.audioCtx.sampleRate;
    const noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    // Generate white noise approximation
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.audioCtx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Filter to make it a low, soothing background crowd hum/rumble (Lowpass)
    const filter = this.audioCtx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(320, this.audioCtx.currentTime); // low hum cut
    filter.Q.setValueAtTime(1.5, this.audioCtx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(this.crowdGain);
    whiteNoise.start(0);
  }

  /**
   * Synthesizes summer crickets chirping - highly fitting for a turf field!
   */
  private scheduleCricketChirp() {
    if (!this.bgmPlaying || !this.audioCtx || !this.primaryGain) return;

    const fireNext = () => {
      if (!this.bgmPlaying || !this.audioCtx || !this.primaryGain) return;

      const actTime = this.audioCtx.currentTime;
      // High pitch sine oscillator
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(3600, actTime); // high chirp pitch
      
      // Chirping pulse sequence envelope
      gain.gain.setValueAtTime(0, actTime);
      for (let burst = 0; burst < 3; burst++) {
        const start = actTime + burst * 0.08;
        gain.gain.linearRampToValueAtTime(0.04, start + 0.02);
        gain.gain.linearRampToValueAtTime(0, start + 0.06);
      }

      osc.connect(gain);
      gain.connect(this.primaryGain);
      osc.start(actTime);
      osc.stop(actTime + 0.4);

      // Schedule next chirp randomly around 2 to 4 seconds
      const nextDelay = 2000 + Math.random() * 2500;
      this.cricketTimer = setTimeout(fireNext, nextDelay);
    };

    fireNext();
  }

  /**
   * Plays soft background stadium-spirit ambient melody block (sports organ style chord loop)
   */
  private startChordMelody() {
    if (!this.audioCtx || !this.primaryGain) return;

    // Classic sports/cricket stadium hook soft chime loop
    const chords = [
      [261.63, 329.63, 392.00], // C major
      [293.66, 349.23, 440.00], // D minor
      [349.23, 440.00, 523.25], // F major
      [392.00, 493.88, 587.33]  // G major
    ];

    let currentChordIdx = 0;

    const playLoop = () => {
      if (!this.bgmPlaying || !this.audioCtx || !this.primaryGain) return;

      const actTime = this.audioCtx.currentTime;
      const notes = chords[currentChordIdx];

      notes.forEach((freq) => {
        if (!this.audioCtx || !this.primaryGain) return;
        const osc = this.audioCtx.createOscillator();
        const oscGain = this.audioCtx.createGain();

        // soft triangle wave for a retro electric organ/chime vibe
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, actTime);

        // Slow warm sweep envelope
        oscGain.gain.setValueAtTime(0, actTime);
        oscGain.gain.linearRampToValueAtTime(0.015, actTime + 0.6); // soft
        oscGain.gain.exponentialRampToValueAtTime(0.0001, actTime + 3.8);

        osc.connect(oscGain);
        oscGain.connect(this.primaryGain);
        osc.start(actTime);
        osc.stop(actTime + 4.0);
      });

      currentChordIdx = (currentChordIdx + 1) % chords.length;
      this.chordTimer = setTimeout(playLoop, 4500);
    };

    playLoop();
  }

  /**
   * Starts BGM atmosphere sounds.
   */
  public start() {
    if (this.bgmPlaying) return;
    try {
      this.initCtx();
      if (!this.audioCtx) return;

      if (this.audioCtx.state === "suspended") {
        this.audioCtx.resume();
      }

      this.bgmPlaying = true;
      this.startCrowdMurmur();
      this.scheduleCricketChirp();
      this.startChordMelody();
    } catch (e) {
      console.warn("Could not start Web Audio BGM:", e);
    }
  }

  /**
   * Stops BGM sound loops.
   */
  public stop() {
    this.bgmPlaying = false;
    if (this.cricketTimer) clearTimeout(this.cricketTimer);
    if (this.chordTimer) clearTimeout(this.chordTimer);
    
    if (this.audioCtx && this.audioCtx.state === "running") {
      this.audioCtx.suspend();
    }
  }

  /**
   * Changes BGM volume
   */
  public setVolume(volume: number) {
    this.volumeLevel = volume;
    if (this.primaryGain && this.audioCtx) {
      this.primaryGain.gain.setValueAtTime(volume, this.audioCtx.currentTime);
    }
  }

  /**
   * Dynamic crowd cheer effect triggered on events (four, six, wickets)
   */
  public playDynamicCheer(type: "four" | "six" | "wicket") {
    try {
      this.initCtx();
      if (!this.audioCtx || !this.primaryGain) return;

      if (this.audioCtx.state === "suspended") {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;
      
      // High-pass filter noise for crowd roar
      const bufferSize = 1.5 * this.audioCtx.sampleRate;
      const noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const noiseSource = this.audioCtx.createBufferSource();
      noiseSource.buffer = noiseBuffer;

      const bandpass = this.audioCtx.createBiquadFilter();
      bandpass.type = "bandpass";
      bandpass.frequency.setValueAtTime(type === "wicket" ? 400 : 650, now);
      bandpass.Q.setValueAtTime(1.0, now);

      const cheeringGain = this.audioCtx.createGain();
      cheeringGain.gain.setValueAtTime(0, now);
      
      // Roaring amplitude envelope
      if (type === "six") {
        cheeringGain.gain.linearRampToValueAtTime(0.18, now + 0.15); // sharp explosion
        cheeringGain.gain.exponentialRampToValueAtTime(0.005, now + 1.4);
      } else if (type === "four") {
        cheeringGain.gain.linearRampToValueAtTime(0.11, now + 0.25);
        cheeringGain.gain.exponentialRampToValueAtTime(0.005, now + 1.1);
      } else { // wicket
        cheeringGain.gain.linearRampToValueAtTime(0.15, now + 0.1); 
        cheeringGain.gain.exponentialRampToValueAtTime(0.005, now + 1.3);
      }

      noiseSource.connect(bandpass);
      bandpass.connect(cheeringGain);
      cheeringGain.connect(this.primaryGain);

      noiseSource.start(now);
      noiseSource.stop(now + 1.5);
    } catch (_) {
      // safe bypass
    }
  }

  public isPlaying() {
    return this.bgmPlaying;
  }
}

export const cricketBgm = new CricketAudioEngine();
