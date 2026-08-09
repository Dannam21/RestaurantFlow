const STORAGE_KEY = "restaurantflow_music_enabled";
const VOLUME = 0.1;
const CHORD_DURATION_SECONDS = 4;

/**
 * Synthesized via Web Audio API instead of a shipped audio file — same
 * reasoning as notificationSound.ts: avoids sourcing/licensing third-party
 * music for a hackathon build. A soft looping chord pad, low in the mix.
 */
const CHORD_PROGRESSION: number[][] = [
  [261.63, 329.63, 392.0, 493.88], // Cmaj7
  [220.0, 261.63, 329.63, 392.0], // Am7
  [174.61, 220.0, 261.63, 349.23], // Fmaj7
  [196.0, 246.94, 293.66, 392.0], // Gmaj
];
const LOOP_DURATION_SECONDS = CHORD_PROGRESSION.length * CHORD_DURATION_SECONDS;

let audioContext: AudioContext | null = null;
let masterGain: GainNode | null = null;
let isPlaying = false;
let loopTimeoutId: number | null = null;

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

function scheduleChord(
  ctx: AudioContext,
  destination: GainNode,
  frequencies: number[],
  startTime: number,
  duration: number
) {
  const peak = 0.55 / frequencies.length;
  frequencies.forEach((frequency) => {
    const oscillator = ctx.createOscillator();
    const noteGain = ctx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    noteGain.gain.setValueAtTime(0, startTime);
    noteGain.gain.linearRampToValueAtTime(peak, startTime + 1.4);
    noteGain.gain.linearRampToValueAtTime(peak * 0.7, startTime + duration - 1.6);
    noteGain.gain.linearRampToValueAtTime(0, startTime + duration);
    oscillator.connect(noteGain);
    noteGain.connect(destination);
    oscillator.start(startTime);
    oscillator.stop(startTime + duration + 0.1);
  });
}

function scheduleLoop(ctx: AudioContext, destination: GainNode, startTime: number) {
  CHORD_PROGRESSION.forEach((chord, index) => {
    scheduleChord(
      ctx,
      destination,
      chord,
      startTime + index * CHORD_DURATION_SECONDS,
      CHORD_DURATION_SECONDS
    );
  });
}

export function startBackgroundMusic(): void {
  const ctx = getAudioContext();
  if (!ctx || isPlaying) return;
  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }

  masterGain = ctx.createGain();
  masterGain.gain.value = VOLUME;
  masterGain.connect(ctx.destination);
  isPlaying = true;

  const tick = () => {
    if (!isPlaying || !audioContext || !masterGain) return;
    scheduleLoop(audioContext, masterGain, audioContext.currentTime + 0.1);
    loopTimeoutId = window.setTimeout(tick, LOOP_DURATION_SECONDS * 1000);
  };
  tick();
}

export function stopBackgroundMusic(): void {
  isPlaying = false;
  if (loopTimeoutId !== null) {
    window.clearTimeout(loopTimeoutId);
    loopTimeoutId = null;
  }
  if (masterGain && audioContext) {
    const now = audioContext.currentTime;
    const fadingGain = masterGain;
    fadingGain.gain.cancelScheduledValues(now);
    fadingGain.gain.setValueAtTime(fadingGain.gain.value, now);
    fadingGain.gain.linearRampToValueAtTime(0, now + 0.6);
    window.setTimeout(() => fadingGain.disconnect(), 700);
  }
  masterGain = null;
}

export function isBackgroundMusicEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(STORAGE_KEY) === "true";
}

export function setBackgroundMusicEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, String(enabled));
}
