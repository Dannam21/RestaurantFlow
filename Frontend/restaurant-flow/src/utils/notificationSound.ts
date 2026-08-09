export type SoundKind = "ding" | "alert" | "tada";

const VOLUME = 0.7;
const STORAGE_KEY = "restaurantflow_notifications_enabled";

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioContextClass =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!audioContext) audioContext = new AudioContextClass();
  return audioContext;
}

function playTone(
  ctx: AudioContext,
  frequency: number,
  startTime: number,
  duration: number,
  gainValue: number
) {
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = frequency;
  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(gainValue, startTime + 0.02);
  gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration);
}

/**
 * Synthesized via Web Audio API instead of shipped .mp3 files — avoids
 * sourcing/licensing third-party audio assets for a hackathon build.
 */
export function playSound(kind: SoundKind): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }

  const now = ctx.currentTime;

  if (kind === "ding") {
    playTone(ctx, 880, now, 0.25, VOLUME * 0.5);
  } else if (kind === "alert") {
    playTone(ctx, 660, now, 0.18, VOLUME * 0.6);
    playTone(ctx, 880, now + 0.2, 0.22, VOLUME * 0.6);
  } else {
    playTone(ctx, 523.25, now, 0.16, VOLUME * 0.5);
    playTone(ctx, 659.25, now + 0.14, 0.16, VOLUME * 0.5);
    playTone(ctx, 783.99, now + 0.28, 0.3, VOLUME * 0.6);
  }
}

export function isNotificationsEnabled(): boolean {
  if (typeof window === "undefined") return true;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === null ? true : stored === "true";
}

export function setNotificationsEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, String(enabled));
}

export function shouldPlaySound(): boolean {
  return isNotificationsEnabled();
}

export function vibrate(pattern: number | number[]): void {
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // Some browsers throw if called outside a user gesture; safe to ignore.
  }
}
