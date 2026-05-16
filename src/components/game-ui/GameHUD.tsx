import React from 'react';
import { useGame } from '../../context/GameContext';

// Get tier name based on combo count
const getComboTier = (combo: number): { name: string; color: string } => {
  if (combo >= 50) return { name: 'Diamond', color: '#b9f2ff' };
  if (combo >= 35) return { name: 'Platinum', color: '#e5e4e2' };
  if (combo >= 20) return { name: 'Gold', color: '#ffd700' };
  if (combo >= 10) return { name: 'Silver', color: '#c0c0c0' };
  if (combo >= 5) return { name: 'Bronze', color: '#cd7f32' };
  return { name: '', color: '#ffffff' };
};

export const GameHUD: React.FC = () => {
  const { gameState } = useGame();
  const { combo, comboMultiplier } = gameState;
  const tier = getComboTier(combo);
  const isOnFire = combo >= 20 && comboMultiplier > 3.0; // On Fire has 1.5x stacking bonus

  return (
    <div className="pointer-events-none absolute top-3 left-3 right-3 z-10 flex justify-between items-center text-white text-base md:text-lg font-bold p-2 bg-black bg-opacity-55 rounded">
      <div className="flex gap-4">
        <div>Score: {gameState.score}</div>
        <div>Lives: {'❤️'.repeat(gameState.lives)}{'🖤'.repeat(Math.max(0, 3 - gameState.lives))}</div>
      </div>

      {/* Combo Display */}
      {combo > 0 && (
        <div
          className={`flex items-center gap-2 px-3 py-1 rounded-full transition-all duration-200 ${
            isOnFire ? 'animate-pulse bg-orange-600' : 'bg-gray-700'
          }`}
          style={{ color: isOnFire ? '#ff4500' : tier.color }}
        >
          <span className="text-sm">
            {combo} Hit{combo > 1 ? 's' : ''}
            {tier.name && ` ${tier.name}`}
          </span>
          {comboMultiplier > 1 && (
            <span className="text-xs bg-black bg-opacity-40 px-2 py-0.5 rounded">
              {comboMultiplier.toFixed(1)}x
            </span>
          )}
          {isOnFire && <span className="text-lg">🔥</span>}
        </div>
      )}

      <div>Day: {gameState.week}</div>

      {/* Power-up Status */}
      {gameState.powerUpStatus && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-yellow-500 text-black px-3 py-1 rounded-full text-sm whitespace-nowrap">
          {gameState.powerUpStatus}
        </div>
      )}
    </div>
  );
};
