import type { Disposable, InputSample } from "./types";

export function createDesktopInput(): { getSample: () => InputSample } & Disposable {
  let axis = 0;

  // edge-detected actions
  let prevCal = false;
  let prevRestart = false;

  let calPressed = false;
  let restartPressed = false;

  const onKeyDown = (e: KeyboardEvent) => {
    const k = e.key;

    if (k === "w" || k === "W") axis = 1;
    if (k === "s" || k === "S") axis = -1;

    // Optional keyboard actions:
    // C = calibrate, R = restart
    if (k === "c" || k === "C") calPressed = true;
    if (k === "r" || k === "R") restartPressed = true;
  };

  const onKeyUp = (e: KeyboardEvent) => {
    const k = e.key;

    if ((k === "w" || k === "W") && axis === 1) axis = 0;
    if ((k === "s" || k === "S") && axis === -1) axis = 0;

    if (k === "c" || k === "C") calPressed = false;
    if (k === "r" || k === "R") restartPressed = false;
  };

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);

  return {
    getSample(): InputSample {
      const calibratePressed = calPressed && !prevCal;
      const restartPressedEdge = restartPressed && !prevRestart;

      prevCal = calPressed;
      prevRestart = restartPressed;

      return {
        moveY: axis === 0 ? 0 : axis,
        actions: { calibratePressed, restartPressed: restartPressedEdge },
      };
    },
    dispose() {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    },
  };
}
