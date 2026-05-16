import React, { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
  phase: '1' | '2';
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="office-page">
      <header className="office-page-header">
        <div>
          <div className="office-kicker">Calendar Breakout</div>
          <h1>Bored Ball</h1>
        </div>
        <div className="office-header-meta">Outlook-inspired work week</div>
      </header>

      <main className="office-page-main">{children}</main>

      <footer className="office-footer">
        Outlook-inspired design. Built with React, TypeScript, and Phaser 3.
      </footer>
    </div>
  );
};
