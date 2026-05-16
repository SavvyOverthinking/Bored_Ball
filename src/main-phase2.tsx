import ReactDOM from 'react-dom/client';
import App from './App-phase2';
import './styles/index.css';
import FLAGS from '@config/flags';
import { GameProvider } from './context/GameContext';

// Verify Phase 2 is enabled
if (!FLAGS.PHASE2) {
  console.error('Phase 2 requires VITE_PHASE2=1 environment variable');
}

console.log('🎮 Calendar Breakout - Phase 2 (STAGING)');
console.log('✨ Features: Level Curve, Daily Power-ups, Weekend Dodge Mode');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <GameProvider>
    <App />
  </GameProvider>
);

