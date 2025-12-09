import { useFrame } from '@react-three/fiber';
import { useXRInputSourceStateContext } from '@react-three/xr';
import { useNetworkStore } from './network';
import { useRef } from 'react';
import { Vector3, Quaternion } from 'three';

export const ControllerTracker = () => {
  const updateController = useNetworkStore(state => state.updateController);
  const lastSent = useRef(0);
  
  try {
    const state = useXRInputSourceStateContext('controller');
    
    useFrame(() => {
      const now = Date.now();
      if (now - lastSent.current > 100) { // Send every 100ms
        if (state?.object3D) {
          const position = new Vector3();
          const rotation = new Quaternion();
          
          state.object3D.getWorldPosition(position);
          state.object3D.getWorldQuaternion(rotation);
          
          updateController({
            position: { x: position.x, y: position.y, z: position.z },
            rotation: { x: rotation.x, y: rotation.y, z: rotation.z, w: rotation.w }
          });
        }
        lastSent.current = now;
      }
    });
  } catch (e) {
    // No controller available (desktop mode)
  }
  
  return null;
};