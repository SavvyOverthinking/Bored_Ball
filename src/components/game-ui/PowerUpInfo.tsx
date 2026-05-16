import React from 'react';

const POWER_UPS = [
  { name: 'Coffee', marker: 'CF', color: '#8764b8', effect: 'Steady ball speed for 15s' },
  { name: 'Happy Hour', marker: 'HH', color: '#c239b3', effect: 'Wide paddle for 30s' },
  { name: 'Do Not Disturb', marker: 'DN', color: '#0078d4', effect: 'Blocks the next life loss' },
  { name: 'Reschedule', marker: 'RS', color: '#ca5010', effect: 'Clears meetings near the ball row' },
  { name: 'Calendar Cleanup', marker: 'CC', color: '#107c10', effect: 'Turns lunch-window meetings into breaks' },
  { name: 'Multi-Ball', marker: 'MB', color: '#881798', effect: 'Spawns 2 extra balls' },
];

export const PowerUpInfo: React.FC = () => {
  return (
    <div className="outlook-reference-card">
      <div className="outlook-reference-header">
        <h2>Power-ups</h2>
        <span>Add-ins</span>
      </div>
      <div className="outlook-power-grid">
        {POWER_UPS.map(powerUp => (
          <div key={powerUp.name} className="outlook-power-row">
            <span className="outlook-power-marker" style={{ borderColor: powerUp.color, color: powerUp.color }}>
              {powerUp.marker}
            </span>
            <div>
              <div className="outlook-power-title">{powerUp.name}</div>
              <div className="outlook-power-meta">{powerUp.effect}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
