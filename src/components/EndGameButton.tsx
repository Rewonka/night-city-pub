import { Text } from "@react-three/drei";

interface EndGameButtonProps {
  onClick: () => void;
}

export const EndGameButton = ({ onClick }: EndGameButtonProps) => {
  return (
    <group position={[0, -0.6, 0.2]}>
      <mesh
        onClick={onClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'default';
        }}
      >
        <boxGeometry args={[1.2, 0.4, 0.1]} />
        <meshStandardMaterial
          color={0xff3333}
          emissive={0xff3333}
          emissiveIntensity={0.5}
          metalness={0.8}
          roughness={0.3}
        />
      </mesh>
      <Text
        position={[0, 0, 0.06]}
        fontSize={0.15}
        color="#000000"
        anchorX="center"
        anchorY="middle"
      >
        END GAME
      </Text>
    </group>
  );
};
