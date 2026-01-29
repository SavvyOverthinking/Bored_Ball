import React from 'react';

interface MeetingTypeDisplay {
  name: string;
  color: string;
  hits: number;
  effect: string;
  minWeek?: number;
}

const MEETING_TYPES: MeetingTypeDisplay[] = [
  { name: '1:1', color: '#5c6bc0', hits: 2, effect: '+10% speed' },
  { name: 'Team', color: '#4caf50', hits: 2, effect: 'Split ball' },
  { name: 'Boss', color: '#e53935', hits: 3, effect: 'Speed x1.8!' },
  { name: 'Lunch', color: '#fbc02d', hits: 1, effect: 'Normalize speed' },
  { name: 'Personal', color: '#8e24aa', hits: 1, effect: 'Reset bounce' },
  { name: 'Sticky', color: '#9E9E9E', hits: 1, effect: 'Ball sticks 0.5s' },
  // New types
  { name: 'Recurring', color: '#2e7d32', hits: 2, effect: 'Spawns follow-up', minWeek: 15 },
  { name: 'All-Hands', color: '#ff6d00', hits: 5, effect: 'Damages adjacent', minWeek: 25 },
  { name: 'Focus', color: '#00897b', hits: 1, effect: '+50% score 5s' },
  { name: 'Emergency', color: '#d32f2f', hits: 2, effect: '8s timer!', minWeek: 30 },
  { name: 'Optional', color: '#78909c', hits: 1, effect: '3x points' },
];

export const MeetingTypesInfo: React.FC = () => {
  return (
    <div className="mt-4 bg-white rounded-lg shadow-lg p-6 max-w-2xl border border-gray-200">
      <h2 className="text-xl font-semibold text-gray-800 mb-3" style={{ fontFamily: 'Segoe UI, sans-serif' }}>
        Meeting Types & Effects
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm" style={{ fontFamily: 'Segoe UI, sans-serif' }}>
        {MEETING_TYPES.map((type) => (
          <div key={type.name} className="flex items-center gap-3">
            <div
              className="w-4 h-4 rounded flex-shrink-0"
              style={{
                backgroundColor: type.color,
                border: type.name === 'Optional' ? '2px dashed #455a64' : undefined
              }}
            />
            <div className="min-w-0">
              <span className="font-semibold">{type.name}</span>
              <span className="text-gray-500"> - {type.hits} hit{type.hits > 1 ? 's' : ''}</span>
              <div className="text-xs text-gray-600 truncate">{type.effect}</div>
              {type.minWeek && (
                <div className="text-xs text-blue-500">Week {type.minWeek}+</div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          <strong>Combo System:</strong> Hit blocks without touching paddle to build multiplier (up to 5x Diamond!)
        </p>
      </div>
    </div>
  );
};
