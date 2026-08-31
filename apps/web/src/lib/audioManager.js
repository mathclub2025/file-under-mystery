// Global Audio Coordinator for Auto-Ducking/Muting Background Music

let activeCount = 0;

export function notifyAudioPlay() {
  activeCount++;
  window.dispatchEvent(new CustomEvent("mystery-audio-activity", { detail: { active: true } }));
}

export function notifyAudioPause() {
  activeCount = Math.max(0, activeCount - 1);
  if (activeCount === 0) {
    window.dispatchEvent(new CustomEvent("mystery-audio-activity", { detail: { active: false } }));
  }
}

export function notifyAudioEnded() {
  activeCount = Math.max(0, activeCount - 1);
  if (activeCount === 0) {
    window.dispatchEvent(new CustomEvent("mystery-audio-activity", { detail: { active: false } }));
  }
}

export function notifyAllAudioStopped() {
  activeCount = 0;
  window.dispatchEvent(new CustomEvent("mystery-audio-activity", { detail: { active: false } }));
}
