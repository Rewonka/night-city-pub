// src/input-desktop.js
// Minimal desktop input: W/S for vertical axis.

export function createDesktopInput() {
  const keys = { w: false, s: false };

  function onKeyDown(e) {
    if (e.code === 'KeyW') keys.w = true;
    if (e.code === 'KeyS') keys.s = true;
  }

  function onKeyUp(e) {
    if (e.code === 'KeyW') keys.w = false;
    if (e.code === 'KeyS') keys.s = false;
  }

  function getAxis() {
    // +1 up, -1 down
    return (keys.w ? 1 : 0) + (keys.s ? -1 : 0);
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  function dispose() {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
  }

  return { getAxis, dispose };
}
