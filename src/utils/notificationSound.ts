// Simple notification sound using Web Audio API
let audioContext: AudioContext | null = null;

export function playNotificationSound() {
  try {
    // Create or reuse AudioContext
    if (!audioContext) {
      audioContext = new AudioContext();
    }

    // Resume context if suspended (browser autoplay policy)
    if (audioContext.state === "suspended") {
      audioContext.resume();
    }

    const currentTime = audioContext.currentTime;

    // Create oscillator for the notification tone
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Pleasant notification sound - two quick ascending tones
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(800, currentTime);
    oscillator.frequency.setValueAtTime(1000, currentTime + 0.1);

    // Quick fade in/out for a soft sound
    gainNode.gain.setValueAtTime(0, currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, currentTime + 0.02);
    gainNode.gain.linearRampToValueAtTime(0.2, currentTime + 0.1);
    gainNode.gain.linearRampToValueAtTime(0.3, currentTime + 0.12);
    gainNode.gain.linearRampToValueAtTime(0, currentTime + 0.25);

    oscillator.start(currentTime);
    oscillator.stop(currentTime + 0.25);
  } catch (error) {
    console.warn("Could not play notification sound:", error);
  }
}
