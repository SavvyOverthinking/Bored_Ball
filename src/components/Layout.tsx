import React, { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
  phase: '1' | '2';
}

export const Layout: React.FC<LayoutProps> = ({ children, phase }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      {/* Header */}
      <div className="mb-6 text-center">
        {phase === '2' && (
          <div className="inline-block bg-gradient-to-r from-orange-500 to-pink-500 text-white px-4 py-1 rounded-full text-sm font-bold mb-3">
            🎮 PHASE 2 STAGING
          </div>
        )}
        <h1 className="text-4xl font-bold text-gray-800 mb-2" style={{ fontFamily: 'Segoe UI, sans-serif' }}>
          📅 Calendar Breakout
        </h1>
        <p className="text-gray-600 text-lg" style={{ fontFamily: 'Segoe UI, sans-serif' }}>
          Clear your Outlook calendar by destroying all meetings!
        </p>
      </div>

      {children}

      {/* Footer */}
      <footer className="mt-8 text-center text-gray-500 text-sm" style={{ fontFamily: 'Segoe UI, sans-serif' }}>
        <p>Outlook-inspired design • Built with React, TypeScript & Phaser 3</p>
        <p className="mt-1">Move your mouse to control the paddle</p>
      </footer>
    </div>
  );
};