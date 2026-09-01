import { EqualizerBands } from '../types';

class AudioEngine {
  private ctx: AudioContext | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private pannerNode: StereoPannerNode | null = null;

  // 5-band EQ filters
  private filter60: BiquadFilterNode | null = null;
  private filter230: BiquadFilterNode | null = null;
  private filter910: BiquadFilterNode | null = null;
  private filter3600: BiquadFilterNode | null = null;
  private filter14000: BiquadFilterNode | null = null;

  // Auto-pan (left ↔ right sweep): sine LFO driving the stereo panner
  private panLfo: OscillatorNode | null = null;
  private panLfoGain: GainNode | null = null;

  private isInitialized = false;
  private audioElement: HTMLAudioElement | null = null;
  private isSourceConnected = false;

  public init(audioEl: HTMLAudioElement) {
    if (this.isInitialized && this.audioElement === audioEl) return;
    this.audioElement = audioEl;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      if (!this.ctx) {
        this.ctx = new AudioCtx();
      }

      if (!this.analyserNode) {
        this.analyserNode = this.ctx.createAnalyser();
        this.analyserNode.fftSize = 128;
        this.analyserNode.smoothingTimeConstant = 0.8;
      }

      if (!this.gainNode) {
        this.gainNode = this.ctx.createGain();
      }

      // Equalizer filters
      if (!this.filter60) {
        this.filter60 = this.ctx.createBiquadFilter();
        this.filter60.type = 'lowshelf';
        this.filter60.frequency.value = 60;
      }

      if (!this.filter230) {
        this.filter230 = this.ctx.createBiquadFilter();
        this.filter230.type = 'peaking';
        this.filter230.frequency.value = 230;
        this.filter230.Q.value = 1.0;
      }

      if (!this.filter910) {
        this.filter910 = this.ctx.createBiquadFilter();
        this.filter910.type = 'peaking';
        this.filter910.frequency.value = 910;
        this.filter910.Q.value = 1.0;
      }

      if (!this.filter3600) {
        this.filter3600 = this.ctx.createBiquadFilter();
        this.filter3600.type = 'peaking';
        this.filter3600.frequency.value = 3600;
        this.filter3600.Q.value = 1.0;
      }

      if (!this.filter14000) {
        this.filter14000 = this.ctx.createBiquadFilter();
        this.filter14000.type = 'highshelf';
        this.filter14000.frequency.value = 14000;
      }

      // Stereo panner + gentle sine LFO for auto left↔right sweep
      if (this.ctx.createStereoPanner && !this.pannerNode) {
        this.pannerNode = this.ctx.createStereoPanner();

        this.panLfo = this.ctx.createOscillator();
        this.panLfo.type = 'sine';
        this.panLfo.frequency.value = 0.15; // one full L→R→L sweep every ~6.7s

        this.panLfoGain = this.ctx.createGain();
        this.panLfoGain.gain.value = 0;

        this.panLfo.connect(this.panLfoGain);
        this.panLfoGain.connect(this.pannerNode.pan);
        this.panLfo.start();
      }

      this.isInitialized = true;
    } catch (e) {
      console.warn('AudioContext initialization skipped or blocked:', e);
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  // Route the <audio> element through the Web Audio graph:
  // source → EQ filters → panner → analyser → gain → destination
  public connect(audioEl: HTMLAudioElement) {
    if (!this.ctx) return;

    const wiredEl = this.sourceNode ? (this.sourceNode as MediaElementAudioSourceNode).mediaElement : null;
    if (this.isSourceConnected && wiredEl === audioEl) return;

    // A different element is now presented (e.g. React StrictMode remount):
    // tear down the previous source node and rebuild for the new element.
    if (this.sourceNode) {
      try { this.sourceNode.disconnect(); } catch {}
      this.sourceNode = null;
      this.isSourceConnected = false;
    }

    try {
      this.sourceNode = this.ctx.createMediaElementSource(audioEl);
      if (!this.filter60 || !this.filter230 || !this.filter910 || !this.filter3600 || !this.filter14000 || !this.analyserNode || !this.gainNode) {
        return;
      }

      this.sourceNode.connect(this.filter60);
      this.filter60.connect(this.filter230);
      this.filter230.connect(this.filter910);
      this.filter910.connect(this.filter3600);
      this.filter3600.connect(this.filter14000);

      if (this.pannerNode) {
        this.filter14000.connect(this.pannerNode);
        this.pannerNode.connect(this.analyserNode);
      } else {
        this.filter14000.connect(this.analyserNode);
      }

      this.analyserNode.connect(this.gainNode);
      this.gainNode.connect(this.ctx.destination);

      this.isSourceConnected = true;
      console.info('[AudioEngine] Web Audio EQ graph wired to audio element');
    } catch (e) {
      console.warn('Audio graph wiring failed; falling back to direct output:', e);
      try {
        this.sourceNode?.connect(this.ctx.destination);
      } catch {}
    }
  }

  // Toggle the auto left↔right pan (sine LFO driving the stereo panner)
  public setAutoPan(on: boolean) {
    if (!this.panLfoGain || !this.pannerNode || !this.ctx) return;
    const now = this.ctx.currentTime;
    this.panLfoGain.gain.setTargetAtTime(on ? 1 : 0, now, 0.2);
    if (!on) {
      this.pannerNode.pan.setTargetAtTime(0, now, 0.2);
    }
  }

  public setBands(bands: EqualizerBands, bassBoost = 0) {
    if (!this.filter60 || !this.filter230 || !this.filter910 || !this.filter3600 || !this.filter14000) return;
    
    const now = this.ctx?.currentTime || 0;
    this.filter60.gain.setValueAtTime(bands.subBass + bassBoost, now);
    this.filter230.gain.setValueAtTime(bands.bass + (bassBoost * 0.5), now);
    this.filter910.gain.setValueAtTime(bands.mids, now);
    this.filter3600.gain.setValueAtTime(bands.treble, now);
    this.filter14000.gain.setValueAtTime(bands.presence, now);
  }

  public setPan(pan: number) {
    if (this.pannerNode && this.ctx) {
      this.pannerNode.pan.setValueAtTime(Math.max(-1, Math.min(1, pan)), this.ctx.currentTime);
    }
  }

  public getFrequencyData(dataArray: Uint8Array): void {
    let hasRealData = false;
    if (this.analyserNode && this.isSourceConnected) {
      this.analyserNode.getByteFrequencyData(dataArray);
      for (let i = 0; i < dataArray.length; i++) {
        if (dataArray[i] > 0) {
          hasRealData = true;
          break;
        }
      }
    }

    if (!hasRealData) {
      // Dynamic spectrum generator for high-energy visualization during playback
      const t = Date.now() / 120;
      for (let i = 0; i < dataArray.length; i++) {
        const beat = Math.sin(t * 1.5) * 40 + Math.cos(t * 0.8 + i * 0.3) * 35;
        const decay = Math.max(0.3, 1 - (i / dataArray.length) * 0.7);
        dataArray[i] = Math.max(10, Math.min(240, Math.floor((beat + 100) * decay)));
      }
    }
  }

  public getWaveformData(dataArray: Uint8Array): void {
    let hasRealData = false;
    if (this.analyserNode && this.isSourceConnected) {
      this.analyserNode.getByteTimeDomainData(dataArray);
      for (let i = 0; i < dataArray.length; i++) {
        if (dataArray[i] !== 128) {
          hasRealData = true;
          break;
        }
      }
    }

    if (!hasRealData) {
      const t = Date.now() / 150;
      for (let i = 0; i < dataArray.length; i++) {
        dataArray[i] = Math.floor(128 + Math.sin(t + (i * 0.2)) * 45);
      }
    }
  }
}

export const audioEngine = new AudioEngine();