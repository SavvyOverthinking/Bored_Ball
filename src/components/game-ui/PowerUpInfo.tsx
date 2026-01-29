import React from 'react';

export const PowerUpInfo: React.FC = () => {
  return (
    <div className="mt-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg shadow-lg p-6 max-w-2xl border border-purple-200">
      <h2 className="text-xl font-semibold text-gray-800 mb-3" style={{ fontFamily: 'Segoe UI, sans-serif' }}>
        ✨ Power-ups
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm" style={{ fontFamily: 'Segoe UI, sans-serif' }}>
        <div className="bg-white p-3 rounded-lg shadow-sm">
          <div className="font-semibold text-purple-600 mb-1">☕ Coffee</div>
          <div className="text-gray-600 text-xs">Steady ball speed (prevents chaos) for 15s</div>
        </div>
        <div className="bg-white p-3 rounded-lg shadow-sm">
          <div className="font-semibold text-pink-600 mb-1">🍻 Happy Hour</div>
          <div className="text-gray-600 text-xs">Wide paddle (1.4× size) for 30s</div>
        </div>
        <div className="bg-white p-3 rounded-lg shadow-sm">
          <div className="font-semibold text-blue-600 mb-1">🛡️ Do Not Disturb</div>
          <div className="text-gray-600 text-xs">Free shield (blocks next life loss)</div>
        </div>
        <div className="bg-white p-3 rounded-lg shadow-sm">
          <div className="font-semibold text-orange-600 mb-1">📅 Reschedule</div>
          <div className="text-gray-600 text-xs">Clears all meetings in current hour</div>
        </div>
        <div className="bg-white p-3 rounded-lg shadow-sm">
          <div className="font-semibold text-green-600 mb-1">🧹 Calendar Cleanup</div>
          <div className="text-gray-600 text-xs">Softens 3 meetings to lunch breaks</div>
        </div>
        {/* NEW: Multi-Ball Power-up */}
        <div className="bg-white p-3 rounded-lg shadow-sm">
          <div className="font-semibold text-magenta-600 mb-1">💥 Multi-Ball</div>
          <div className="text-gray-600 text-xs">Spawn 2 extra balls</div>
        </div>
      </div>
    </div>
  );
};