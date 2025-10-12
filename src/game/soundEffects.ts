/**
 * Simple Sound Effects using Web Audio API
 * Generates beep sounds without needing audio files
 */

class SoundEffects {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not supported');
      this.enabled = false;
    }
  }

  /**
   * Play a simple tone
   */
  private playTone(frequency: number, duration: number, volume: number = 0.1) {
    if (!this.enabled || !this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  /**
   * Paddle hit sound - mid tone
   */
  paddleHit() {
    this.playTone(440, 0.05, 0.08);
  }

  /**
   * Block hit sound - higher tone
   */
  blockHit() {
    this.playTone(660, 0.08, 0.1);
  }

  /**
   * Block destroyed sound - chord
   */
  blockDestroyed() {
    this.playTone(880, 0.1, 0.12);
    setTimeout(() => this.playTone(1100, 0.1, 0.08), 50);
  }

  /**
   * Life lost sound - descending tone
   */
  lifeLost() {
    this.playTone(330, 0.15, 0.15);
    setTimeout(() => this.playTone(220, 0.2, 0.15), 100);
  }

  /**
   * Week cleared sound - ascending tones
   */
  weekCleared() {
    this.playTone(523, 0.1, 0.12); // C
    setTimeout(() => this.playTone(659, 0.1, 0.12), 100); // E
    setTimeout(() => this.playTone(784, 0.15, 0.15), 200); // G
  }

  /**
   * Year cleared sound - victory fanfare
   */
  yearCleared() {
    this.playTone(523, 0.1, 0.12);
    setTimeout(() => this.playTone(659, 0.1, 0.12), 100);
    setTimeout(() => this.playTone(784, 0.1, 0.12), 200);
    setTimeout(() => this.playTone(1047, 0.3, 0.15), 300);
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

