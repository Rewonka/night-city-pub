import { create } from 'zustand';

type GameStore = {
  gameActive: boolean;
  timeLeft: number;
  winner: { id: string; score: number } | null;
  gameMessage: string;
  startGame: (timeLeft: number) => void;
  updateTimer: (timeLeft: number) => void;
  endGame: (winner: any, scores: any[]) => void;
};

export const useGameStore = create<GameStore>((set) => ({
  gameActive: false,
  timeLeft: 0,
  winner: null,
  gameMessage: 'Waiting for players...',
  
  startGame: (timeLeft) => set({
    gameActive: true,
    timeLeft,
    winner: null,
    gameMessage: 'Game Active!'
  }),
  
  updateTimer: (timeLeft) => set({ timeLeft }),
  
  endGame: (winner, scores) => set({
    gameActive: false,
    winner,
    gameMessage: winner ? `Winner: ${winner.id.slice(-4)} (${winner.score})` : 'Game Over!'
  })
}));