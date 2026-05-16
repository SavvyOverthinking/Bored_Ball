import React from 'react';

interface MeetingTypeDisplay {
  name: string;
  color: string;
  hits: number;
  effect: string;
  minWeek?: number;
}

const MEETING_TYPES: MeetingTypeDisplay[] = [
  { name: '1:1', color: '#0078d4', hits: 2, effect: '+10% speed' },
  { name: 'Team', color: '#107c10', hits: 2, effect: 'Split ball', minWeek: 4 },
  { name: 'Boss', color: '#c50f1f', hits: 3, effect: 'Speed x1.8', minWeek: 6 },
  { name: 'Lunch', color: '#f2c811', hits: 1, effect: 'Normalize speed', minWeek: 3 },
  { name: 'Personal', color: '#8764b8', hits: 1, effect: 'Reset bounce' },
  { name: 'Sticky', color: '#8a8886', hits: 1, effect: 'Ball sticks', minWeek: 8 },
  { name: 'Recurring', color: '#0b6a0b', hits: 2, effect: 'Follow-up', minWeek: 13 },
  { name: 'All-Hands', color: '#ca5010', hits: 5, effect: 'Adjacent damage', minWeek: 18 },
  { name: 'Focus', color: '#038387', hits: 1, effect: '+50% score', minWeek: 10 },
  { name: 'Emergency', color: '#a4262c', hits: 2, effect: '8s timer', minWeek: 21 },
  { name: 'Optional', color: '#69797e', hits: 1, effect: '3x points', minWeek: 9 },
];

export const MeetingTypesInfo: React.FC = () => {
  return (
    <div className="outlook-reference-card">
      <div className="outlook-reference-header">
        <h2>Meeting Legend</h2>
        <span>Types</span>
      </div>
      <div className="outlook-legend-grid">
        {MEETING_TYPES.map((type) => (
          <div key={type.name} className="outlook-legend-row">
            <span
              className="outlook-legend-swatch"
              style={{
                backgroundColor: type.color,
                borderStyle: type.name === 'Optional' ? 'dashed' : 'solid',
              }}
            />
            <div>
              <div className="outlook-legend-title">
                {type.name}
                <span>{type.hits} hit{type.hits > 1 ? 's' : ''}</span>
              </div>
              <div className="outlook-legend-meta">
                {type.effect}{type.minWeek ? `, Day ${type.minWeek}+` : ''}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
