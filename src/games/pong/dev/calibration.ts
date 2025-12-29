import { Vector3, type Group, type Object3D } from "three";

export type CalibrationState = Readonly<{
  enabled: boolean;
  grabbing: boolean;
}>;

export function createCalibrationMode(args: {
  boardRoot: Group;
  getRightController: () => { controller: Object3D; gamepad?: Gamepad } | null;
}) {
  const { boardRoot, getRightController } = args;

  const state: { enabled: boolean; grabbing: boolean } = {
    enabled: false,
    grabbing: false,
  };

  const tmp = new Vector3();
  let grabOffset = new Vector3();
  let grabYawOffset = 0;

  function toggle() {
    state.enabled = !state.enabled;
  }

  function isGrabPressed(gamepad?: Gamepad): boolean {
    // Common mappings: grip is often buttons[2]
    return !!gamepad?.buttons?.[2]?.pressed;
  }

  function update() {
    if (!state.enabled) return;

    const rc = getRightController();
    if (!rc) return;

    const grab = isGrabPressed(rc.gamepad);

    if (grab && !state.grabbing) {
      // start grab: store offset between controller and board
      state.grabbing = true;

      rc.controller.getWorldPosition(tmp);
      grabOffset = boardRoot.position.clone().sub(tmp);

      // yaw only (simple)
      grabYawOffset = boardRoot.rotation.y - rc.controller.rotation.y;
    }

    if (!grab && state.grabbing) {
      // release grab
      state.grabbing = false;
    }

    if (state.grabbing) {
      rc.controller.getWorldPosition(tmp);
      boardRoot.position.copy(tmp.add(grabOffset));

      boardRoot.rotation.y = rc.controller.rotation.y + grabYawOffset;
    }
  }

  function getPlacementForConfig() {
    const p = boardRoot.position;
    const rotY = boardRoot.rotation.y;
    const s = boardRoot.scale.x; // uniform scale assumed
    return {
      position: [round3(p.x), round3(p.y), round3(p.z)] as [number, number, number],
      rotationY: round3(rotY),
      scale: round3(s),
    };
  }

  function round3(v: number) {
    return Math.round(v * 1000) / 1000;
  }

  return {
    toggle,
    update,
    getPlacementForConfig,
    getState(): CalibrationState {
      return { enabled: state.enabled, grabbing: state.grabbing };
    },
  };
}
