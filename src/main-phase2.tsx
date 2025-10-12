import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App-phase2.tsx';
import './index.css';
import FLAGS from './config/flags';

// Verify Phase 2 is enabled
if (!FLAGS.PHASE2) {
  console.error('Phase 2 requires VITE_PHASE2=1 environment variable');
}

console.log('🎮 Calendar Breakout - Phase 2 (STAGING)');
console.log('✨ Features: Level Curve, Weekly Power-ups, Weekend Dodge Mode');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

