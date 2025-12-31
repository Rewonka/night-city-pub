// src/xr.js
import * as THREE from 'https://unpkg.com/three@0.181.2/build/three.module.js';
import { CONFIG } from './config.js';

function createControllerViz() {
  return new THREE.Mesh(
    new THREE.SphereGeometry(0.02, 12, 12),
    new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xffff00, emissiveIntensity: 0.3 })
  );
}

export function setupXrControllers(renderer, scene) {
  const left = renderer.xr.getController(0);
  const right = renderer.xr.getController(1);

  // We'll assign handedness on connect
  let leftController = null;
  let rightController = null;

  // button edge detection
  const prev = { left: [], right: [] };

  function onConnected(controller) {
    const data = controller.userData?.inputSource;
    const handedness = data?.handedness;

    controller.add(createControllerViz());

    if (handedness === 'left') leftController = controller;
    if (handedness === 'right') rightController = controller;
  }

  function onDisconnected(controller) {
    const data = controller.userData?.inputSource;
    if (data?.handedness === 'left') leftController = null;
    if (data?.handedness === 'right') rightController = null;
  }

  for (const c of [left, right]) {
    c.addEventListener('connected', (e) => {
      c.userData.inputSource = e.data;
      onConnected(c);
    });
    c.addEventListener('disconnected', () => onDisconnected(c));
    scene.add(c);
  }

  function readButtons(controller, which) {
    const src = controller?.userData?.inputSource;
    const gp = src?.gamepad;
    if (!gp) return { pressed: [], down: [] };

    const pressed = gp.buttons.map(b => !!b.pressed);
    const prevArr = which === 'right' ? prev.right : prev.left;
    const down = pressed.map((p, i) => p && !prevArr[i]);

    // store
    if (which === 'right') prev.right = pressed;
    else prev.left = pressed;

    return { pressed, down };
  }

  // calibration state
  let vrCenterOffset = 0;

  function calibrateFromController(gameGroup) {
    if (!rightController) return null;
    const worldPos = new THREE.Vector3();
    rightController.getWorldPosition(worldPos);

    const local = gameGroup.worldToLocal(worldPos.clone());
    // target: controller y maps to y=0 of the field
    vrCenterOffset = -local.y * CONFIG.VR.yScale;
    return vrCenterOffset;
  }

  function getVrCenterOffset() {
    return vrCenterOffset;
  }

  function getRightController() {
    return rightController;
  }

  function getActions(gameGroup) {
    // only check right for actions (common UX)
    const { down } = readButtons(rightController, 'right');

    const wantsCalibrate = !!down[CONFIG.VR.buttonCalibrate];
    const wantsRestart = !!down[CONFIG.VR.buttonRestart];

    if (wantsCalibrate) calibrateFromController(gameGroup);

    return { wantsCalibrate, wantsRestart };
  }

  return {
    getRightController,
    getActions,
    getVrCenterOffset,
    calibrateFromController,
  };
}
