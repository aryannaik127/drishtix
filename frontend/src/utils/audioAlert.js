// ─────────────────────────────────────────────
// DRISHTIX Web Audio API Tactical Sound Synthesizer
// Zero external asset dependencies. Generates realistic
// tactical military & command-center audio tones.
// ─────────────────────────────────────────────

let audioCtx = null;
let isMuted = false;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioCtx = new AudioContext();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export const isAudioMuted = () => isMuted;

export const toggleAudioMute = () => {
  isMuted = !isMuted;
  return isMuted;
};

export const setAudioMuted = (muted) => {
  isMuted = muted;
};

// Subtle UI click / interaction beep
export const playBeep = (freq = 880, duration = 0.08) => {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    // AudioContext blocked by browser autoplay policy until user interacts
  }
};

// Tactical double warning beep (Medium/High Risk Alert)
export const playWarningTone = () => {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    [0, 0.14].forEach((offset) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(620, now + offset);
      osc.frequency.exponentialRampToValueAtTime(840, now + offset + 0.09);

      gain.gain.setValueAtTime(0.08, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + offset);
      osc.stop(now + offset + 0.1);
    });
  } catch (e) {}
};

// Critical Alarm / Intrusion Siren (Oscillating Dual Pitch)
export const playCriticalSiren = (cycles = 3) => {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const cycleDuration = 0.28;

    for (let i = 0; i < cycles; i++) {
      const start = now + i * cycleDuration;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(450, start);
      osc.frequency.linearRampToValueAtTime(950, start + cycleDuration * 0.5);
      osc.frequency.linearRampToValueAtTime(450, start + cycleDuration);

      gain.gain.setValueAtTime(0.1, start);
      gain.gain.exponentialRampToValueAtTime(0.01, start + cycleDuration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + cycleDuration);
    }
  } catch (e) {}
};

// Dispatch confirmed radio chirps
export const playRadioChirp = () => {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(700, now + 0.08);

    gain.gain.setValueAtTime(0.07, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.1);
  } catch (e) {}
};
