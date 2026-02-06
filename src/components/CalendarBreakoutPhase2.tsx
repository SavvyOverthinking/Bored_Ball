import { PhaserGameContainer } from './PhaserGameContainer';
import { MainScenePhase2 } from '@game/scenes/MainScenePhase2';
import WeekendStageScene from '@game/scenes/WeekendStageScene';
import { curve } from '@game/utils/levelCurve';
import FLAGS from '@config/flags';

export function CalendarBreakoutPhase2() {
  // Get proper tuning from curve function for week 1
  // This ensures paddle scale and speed are correct for arcade progression
  const initialSceneData = {
    week: 1,
    score: 0,
    lives: 3,
    tuning: curve(1) // Week 1: Big paddle (1.4x), slow ball (200 px/s)
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      {/* Phase 2 Header */}
      <div className="mb-6 text-center">
        <div className="inline-block bg-gradient-to-r from-orange-500 to-pink-500 text-white px-4 py-1 rounded-full text-sm font-bold mb-3">
          🎮 PHASE 2 STAGING
        </div>
        <h1 className="text-4xl font-bold text-gray-800 mb-2" style={{ fontFamily: 'Segoe UI, sans-serif' }}>
          📅 Calendar Breakout
        </h1>
        <p className="text-gray-600 text-lg" style={{ fontFamily: 'Segoe UI, sans-serif' }}>
          Clear your Outlook calendar by destroying all meetings!
        </p>
      </div>

      <PhaserGameContainer 
        scenes={[MainScenePhase2, WeekendStageScene]} 
        initialSceneData={initialSceneData}
      />

      {/* Phase 2 Features Info */}
      <div className="mt-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg shadow-lg p-6 max-w-2xl border border-purple-200">
        <h2 className="text-xl font-semibold text-gray-800 mb-3" style={{ fontFamily: 'Segoe UI, sans-serif' }}>
          ✨ Phase 2 Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm" style={{ fontFamily: 'Segoe UI, sans-serif' }}>
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <div className="font-semibold text-purple-600 mb-1">📈 Gentle Start</div>
            <div className="text-gray-600 text-xs">Weeks 1-5: Larger paddle, slower ball, easier meetings</div>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <div className="font-semibold text-pink-600 mb-1">⚡ Weekly Power-ups</div>
            <div className="text-gray-600 text-xs">One power-up per week: Coffee, Shield, Cleanup & more</div>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <div className="font-semibold text-blue-600 mb-1">🌴 Weekend Bonus</div>
            <div className="text-gray-600 text-xs">Every 5th week: Email Dodge challenge for bonus points</div>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <div className="font-semibold text-orange-600 mb-1">🎯 Progressive Difficulty</div>
            <div className="text-gray-600 text-xs">Gradually harder: density, speed, boss meetings increase</div>
          </div>
        </div>
      </div>

      {/* Meeting Types Reference */}
      <div className="mt-4 bg-white rounded-lg shadow-lg p-6 max-w-2xl border border-gray-200">
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
      </div>

      {/* Footer */}
      <footer className="mt-8 text-center text-gray-500 text-sm" style={{ fontFamily: 'Segoe UI, sans-serif' }}>
        <p>Phase 2 Staging Build • {FLAGS.PHASE2 ? '✅ ENABLED' : '❌ DISABLED'}</p>
        <p className="mt-1">Outlook-inspired design • Built with React, TypeScript & Phaser 3</p>
        <p className="mt-1">Move your mouse to control the paddle</p>
      </footer>
    </div>
  );
}