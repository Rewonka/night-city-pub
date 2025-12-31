// src/audio.js
// WebAudio helper (clean, isolated side-effects)

export function createAudio() {
  let ctx = null;

  function getContext() {
    if (!ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      ctx = new AudioCtx();
    }
    return ctx;
  }

  function unlock() {
    try {
      const c = getContext();
      if (c.state === 'suspended') c.resume();
    } catch {
      // ignore
    }
  }

  function playBeep({ freq = 440, duration = 0.08, type = 'sine', gain = 0.05 } = {}) {
    const c = getContext();
    const osc = c.createOscillator();
    const g = c.createGain();

    osc.type = type;
    osc.frequency.value = freq;
    g.gain.value = gain;

    osc.connect(g);
    g.connect(c.destination);

    const now = c.currentTime;
    osc.start(now);
    osc.stop(now + duration);
  }

  // Small semantic API (call sites read better)
  const beep = {
    paddle: () => playBeep({ freq: 620, duration: 0.05, type: 'square', gain: 0.04 }),
    wall: () => playBeep({ freq: 420, duration: 0.05, type: 'triangle', gain: 0.035 }),
    score: () => playBeep({ freq: 240, duration: 0.12, type: 'sawtooth', gain: 0.05 }),
    gameOver: () => playBeep({ freq: 120, duration: 0.25, type: 'sine', gain: 0.06 }),
    calibrate: () => playBeep({ freq: 880, duration: 0.07, type: 'square', gain: 0.05 }),
  };

  return { unlock, beep };
}
