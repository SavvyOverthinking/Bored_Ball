import React from 'react';
import { useGame } from '../../context/GameContext';
import { CAMPAIGN_TOTAL_DAYS } from '@game/utils/campaign';

const getComboTier = (combo: number): { name: string; color: string } => {
  if (combo >= 50) return { name: 'Diamond', color: '#0078d4' };
  if (combo >= 35) return { name: 'Platinum', color: '#64748b' };
  if (combo >= 20) return { name: 'Gold', color: '#b45309' };
  if (combo >= 10) return { name: 'Silver', color: '#605e5c' };
  if (combo >= 5) return { name: 'Bronze', color: '#8a4b16' };
  return { name: '', color: '#605e5c' };
};

export const GameHUD: React.FC = () => {
  const { gameState } = useGame();
  const { combo, comboMultiplier } = gameState;
  const tier = getComboTier(combo);
  const isOnFire = combo >= 20 && comboMultiplier > 3.0;
  const lifeSlots = Array.from({ length: 3 }, (_, index) => index < gameState.lives);

  return (
    <div className="outlook-hud" role="status" aria-live="polite">
      <div className="outlook-hud-group">
        <div className="outlook-hud-primary">Day {gameState.week}/{CAMPAIGN_TOTAL_DAYS}</div>
        <div className="outlook-hud-stat">
          <span>Score</span>
          <strong>{gameState.score}</strong>
        </div>
        <div className="outlook-hud-stat">
          <span>Lives</span>
          <div className="outlook-life-row" aria-label={`${gameState.lives} lives`}>
            {lifeSlots.map((filled, index) => (
              <span
                key={index}
                className={`outlook-life-dot ${filled ? 'is-filled' : ''}`}
                aria-hidden="true"
              />
            ))}
          </div>
        </div>
      </div>

      {combo > 0 && (
        <div className={`outlook-combo ${isOnFire ? 'is-hot' : ''}`} style={{ borderColor: tier.color }}>
          <span style={{ color: tier.color }}>
            {combo} hit{combo > 1 ? 's' : ''}{tier.name ? ` ${tier.name}` : ''}
          </span>
          {comboMultiplier > 1 && <strong>{comboMultiplier.toFixed(1)}x</strong>}
        </div>
      )}

      {gameState.powerUpStatus && (
        <div className="outlook-power-status">
          {gameState.powerUpStatus}
        </div>
      )}
    </div>
  );
};
