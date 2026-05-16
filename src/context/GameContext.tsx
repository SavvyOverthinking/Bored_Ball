import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { gameEventBus, GameEvents } from '@game/systems/GameEventBus';
import { getInitialDay } from '@game/utils/dayProgression';

// Define the shape of our game state
export interface GameState {
  score: number;
  lives: number;
  week: number;
  isPaused: boolean;
  gameOver: boolean;
  powerUpStatus: string | null;
  combo: number;
  comboMultiplier: number;
}

// Define the shape of the context actions
interface GameContextType {
  gameState: GameState;
  updateGameState: (newState: Partial<GameState>) => void;
  resetGameState: () => void;
}

const initialGameState: GameState = {
  score: 0,
  lives: 3,
  week: getInitialDay(),
  isPaused: false,
  gameOver: false,
  powerUpStatus: null,
  combo: 0,
  comboMultiplier: 1,
};

// Create the context with a default undefined value
const GameContext = createContext<GameContextType | undefined>(undefined);

// Provider component to wrap around the application
export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [gameState, setGameState] = useState<GameState>(initialGameState);

  const updateGameState = useCallback((newState: Partial<GameState>) => {
    setGameState(prevState => ({ ...prevState, ...newState }));
  }, []);

  const resetGameState = useCallback(() => {
    setGameState(initialGameState);
  }, []);

  // Subscribe to game events from Phaser
  useEffect(() => {
    const handleScoreUpdate = (payload: GameEvents['SCORE_UPDATE']) => {
      setGameState(prev => ({ ...prev, score: payload.score }));
    };

    const handleLivesUpdate = (payload: GameEvents['LIVES_UPDATE']) => {
      setGameState(prev => ({ ...prev, lives: payload.lives }));
    };

    const handleWeekUpdate = (payload: GameEvents['WEEK_UPDATE']) => {
      setGameState(prev => ({ ...prev, week: payload.week }));
    };

    const handlePowerUpStatus = (payload: GameEvents['POWERUP_STATUS']) => {
      setGameState(prev => ({ ...prev, powerUpStatus: payload.status }));
    };

    const handleGamePause = (payload: GameEvents['GAME_PAUSE']) => {
      setGameState(prev => ({ ...prev, isPaused: payload.isPaused }));
    };

    const handleGameOver = (payload: GameEvents['GAME_OVER']) => {
      setGameState(prev => ({ ...prev, gameOver: payload.gameOver }));
    };

    const handleComboUpdate = (payload: GameEvents['COMBO_UPDATE']) => {
      setGameState(prev => ({
        ...prev,
        combo: payload.combo,
        comboMultiplier: payload.multiplier,
      }));
    };

    // Subscribe to all game events
    gameEventBus.onGameEvent('SCORE_UPDATE', handleScoreUpdate);
    gameEventBus.onGameEvent('LIVES_UPDATE', handleLivesUpdate);
    gameEventBus.onGameEvent('WEEK_UPDATE', handleWeekUpdate);
    gameEventBus.onGameEvent('POWERUP_STATUS', handlePowerUpStatus);
    gameEventBus.onGameEvent('GAME_PAUSE', handleGamePause);
    gameEventBus.onGameEvent('GAME_OVER', handleGameOver);
    gameEventBus.onGameEvent('COMBO_UPDATE', handleComboUpdate);

    // Cleanup subscriptions on unmount
    return () => {
      gameEventBus.offGameEvent('SCORE_UPDATE', handleScoreUpdate);
      gameEventBus.offGameEvent('LIVES_UPDATE', handleLivesUpdate);
      gameEventBus.offGameEvent('WEEK_UPDATE', handleWeekUpdate);
      gameEventBus.offGameEvent('POWERUP_STATUS', handlePowerUpStatus);
      gameEventBus.offGameEvent('GAME_PAUSE', handleGamePause);
      gameEventBus.offGameEvent('GAME_OVER', handleGameOver);
      gameEventBus.offGameEvent('COMBO_UPDATE', handleComboUpdate);
    };
  }, []);

  return (
    <GameContext.Provider value={{ gameState, updateGameState, resetGameState }}>
      {children}
    </GameContext.Provider>
  );
};

// Custom hook to use the game context
export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
