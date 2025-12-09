import { useNetworkStore } from './network';

const PlayerAvatar = ({ player }: { player: any }) => {
  
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
      
      {/* Controller */}
      {player.controller && (
        <mesh 
          position={[
            player.controller.position.x - player.position.x,
            player.controller.position.y - player.position.y,
            player.controller.position.z - player.position.z
          ]}
        >
          <boxGeometry args={[0.05, 0.05, 0.15]} />
          <meshStandardMaterial color="cyan" emissive="cyan" emissiveIntensity={0.5} />
        </mesh>
      )}
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