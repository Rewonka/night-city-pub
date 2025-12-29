import { useFrame } from "@react-three/fiber";
import { useXR } from "@react-three/xr";
import * as THREE from "three";
import { useRef } from "react";

interface PlayerPaddleControlProps {
  groupRef: React.RefObject<THREE.Group>;
  rightPaddleRef: React.MutableRefObject<THREE.Vector3>;
  vrCenterOffsetRef: React.MutableRefObject<number>;
  VR_Y_SCALE: number;
  PADDLE_SPEED: number;
  maxY: number;
  inputRef: React.MutableRefObject<{ rightUp: boolean; rightDown: boolean }>;
  isPresenting: boolean;
}

export const PlayerPaddleControl = ({
  groupRef,
  rightPaddleRef,
  vrCenterOffsetRef,
  VR_Y_SCALE,
  PADDLE_SPEED,
  maxY,
  inputRef,
  isPresenting,
}: PlayerPaddleControlProps) => {
  const inputSourceStates = useXR((xr: any) => xr.inputSourceStates);
  // Used only for optional debug logging
  const controllers = useXR((xr: any) => xr.controllers);
  const _logTs = useRef(0);
  const _firstFrame = useRef(true);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Hand tracking support (use `inputSourceStates` from xr store)
    // NOTE: XRHand.get('joint-name') returns an XRJointSpace (no transform).
    // To read joint positions you must use XRFrame.getJointPose(jointSpace, referenceSpace).
    let handY: number | null = null;
    if (inputSourceStates && inputSourceStates.length) {
      // Prefer 'hand' type state for hand tracking
      const rightHandState = inputSourceStates.find((s: any) => s.inputSource?.handedness === 'right' && s.type === 'hand');
      if (rightHandState && rightHandState.inputSource?.hand && groupRef.current) {
        const frame: XRFrame | undefined = (state.gl as any)?.xr?.getFrame?.();
        const referenceSpace: XRReferenceSpace | undefined = (state.gl as any)?.xr?.getReferenceSpace?.();

        // Try joint pose first (most reliable)
        if (frame && referenceSpace && typeof frame.getJointPose === 'function') {
          const hand: XRHand = rightHandState.inputSource.hand;
          const jointSpace: XRJointSpace | undefined =
            (hand.get('index-finger-tip') as any) || (hand.get('wrist') as any);

          if (jointSpace) {
            const jointPose = frame.getJointPose(jointSpace, referenceSpace);
            if (jointPose) {
              const worldPos = new THREE.Vector3(
                jointPose.transform.position.x,
                jointPose.transform.position.y,
                jointPose.transform.position.z
              );
              const localPos = worldPos.clone();
              groupRef.current.worldToLocal(localPos);
              handY = localPos.y * VR_Y_SCALE - vrCenterOffsetRef.current;
            }
          }
        }

        // Fallback: if the library created a Three.js object for the hand, use its world position.
        if (handY === null && (rightHandState as any).object) {
          const worldPos = new THREE.Vector3();
          (rightHandState as any).object.getWorldPosition(worldPos);
          const localPos = worldPos.clone();
          groupRef.current.worldToLocal(localPos);
          handY = localPos.y * VR_Y_SCALE - vrCenterOffsetRef.current;
        }
      }
      // Fallback to controller-type input source state
      const rightControllerState = inputSourceStates.find((s: any) => s.inputSource?.handedness === 'right' && s.type === 'controller');
      if (rightControllerState && handY === null && (rightControllerState.controller || (rightControllerState as any).object)) {
        const worldPos = new THREE.Vector3();
        // In @pmndrs/xr state.object is the three object. Some code paths also add `controller`.
        (rightControllerState.controller ?? (rightControllerState as any).object).getWorldPosition(worldPos);
        if (groupRef.current) {
          const localPos = worldPos.clone();
          groupRef.current.worldToLocal(localPos);
          const baseY = localPos.y * VR_Y_SCALE;
          handY = THREE.MathUtils.clamp(baseY - vrCenterOffsetRef.current, -maxY, maxY);
        }
      }
    }

    if (isPresenting && handY !== null) {
      rightPaddleRef.current.y = THREE.MathUtils.clamp(handY, -maxY, maxY);
    } else {
      // Desktop controls
      if (inputRef.current.rightUp) rightPaddleRef.current.y += PADDLE_SPEED * 1 / 60;
      if (inputRef.current.rightDown) rightPaddleRef.current.y -= PADDLE_SPEED * 1 / 60;
      rightPaddleRef.current.y = THREE.MathUtils.clamp(
        rightPaddleRef.current.y,
        -maxY,
        maxY
      );
    }
  });

  return null;
};
