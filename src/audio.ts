// Audio utility for HOPCAT sound effects
export class AudioManager {
  private audioContext: AudioContext | null = null;
  private isEnabled = true;
  private volume = 0.3;

  constructor() {
    this.initializeAudio();
  }

  private initializeAudio(): void {
    try {
      // Create audio context on first user interaction
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('Audio not supported:', error);
      this.isEnabled = false;
    }
  }

  // Resume audio context if suspended (required for user activation)
  private async resumeAudioContext(): Promise<void> {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  // Generate a hop sound using Web Audio API
  async playHopSound(): Promise<void> {
    if (!this.isEnabled || !this.audioContext) return;

    try {
      await this.resumeAudioContext();

      // Create oscillator for the hop sound
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      // Connect audio nodes
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Configure the hop sound - a quick ascending tone
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(300, this.audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(600, this.audioContext.currentTime + 0.1);

      // Volume envelope - quick fade in/out
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(this.volume, this.audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.15);

      // Play the sound
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.15);

    } catch (error) {
      console.warn('Failed to play hop sound:', error);
    }
  }

  // Play milestone celebration sound
  async playMilestoneSound(): Promise<void> {
    if (!this.isEnabled || !this.audioContext) return;

    try {
      await this.resumeAudioContext();

      // Create a more complex celebratory sound
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          const oscillator = this.audioContext!.createOscillator();
          const gainNode = this.audioContext!.createGain();

          oscillator.connect(gainNode);
          gainNode.connect(this.audioContext!.destination);

          // Rising tone sequence
          const baseFreq = 400 + (i * 100);
          oscillator.type = 'triangle';
          oscillator.frequency.setValueAtTime(baseFreq, this.audioContext!.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, this.audioContext!.currentTime + 0.2);

          gainNode.gain.setValueAtTime(0, this.audioContext!.currentTime);
          gainNode.gain.linearRampToValueAtTime(this.volume * 0.8, this.audioContext!.currentTime + 0.01);
          gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext!.currentTime + 0.25);

          oscillator.start(this.audioContext!.currentTime);
          oscillator.stop(this.audioContext!.currentTime + 0.25);
        }, i * 100);
      }
    } catch (error) {
      console.warn('Failed to play milestone sound:', error);
    }
  }

  // Toggle sound on/off
  toggleSound(): boolean {
    this.isEnabled = !this.isEnabled;
    return this.isEnabled;
  }

  // Set volume (0-1)
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  // Check if audio is enabled
  isAudioEnabled(): boolean {
    return this.isEnabled;
  }
}

// Create a global audio manager instance
export const audioManager = new AudioManager();
