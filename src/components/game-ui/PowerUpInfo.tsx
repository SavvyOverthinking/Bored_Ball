import React from 'react';

const POWER_UPS = [
  { name: 'Coffee', icon: '☕', color: 'text-purple-600', effect: 'Steady ball speed for 15s' },
  { name: 'Happy Hour', icon: '🍻', color: 'text-pink-600', effect: 'Wide paddle for 30s' },
  { name: 'Do Not Disturb', icon: '🛡️', color: 'text-blue-600', effect: 'Blocks the next life loss' },
  { name: 'Reschedule', icon: '📅', color: 'text-orange-600', effect: 'Clears meetings near the ball row' },
  { name: 'Calendar Cleanup', icon: '🧹', color: 'text-green-600', effect: 'Turns 3 meetings into real lunch breaks' },
  { name: 'Multi-Ball', icon: '💥', color: 'text-fuchsia-600', effect: 'Spawns 2 extra balls' },
];

export const PowerUpInfo: React.FC = () => {
  return (
    <div className="mt-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg shadow-lg p-6 max-w-2xl border border-purple-200">
      <h2 className="text-xl font-semibold text-gray-800 mb-3" style={{ fontFamily: 'Segoe UI, sans-serif' }}>
        ✨ Power-ups
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm" style={{ fontFamily: 'Segoe UI, sans-serif' }}>
        {POWER_UPS.map(powerUp => (
          <div key={powerUp.name} className="bg-white p-3 rounded-lg shadow-sm">
            <div className={`font-semibold mb-1 ${powerUp.color}`}>
              {powerUp.icon} {powerUp.name}
            </div>
            <div className="text-gray-600 text-xs">{powerUp.effect}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
