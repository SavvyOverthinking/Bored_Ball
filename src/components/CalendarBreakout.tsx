import { PhaserGameContainer } from './PhaserGameContainer';
import { MainScene } from '@game/scenes/MainScene';

export function CalendarBreakout() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="mb-6 text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-2" style={{ fontFamily: 'Segoe UI, sans-serif' }}>
          📅 Calendar Breakout
        </h1>
        <p className="text-gray-600 text-lg" style={{ fontFamily: 'Segoe UI, sans-serif' }}>
          Clear your Outlook calendar by destroying all meetings!
        </p>
      </div>

      <PhaserGameContainer scenes={[MainScene]} />

      <div className="mt-6 bg-white rounded-lg shadow-lg p-6 max-w-2xl border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 mb-3" style={{ fontFamily: 'Segoe UI, sans-serif' }}>
          Meeting Types & Effects
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm" style={{ fontFamily: 'Segoe UI, sans-serif' }}>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#5c6bc0' }}></div>
            <div>
              <span className="font-semibold">1:1</span> - 2 hits, +10% speed
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#4caf50' }}></div>
            <div>
              <span className="font-semibold">Team</span> - 2 hits, Split ball
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#e53935' }}></div>
            <div>
              <span className="font-semibold">Boss</span> - 3 hits, Speed ×1.8
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#fbc02d' }}></div>
            <div>
              <span className="font-semibold">Lunch</span> - 1 hit, Normalize speed
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#8e24aa' }}></div>
            <div>
              <span className="font-semibold">Personal</span> - 1 hit, Reset bounce
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            <strong>New:</strong> 36 meetings with 15-min slots & double bookings • Max 3 balls • 52 weeks to clear
          </p>
        </div>
      </div>

      <footer className="mt-8 text-center text-gray-500 text-sm" style={{ fontFamily: 'Segoe UI, sans-serif' }}>
        <p>Outlook-inspired design • Built with React, TypeScript & Phaser 3</p>
        <p className="mt-1">Move your mouse to control the paddle</p>
      </footer>
    </div>
  );
}