type BeepName = "paddle" | "wall" | "score" | "gameOver" | "calibrate";

export function createAudio() {
  let ctx: AudioContext | null = null;

  function getCtx(): AudioContext | null {
    const Ctx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext | undefined;
    if (!Ctx) return null;
    if (!ctx) ctx = new Ctx();
    return ctx;
  }

  function unlock() {
    const c = getCtx();
    if (!c) return;
    if (c.state === "suspended") c.resume().catch(() => {});
  }

  function beep(name: BeepName) {
    const c = getCtx();
    if (!c) return;

    const now = c.currentTime;

    const o = c.createOscillator();
    const g = c.createGain();

    let freq = 440;
    let dur = 0.06;

    switch (name) {
      case "paddle":
        freq = 880;
        dur = 0.05;
        break;
      case "wall":
        freq = 660;
        dur = 0.05;
        break;
      case "score":
        freq = 520;
        dur = 0.12;
        break;
      case "gameOver":
        freq = 220;
        dur = 0.25;
        break;
      case "calibrate":
        freq = 740;
        dur = 0.08;
        break;
    }

    o.type = "sine";
    o.frequency.setValueAtTime(freq, now);

    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.08, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    o.connect(g);
    g.connect(c.destination);

    o.start(now);
    o.stop(now + dur + 0.02);
  }

  return { unlock, beep };
}
