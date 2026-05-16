/**
 * Office-style sound effects using the Web Audio API.
 * Keeps audio self-contained while avoiding harsh arcade beeps.
 */

/**
 * Extended Window interface with webkit prefix support
 */
interface WindowWithWebkit extends Window {
  webkitAudioContext?: typeof AudioContext;
}

class SoundEffects {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    try {
      const windowWithWebkit = window as WindowWithWebkit;
      this.audioContext = new (window.AudioContext || windowWithWebkit.webkitAudioContext || AudioContext)();
    } catch (e) {
      console.warn('Web Audio API not supported');
      this.enabled = false;
    }
  }

  private get currentTime(): number {
    return this.audioContext?.currentTime ?? 0;
  }

  private playTone(
    frequency: number,
    duration: number,
    volume: number = 0.05,
    type: OscillatorType = 'sine',
    delay: number = 0
  ) {
    if (!this.enabled || !this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const start = this.currentTime + delay;

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    gainNode.gain.setValueAtTime(0.001, start);
    gainNode.gain.exponentialRampToValueAtTime(volume, start + 0.012);
    gainNode.gain.exponentialRampToValueAtTime(0.001, start + duration);

    oscillator.start(start);
    oscillator.stop(start + duration);
  }

  private playNoise(duration: number, volume: number, delay: number = 0) {
    if (!this.enabled || !this.audioContext) return;

    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(1, Math.max(1, Math.ceil(sampleRate * duration)), sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    }

    const source = this.audioContext.createBufferSource();
    const filter = this.audioContext.createBiquadFilter();
    const gainNode = this.audioContext.createGain();
    const start = this.currentTime + delay;

    source.buffer = buffer;
    filter.type = 'highpass';
    filter.frequency.value = 1200;

    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    gainNode.gain.setValueAtTime(volume, start);
    gainNode.gain.exponentialRampToValueAtTime(0.001, start + duration);

    source.start(start);
    source.stop(start + duration);
  }

  /**
   * Paddle hit sound - soft toolbar click
   */
  paddleHit() {
    this.playTone(520, 0.035, 0.025, 'triangle');
    this.playNoise(0.025, 0.012);
  }

  /**
   * Block hit sound - calendar selection tick
   */
  blockHit() {
    this.playTone(740, 0.05, 0.032, 'sine');
    this.playTone(990, 0.045, 0.018, 'sine', 0.035);
  }

  /**
   * Block destroyed sound - archive/delete confirmation
   */
  blockDestroyed() {
    this.playNoise(0.08, 0.022);
    this.playTone(660, 0.06, 0.032, 'triangle', 0.015);
    this.playTone(880, 0.09, 0.024, 'sine', 0.07);
  }

  /**
   * Life lost sound - muted warning
   */
  lifeLost() {
    this.playTone(392, 0.12, 0.055, 'triangle');
    this.playTone(294, 0.18, 0.045, 'triangle', 0.11);
  }

  /**
   * Week cleared sound - meeting accepted chime
   */
  weekCleared() {
    this.playTone(587, 0.08, 0.04, 'sine');
    this.playTone(740, 0.09, 0.035, 'sine', 0.08);
    this.playTone(988, 0.16, 0.03, 'sine', 0.18);
  }

  /**
   * Campaign cleared sound - Outlook-style success flourish
   */
  yearCleared() {
    this.playTone(523, 0.08, 0.04, 'sine');
    this.playTone(659, 0.08, 0.04, 'sine', 0.08);
    this.playTone(784, 0.1, 0.038, 'sine', 0.16);
    this.playTone(1047, 0.22, 0.035, 'triangle', 0.26);
  }

  /**
   * Toggle sound on/off
   */
  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  /**
   * Check if sound is enabled
   */
  isEnabled() {
    return this.enabled;
  }
}

// Export singleton instance
export const sound = new SoundEffects();

