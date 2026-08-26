// Procedural Web Audio API Synthesizer (0 bytes audio assets)
let ctx = null;
let muted = false;
let bgOsc = null;
let bgTimer = null;

function getCtx() {
  if (!ctx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) ctx = new AudioCtx();
  }
  if (ctx && ctx.state === 'suspended') {
    ctx.resume();
  }
  return ctx;
}

export const sound = {
  toggleMute() {
    muted = !muted;
    return muted;
  },
  isMuted() { return muted; },
  
  playCatch() {
    if (muted) return;
    const c = getCtx();
    if (!c) return;
    const now = c.currentTime;
    const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    freqs.forEach((f, i) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + i * 0.04);
      gain.gain.setValueAtTime(0.15, now + i * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.15);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start(now + i * 0.04);
      osc.stop(now + i * 0.04 + 0.15);
    });
  },

  playGolden() {
    if (muted) return;
    const c = getCtx();
    if (!c) return;
    const now = c.currentTime;
    const notes = [587.33, 739.99, 880, 1174.66, 1479.98]; // D5, F#5, A5, D6, F#6
    notes.forEach((f, i) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + i * 0.05);
      gain.gain.setValueAtTime(0.2, now + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.25);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start(now + i * 0.05);
      osc.stop(now + i * 0.05 + 0.25);
    });
  },

  playHit() {
    if (muted) return;
    const c = getCtx();
    if (!c) return;
    const now = c.currentTime;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.3);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(now);
    osc.stop(now + 0.3);
  },

  playGameOver() {
    if (muted) return;
    const c = getCtx();
    if (!c) return;
    const now = c.currentTime;
    const freqs = [440, 415.30, 392, 349.23]; // A4, Ab4, G4, F4
    freqs.forEach((f, i) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, now + i * 0.15);
      gain.gain.setValueAtTime(0.25, now + i * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.3);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start(now + i * 0.15);
      osc.stop(now + i * 0.15 + 0.3);
    });
  },

  startBgMusic() {
    if (bgTimer) return;
    const c = getCtx();
    if (!c) return;
    let step = 0;
    const scale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25]; // C major pentatonic
    bgTimer = setInterval(() => {
      if (muted) return;
      const now = c.currentTime;
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'sine';
      const note = scale[(step * 3 + (step % 5)) % scale.length];
      osc.frequency.setValueAtTime(note, now);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start(now);
      osc.stop(now + 0.18);
      step++;
    }, 200);
  },

  stopBgMusic() {
    if (bgTimer) {
      clearInterval(bgTimer);
      bgTimer = null;
    }
  }
};
