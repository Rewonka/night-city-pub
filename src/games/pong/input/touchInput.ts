import type { Disposable, InputSample } from "./types";

export function createTouchInput(): { getSample: () => InputSample; isActive: () => boolean } & Disposable {
  let axis = 0;
  let active = false;

  let startY = 0;
  let startAxis = 0;

  // no actions from touch yet (you can add tap regions later)
  const actions = { calibratePressed: false, restartPressed: false };

  const onPointerDown = (e: PointerEvent) => {
    // right half of screen -> player paddle control
    if (e.clientX < window.innerWidth * 0.5) return;
    active = true;
    startY = e.clientY;
    startAxis = axis;
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!active) return;
    const dyNorm = (startY - e.clientY) / window.innerHeight; // up positive
    const next = startAxis + dyNorm * 6.0; // sensitivity
    axis = Math.max(-1, Math.min(1, next));
  };

  const onPointerUp = () => {
    active = false;
    axis = 0;
  };

  window.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);

  return {
    getSample(): InputSample {
      return { moveY: active ? axis : 0, actions };
    },
    isActive() {
      return active;
    },
    dispose() {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    },
  };
}
