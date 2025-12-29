import { Vector3, type Group, type Object3D } from "three";
import type { PongConfig } from "../config";
import type { Disposable, InputSample } from "./types";

/**
 * XR input reads right controller pose and maps it into board-local Y.
 * Also edge-detects gamepad buttons:
 * - buttons[0] -> calibrate
 * - buttons[1] -> restart
 */
export function createXrInput(args: {
  xr: any; // useXR() return type (kept loose on purpose)
  boardRoot: Group;
  config: PongConfig;
  vrCenterOffsetRef: { current: number };
}): { getSample: () => InputSample; calibrateAtCurrentPose: () => void } & Disposable {
  const { xr, boardRoot, config, vrCenterOffsetRef } = args;

  const v = new Vector3();

  let prevB0 = false;
  let prevB1 = false;

  function getRightController(): { controller: Object3D; gamepad?: Gamepad } | null {
    const controllers = xr.controllers ?? [];
    let right: any | undefined;

    for (const c of controllers as any[]) {
      if (c?.inputSource?.handedness === "right") right = c;
    }
    if (!right && controllers.length > 0) right = controllers[0];

    if (!right?.controller) return null;
    const gp = right?.inputSource?.gamepad as Gamepad | undefined;
    return { controller: right.controller as Object3D, gamepad: gp };
  }

  function poseDesiredY(controller: Object3D): number {
    controller.getWorldPosition(v);
    const local = boardRoot.worldToLocal(v.clone());
    return local.y * config.xr.vrYScale + vrCenterOffsetRef.current;
  }

  function calibrateAtCurrentPose() {
    const rc = getRightController();
    if (!rc) return;
    rc.controller.getWorldPosition(v);
    const local = boardRoot.worldToLocal(v.clone());
    vrCenterOffsetRef.current = -local.y * config.xr.vrYScale;
  }

  return {
    getSample(): InputSample {
      if (!xr.isPresenting) {
        return {
          moveY: 0,
          actions: { calibratePressed: false, restartPressed: false },
        };
      }

      const rc = getRightController();
      if (!rc) {
        return {
          moveY: 0,
          actions: { calibratePressed: false, restartPressed: false },
        };
      }

      const desiredY = poseDesiredY(rc.controller);

      // We output axis-like value later in PongScene by comparing against current paddle Y.
      // Here we store it in moveY as a “desired” proxy is NOT ideal, so we keep it as 0 here
      // and let PongScene ask us for desiredY when needed (in dev mode we keep it simple).
      // For now: we map it to an axis using a soft limiter around 0.25 units.
      // (Clean & replaceable later.)
      const axis = Math.max(-1, Math.min(1, desiredY / 0.25));

      // Buttons edge detect
      const b0 = !!rc.gamepad?.buttons?.[0]?.pressed;
      const b1 = !!rc.gamepad?.buttons?.[1]?.pressed;

      const calibratePressed = b0 && !prevB0;
      const restartPressed = b1 && !prevB1;

      prevB0 = b0;
      prevB1 = b1;

      return {
        moveY: axis,
        actions: { calibratePressed, restartPressed },
      };
    },

    calibrateAtCurrentPose,

    dispose() {
      // nothing to dispose: XR input is polled
    },
  };
}
