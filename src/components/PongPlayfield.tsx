import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useXR } from "@react-three/xr";
import * as THREE from "three";

export const PongPlayfield = () => {
  const fieldWidth = 3;
  const fieldHeight = 2;
  const frameThickness = 0.02;
  const paddleWidth = 0.08;
  const paddleHeight = 0.4;
  const ballRadius = 0.05;

  const leftPaddleRef = useRef<THREE.Mesh>(null);
  const rightPaddleRef = useRef<THREE.Mesh>(null);
  const ballRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  const { controllers } = useXR();

  useFrame(() => {
    if (!leftPaddleRef.current || !rightPaddleRef.current || !ballRef.current || !groupRef.current) return;

    const maxY = fieldHeight / 2 - paddleHeight / 2;

    // Right paddle - controlled by right controller
    const rightController = controllers?.find((c: any) => c.inputSource?.handedness === "right");
    if (rightController) {
      const worldPos = new THREE.Vector3();
      rightController.controller.getWorldPosition(worldPos);
      
      const localPos = groupRef.current.worldToLocal(worldPos.clone());
      rightPaddleRef.current.position.y = THREE.MathUtils.clamp(localPos.y, -maxY, maxY);
    }

    // Left paddle - simple AI tracking ball
    const targetY = THREE.MathUtils.clamp(ballRef.current.position.y, -maxY, maxY);
    leftPaddleRef.current.position.y = THREE.MathUtils.lerp(
      leftPaddleRef.current.position.y,
      targetY,
      0.05
    );
  });

  return (
    <group ref={groupRef} position={[0, 1.6, -2]}>
      {/* Glass background */}
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[fieldWidth, fieldHeight]} />
        <meshPhysicalMaterial
          color="#001a1a"
          transparent
          opacity={0.1}
          metalness={0.1}
          roughness={0.1}
          transmission={0.9}
          thickness={0.5}
        />
      </mesh>

      {/* Frame - top */}
      <mesh position={[0, fieldHeight / 2, 0]}>
        <boxGeometry args={[fieldWidth, frameThickness, frameThickness]} />
        <meshStandardMaterial
          color="#00ffff"
          emissive="#00ffff"
          emissiveIntensity={4}
        />
      </mesh>
      {/* Frame - bottom */}
      <mesh position={[0, -fieldHeight / 2, 0]}>
        <boxGeometry args={[fieldWidth, frameThickness, frameThickness]} />
        <meshStandardMaterial
          color="#00ffff"
          emissive="#00ffff"
          emissiveIntensity={4}
        />
      </mesh>
      {/* Frame - left */}
      <mesh position={[-fieldWidth / 2, 0, 0]}>
        <boxGeometry args={[frameThickness, fieldHeight, frameThickness]} />
        <meshStandardMaterial
          color="#00ffff"
          emissive="#00ffff"
          emissiveIntensity={4}
        />
      </mesh>
      {/* Frame - right */}
      <mesh position={[fieldWidth / 2, 0, 0]}>
        <boxGeometry args={[frameThickness, fieldHeight, frameThickness]} />
        <meshStandardMaterial
          color="#00ffff"
          emissive="#00ffff"
          emissiveIntensity={4}
        />
      </mesh>

      {/* Center dashed line */}
      {Array.from({ length: 10 }).map((_, i) => (
        <mesh key={i} position={[0, -fieldHeight / 2 + (i * fieldHeight) / 9 + 0.05, 0]}>
          <boxGeometry args={[frameThickness, 0.08, frameThickness]} />
          <meshStandardMaterial
            color="#00ffff"
            emissive="#00ffff"
            emissiveIntensity={2}
            transparent
            opacity={0.6}
          />
        </mesh>
      ))}

      {/* Left paddle */}
      <mesh ref={leftPaddleRef} position={[-fieldWidth / 2 + 0.2, 0, 0]}>
        <boxGeometry args={[paddleWidth, paddleHeight, frameThickness]} />
        <meshStandardMaterial
          color="#00ffff"
          emissive="#00ffff"
          emissiveIntensity={4}
        />
      </mesh>

      {/* Right paddle */}
      <mesh ref={rightPaddleRef} position={[fieldWidth / 2 - 0.2, 0, 0]}>
        <boxGeometry args={[paddleWidth, paddleHeight, frameThickness]} />
        <meshStandardMaterial
          color="#00ffff"
          emissive="#00ffff"
          emissiveIntensity={4}
        />
      </mesh>

      {/* Ball */}
      <mesh ref={ballRef} position={[0, 0, 0]}>
        <sphereGeometry args={[ballRadius, 16, 16]} />
        <meshStandardMaterial
          color="#00ffff"
          emissive="#00ffff"
          emissiveIntensity={6}
        />
      </mesh>
    </group>
  );
};
