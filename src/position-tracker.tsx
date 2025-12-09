import { useFrame, useThree } from '@react-three/fiber';
import { useNetworkStore } from './network';
import { DEBUG } from './config';
import { useRef } from 'react';

export const PositionTracker = () => {
  const { camera } = useThree();
  const updatePosition = useNetworkStore(state => state.updatePosition);
  const lastSent = useRef(0);
  
  useFrame(() => {
    const now = Date.now();
    // Send position updates every 200ms to reduce lag
    if (now - lastSent.current > 200) {
      if (DEBUG.POSITION) {
        console.log('[CLIENT] Sending position:', {
          x: camera.position.x.toFixed(2),
          y: camera.position.y.toFixed(2),
          z: camera.position.z.toFixed(2)
        });
      }
      updatePosition({
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z
      });
      lastSent.current = now;
    }
  });
  
  return null;
};