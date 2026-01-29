import React from 'react';
import { useGame } from '../../context/GameContext'; // Adjust path as needed

export const GameHUD: React.FC = () => {
  const { gameState } = useGame();

  return (
    <div className="absolute top-4 left-4 right-4 flex justify-between text-white text-lg font-bold p-2 bg-black bg-opacity-50 rounded">
      <div>Score: {gameState.score}</div>
      <div>Lives: {gameState.lives}</div>
      <div>Week: {gameState.week}</div>
      {gameState.powerUpStatus && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-yellow-500 text-black px-3 py-1 rounded-full text-sm">
          {gameState.powerUpStatus}
        </div>
      )}
    </div>
  );
};
