import { Text } from "@react-three/drei";

interface ScoreboardProps {
  leftScore: number;
  rightScore: number;
}

export const Scoreboard = ({ leftScore, rightScore }: ScoreboardProps) => {
  return (
    <group position={[0, 1.35, 0.25]}>
      <Text
        fontSize={0.32}
        color="#00ffff"
        anchorX="center"
        anchorY="middle"
        outlineColor="#001824"
        outlineWidth={0.025}
      >
        {leftScore}   :   {rightScore}
      </Text>
    </group>
  );
};
