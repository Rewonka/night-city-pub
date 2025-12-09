import { MeshReflectorMaterial } from "@react-three/drei";

export const Floor = () => {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[20, 20]} />
      <MeshReflectorMaterial
        color="#1a1a1a"
        metalness={0.5}
        roughness={0.4}
        blur={[400, 100]}
        mixBlur={1}
        mixStrength={0.5}
        mirror={0.3}
        resolution={512}
      />
    </mesh>
  );
};
