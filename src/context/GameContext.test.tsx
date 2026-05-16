import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// Mock Phaser before importing modules that depend on it
type EventCallback = (...args: unknown[]) => void;

vi.mock('phaser', () => ({
  default: {
    Events: {
      EventEmitter: class MockEventEmitter {
        private listeners = new Map<string, Set<EventCallback>>();

        on(event: string, fn: EventCallback) {
          if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
          }
          this.listeners.get(event)!.add(fn);
          return this;
        }

        off(event: string, fn: EventCallback) {
          this.listeners.get(event)?.delete(fn);
          return this;
        }

        emit(event: string, ...args: unknown[]) {
          this.listeners.get(event)?.forEach(fn => fn(...args));
          return true;
        }
      }
    }
  }
}));

import { GameProvider, useGame } from './GameContext';

// A test component to consume the context
const TestComponent: React.FC = () => {
  const { gameState, updateGameState } = useGame();

  return (
    <div>
      <div data-testid="score">Score: {gameState.score}</div>
      <div data-testid="lives">Lives: {gameState.lives}</div>
      <div data-testid="week">Day: {gameState.week}</div>
      <div data-testid="isPaused">Paused: {gameState.isPaused.toString()}</div>
      <div data-testid="gameOver">GameOver: {gameState.gameOver.toString()}</div>
      <div data-testid="powerUpStatus">PowerUp: {gameState.powerUpStatus || 'None'}</div>
      <button onClick={() => updateGameState({ score: 100 })}>Update Score</button>
      <button onClick={() => updateGameState({ isPaused: true })}>Pause Game</button>
    </div>
  );
};

describe('GameContext', () => {
  it('provides initial game state', () => {
    render(
      <GameProvider>
        <TestComponent />
      </GameProvider>
    );

    expect(screen.getByTestId('score')).toHaveTextContent('Score: 0');
    expect(screen.getByTestId('lives')).toHaveTextContent('Lives: 3');
    expect(screen.getByTestId('week')).toHaveTextContent('Day: 1');
    expect(screen.getByTestId('isPaused')).toHaveTextContent('Paused: false');
    expect(screen.getByTestId('gameOver')).toHaveTextContent('GameOver: false');
    expect(screen.getByTestId('powerUpStatus')).toHaveTextContent('PowerUp: None');
  });

  it('updates game state correctly', () => {
    render(
      <GameProvider>
        <TestComponent />
      </GameProvider>
    );

    const updateScoreButton = screen.getByText('Update Score');
    act(() => {
      updateScoreButton.click();
    });
    expect(screen.getByTestId('score')).toHaveTextContent('Score: 100');

    const pauseGameButton = screen.getByText('Pause Game');
    act(() => {
      pauseGameButton.click();
    });
    expect(screen.getByTestId('isPaused')).toHaveTextContent('Paused: true');
  });

  it('throws error when useGame is not used within GameProvider', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => render(<TestComponent />)).toThrow('useGame must be used within a GameProvider');
    
    consoleErrorSpy.mockRestore();
  });
});
