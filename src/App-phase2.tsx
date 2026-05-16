import { CalendarBreakoutPhase2, Layout } from '@components/index';
import { GameHUD, MeetingTypesInfo, PowerUpInfo } from '@components/game-ui';

function App() {
  return (
    <Layout phase="2">
      <div className="relative">
        <CalendarBreakoutPhase2 />
        <GameHUD />
      </div>

      {/* Phase 2 Features Info */}
      <div className="mt-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg shadow-lg p-6 max-w-2xl border border-purple-200">
        <h2 className="text-xl font-semibold text-gray-800 mb-3" style={{ fontFamily: 'Segoe UI, sans-serif' }}>
          ✨ Phase 2 Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm" style={{ fontFamily: 'Segoe UI, sans-serif' }}>
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <div className="font-semibold text-purple-600 mb-1">📈 Gentle Start</div>
            <div className="text-gray-600 text-xs">Days 1-5: Larger paddle, slower ball, easier meetings</div>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <div className="font-semibold text-pink-600 mb-1">⚡ Daily Power-ups</div>
            <div className="text-gray-600 text-xs">One power-up per day: Coffee, Shield, Cleanup & more</div>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <div className="font-semibold text-blue-600 mb-1">🌴 Weekend Bonus</div>
            <div className="text-gray-600 text-xs">After every 5th cleared day: Email Dodge challenge for bonus points</div>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <div className="font-semibold text-orange-600 mb-1">🎯 Progressive Difficulty</div>
            <div className="text-gray-600 text-xs">Gradually harder: density, speed, boss meetings increase</div>
          </div>
        </div>
      </div>

      <MeetingTypesInfo />
      <PowerUpInfo /> {/* Added PowerUpInfo */}
    </Layout>
  );
}

export default App;
