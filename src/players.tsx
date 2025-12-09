import { useNetworkStore } from './network';
import { useGLTF } from '@react-three/drei';

const PlayerAvatar = ({ player }: { player: any }) => {
  const { scene } = useGLTF('assets/blaster.glb');
  
  return (
    <group position={[player.position.x, player.position.y, player.position.z]}>
      {/* Head */}
      <mesh position={[0, 0.1, 0]}>
        <sphereGeometry args={[0.1]} />
        <meshStandardMaterial color="blue" />
      </mesh>
      {/* Body */}
      <mesh position={[0, -0.2, 0]}>
        <boxGeometry args={[0.3, 0.4, 0.1]} />
        <meshStandardMaterial color="darkblue" />
      </mesh>
      
      {/* Gun/Controller - Always show */}
      <group 
        position={[
          player.controller ? (player.controller.position.x - player.position.x) : 0.2,
          player.controller ? (player.controller.position.y - player.position.y) : -0.3,
          player.controller ? (player.controller.position.z - player.position.z) : -0.2
        ]}
        quaternion={player.controller ? [
          player.controller.rotation.x,
          player.controller.rotation.y,
          player.controller.rotation.z,
          player.controller.rotation.w
        ] : [0, 0, 0, 1]}
      >
        <primitive object={scene.clone()} scale={0.5} />
      </group>
    </group>
  );
};

export const OtherPlayers = () => {
  const players = useNetworkStore(state => state.players);
  
  return (
    <>
      {Array.from(players.values()).map(player => (
        <PlayerAvatar key={player.id} player={player} />
      ))}
    </>
  );
};