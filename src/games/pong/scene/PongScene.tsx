import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  Group,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  SphereGeometry,
  BoxGeometry,
  Vector3,
} from "three";
import { useXR } from "@react-three/xr";

import { DEFAULT_PONG_CONFIG } from "../config";
import { createInitialState, type PongState } from "../state";
import { stepPong } from "../step";
import { createHud } from "../ui/hud";
import { createAudio } from "../ui/audio";

import { createDesktopInput } from "../input/desktopInput";
import { createTouchInput } from "../input/touchInput";
import { createXrInput } from "../input/xrInput";
import { pickInput } from "../input/router";

import { createCalibrationMode } from "../dev/calibration";

export function PongScene() {
  const config = DEFAULT_PONG_CONFIG;

  const xr = useXR();

  const rootRef = useRef<Group | null>(null);
  const leftPaddleRef = useRef<Mesh | null>(null);
  const rightPaddleRef = useRef<Mesh | null>(null);
  const ballRef = useRef<Mesh | null>(null);
  const trailRefs = useRef<Mesh[]>([]);

  const stateRef = useRef<PongState>(createInitialState(config));

  const hud = useMemo(() => createHud(config), []);
  const audio = useMemo(() => createAudio(), []);

  // XR calibration offset (vertical)
  const vrCenterOffsetRef = useRef(0);

  // Build materials/geometries once
  const materials = useMemo(() => {
    const left = new MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x001a1a,
      emissiveIntensity: 1.2,
    });
    const right = new MeshStandardMaterial({
      color: 0xff00ff,
      emissive: 0x1a001a,
      emissiveIntensity: 1.2,
    });
    const ball = new MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x00ffff,
      emissiveIntensity: 2.0,
    });
    const frame = new MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x00ffff,
      emissiveIntensity: 2.5,
      transparent: true,
      opacity: 0.9,
    });
    const tv = new MeshStandardMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.35,
      emissive: 0x00111a,
      emissiveIntensity: 0.8,
    });
    return { left, right, ball, frame, tv };
  }, []);

  const geometries = useMemo(() => {
    return {
      paddle: new BoxGeometry(config.paddle.width, config.paddle.height, 0.1),
      ball: new SphereGeometry(config.ball.radius, 16, 16),
      tv: new BoxGeometry(config.field.width + 0.4, config.field.height + 0.4, 0.12),
      frameH: new BoxGeometry(config.field.width + 0.5, 0.05, 0.15),
      frameV: new BoxGeometry(0.05, config.field.height + 0.5, 0.15),
      trail: new SphereGeometry(config.ball.radius * 0.6, 12, 12),
    };
  }, [config]);

  // Create objects once
  if (!rootRef.current) {
    const root = new Group();
    root.position.set(...config.placement.position);
    root.rotation.y = config.placement.rotationY;
    root.scale.setScalar(config.placement.scale);

    // TV panel
    const tv = new Mesh(geometries.tv, materials.tv);
    tv.position.set(0, 0, 0);
    root.add(tv);

    // Frame glow
    const top = new Mesh(geometries.frameH, materials.frame);
    const bottom = new Mesh(geometries.frameH, materials.frame);
    const leftF = new Mesh(geometries.frameV, materials.frame);
    const rightF = new Mesh(geometries.frameV, materials.frame);

    top.position.set(0, config.field.height / 2 + 0.22, 0.02);
    bottom.position.set(0, -config.field.height / 2 - 0.22, 0.02);
    leftF.position.set(-config.field.width / 2 - 0.22, 0, 0.02);
    rightF.position.set(config.field.width / 2 + 0.22, 0, 0.02);

    root.add(top, bottom, leftF, rightF);

    // Paddles
    const halfW = config.field.width / 2;
    const leftX = -halfW + config.paddle.xOffsetFromWall;
    const rightX = halfW - config.paddle.xOffsetFromWall;

    const leftP = new Mesh(geometries.paddle, materials.left);
    leftP.position.set(leftX, 0, 0.06);
    root.add(leftP);
    leftPaddleRef.current = leftP;

    const rightP = new Mesh(geometries.paddle, materials.right);
    rightP.position.set(rightX, 0, 0.06);
    root.add(rightP);
    rightPaddleRef.current = rightP;

    // Ball
    const b = new Mesh(geometries.ball, materials.ball);
    b.position.set(0, 0, 0.07);
    root.add(b);
    ballRef.current = b;

    // Trail
    const trailGroup = new Group();
    for (let i = 0; i < config.trail.segments; i++) {
      const t = new Mesh(geometries.trail, materials.ball);
      trailGroup.add(t);
      trailRefs.current.push(t);
    }
    root.add(trailGroup);

    // HUD
    root.add(hud.group);

    rootRef.current = root;
  }

  // Desktop + touch input lifecycles
  const desktopInputRef = useRef<ReturnType<typeof createDesktopInput> | null>(null);
  const touchInputRef = useRef<ReturnType<typeof createTouchInput> | null>(null);

  useEffect(() => {
    desktopInputRef.current = createDesktopInput();
    touchInputRef.current = createTouchInput();

    const unlock = () => audio.unlock();
    window.addEventListener("pointerdown", unlock);

    return () => {
      desktopInputRef.current?.dispose();
      touchInputRef.current?.dispose();
      window.removeEventListener("pointerdown", unlock);
    };
  }, [audio]);

  // XR input (polled)
  const xrInputRef = useRef<ReturnType<typeof createXrInput> | null>(null);
  useEffect(() => {
    if (!rootRef.current) return;

    xrInputRef.current = createXrInput({
      xr,
      boardRoot: rootRef.current,
      config,
      vrCenterOffsetRef,
    });

    return () => {
      xrInputRef.current?.dispose();
      xrInputRef.current = null;
    };
  }, [xr, config]);

  // Developer calibration mode (toggle with K)
  const calibrationRef = useRef<ReturnType<typeof createCalibrationMode> | null>(null);

  useEffect(() => {
    if (!rootRef.current) return;

    const getRightController = () => {
      const controllers = xr.controllers ?? [];
      let right: any | undefined;

      for (const c of controllers as any[]) {
        if (c?.inputSource?.handedness === "right") right = c;
      }
      if (!right && controllers.length > 0) right = controllers[0];

      if (!right?.controller) return null;
      return { controller: right.controller as Object3D, gamepad: right?.inputSource?.gamepad as Gamepad | undefined };
    };

    calibrationRef.current = createCalibrationMode({
      boardRoot: rootRef.current,
      getRightController,
    });

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" || e.key === "K") {
        calibrationRef.current?.toggle();
        const st = calibrationRef.current?.getState();
        hud.setMessage(st?.enabled ? "DEV CALIBRATION: ON (hold GRIP to move board)" : "DEV CALIBRATION: OFF", 1800);
      }

      // Print placement to console: P key
      if (e.key === "p" || e.key === "P") {
        const placement = calibrationRef.current?.getPlacementForConfig();
        if (placement) {
          // eslint-disable-next-line no-console
          console.log("[PONG] placement =", placement);
          hud.setMessage(`placement logged to console`, 1200);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [xr, hud]);

  // Helper: trail update
  function updateTrail() {
    const tr = trailRefs.current;
    const b = ballRef.current;
    if (!b) return;

    for (let i = tr.length - 1; i > 0; i--) {
      tr[i].position.copy(tr[i - 1].position);
      const s = 1 - i / tr.length;
      tr[i].scale.setScalar(s);
    }
    tr[0].position.copy(b.position);
    tr[0].scale.setScalar(1);
  }

  // Main loop
  useFrame((_, dt) => {
    const desktop = desktopInputRef.current?.getSample() ?? {
      moveY: 0,
      actions: { calibratePressed: false, restartPressed: false },
    };
    const touch = touchInputRef.current?.getSample() ?? {
      moveY: 0,
      actions: { calibratePressed: false, restartPressed: false },
    };
    const touchActive = touchInputRef.current?.isActive?.() ?? false;

    const xrSample = xrInputRef.current?.getSample() ?? {
      moveY: 0,
      actions: { calibratePressed: false, restartPressed: false },
    };

    const chosen = pickInput({
      xrPresenting: !!xr.isPresenting,
      touchActive,
      xr: xrSample,
      touch,
      desktop,
    });

    // Developer calibration update (moves boardRoot while enabled)
    calibrationRef.current?.update();

    // XR calibrate action: center vertical
    if (chosen.actions.calibratePressed && xr.isPresenting) {
      xrInputRef.current?.calibrateAtCurrentPose();
      audio.beep("calibrate");
      hud.setMessage("Calibrated", 700);
    }

    // Unlock audio on activity
    if ((chosen.moveY ?? 0) !== 0 || chosen.actions.restartPressed) {
      audio.unlock();
    }

    // Run engine
    const { state, events } = stepPong(config, stateRef.current, {
      dt,
      isXR: !!xr.isPresenting,
      moveY: chosen.moveY ?? 0,
      calibratePressed: chosen.actions.calibratePressed,
      restartPressed: chosen.actions.restartPressed,
    });

    stateRef.current = state;

    // Apply state to meshes
    if (leftPaddleRef.current) leftPaddleRef.current.position.y = state.paddles.leftY;
    if (rightPaddleRef.current) rightPaddleRef.current.position.y = state.paddles.rightY;
    if (ballRef.current) {
      ballRef.current.position.x = state.ball.pos.x;
      ballRef.current.position.y = state.ball.pos.y;
    }

    updateTrail();

    // HUD
    hud.setScore(state.score.left, state.score.right);
    hud.tick(dt);

    // Side effects
    for (const e of events) {
      if (e.type === "sound") audio.beep(e.name);
      if (e.type === "message") hud.setMessage(e.text, e.ms);
    }
  });

  return <primitive object={rootRef.current!} />;
}
