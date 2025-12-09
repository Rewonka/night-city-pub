import { io, Socket } from 'socket.io-client';
import { create } from 'zustand';
import { DEBUG } from './config';

type Player = {
  id: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number; w: number };
  controller?: {
    position: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number; w: number };
  };
};

type NetworkStore = {
  socket: Socket | null;
  connected: boolean;
  players: Map<string, Player>;
  connect: () => void;
  disconnect: () => void;
  updatePosition: (position: { x: number; y: number; z: number }) => void;
  updateController: (controller: { position: any; rotation: any }) => void;
};

export const useNetworkStore = create<NetworkStore>((set, get) => ({
  socket: null,
  connected: false,
  players: new Map(),

  connect: () => {
    const socket = io('https://night-city-pub-production.up.railway.app');
    
    socket.on('connect', () => {
      if (DEBUG.NETWORK) console.log('[CLIENT] Connected to server:', socket.id);
      set({ connected: true });
    });

    socket.on('disconnect', () => {
      if (DEBUG.NETWORK) console.log('[CLIENT] Disconnected from server');
      set({ connected: false, players: new Map() });
    });

    socket.on('players-list', (playersList: Player[]) => {
      if (DEBUG.NETWORK) console.log('[CLIENT] Received players list:', playersList);
      const playersMap = new Map();
      playersList.forEach(player => {
        if (player.id !== socket.id) {
          playersMap.set(player.id, player);
        }
      });
      set({ players: playersMap });
    });

    socket.on('player-joined', (player: Player) => {
      if (DEBUG.NETWORK) console.log('[CLIENT] Player joined:', player.id);
      set(state => {
        const newPlayers = new Map(state.players);
        newPlayers.set(player.id, player);
        return { players: newPlayers };
      });
    });

    socket.on('player-left', (playerId: string) => {
      if (DEBUG.NETWORK) console.log('[CLIENT] Player left:', playerId);
      set(state => {
        const newPlayers = new Map(state.players);
        newPlayers.delete(playerId);
        return { players: newPlayers };
      });
    });

    socket.on('player-moved', (playerData: Player) => {
      if (DEBUG.POSITION) console.log('[CLIENT] Other player moved:', playerData.id.slice(-4), playerData.position);
      set(state => {
        const newPlayers = new Map(state.players);
        if (newPlayers.has(playerData.id)) {
          newPlayers.set(playerData.id, playerData);
        }
        return { players: newPlayers };
      });
    });



    set({ socket });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, connected: false, players: new Map() });
    }
  },

  updatePosition: (position) => {
    const { socket } = get();
    if (socket && socket.connected) {
      socket.emit('player-update', { position });
    }
  },

  updateController: (controller) => {
    const { socket } = get();
    if (socket && socket.connected) {
      socket.emit('player-update', { controller });
    }
  }
}));