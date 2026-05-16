import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { getBoardDimensions } from '@game/utils/calendarGenerator';
import { GameEventBus } from '@game/systems/GameEventBus';

interface PhaserGameContainerProps {
  scenes: (typeof Phaser.Scene)[];
  initialSceneData?: Record<string, unknown>;
}

/**
 * PhaserGameContainer - React wrapper for Phaser game instance
 *
 * This component creates and manages a Phaser game instance.
 * State synchronization with React is handled via GameEventBus (not callbacks).
 */
export const PhaserGameContainer: React.FC<PhaserGameContainerProps> = ({
  scenes,
  initialSceneData
}) => {
  const gameRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!gameRef.current) return;

    const { width, height } = getBoardDimensions();

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width,
      height,
      parent: gameRef.current,
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false,
        },
      },
      scene: scenes,
      backgroundColor: '#ffffff',
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    };

    phaserGameRef.current = new Phaser.Game(config);

    // If initial scene data is provided, restart the first scene with data
    if (initialSceneData && scenes.length > 0) {
      phaserGameRef.current.events.once('ready', () => {
        // The scene key is 'CalendarScenePhase2' (from MainScenePhase2 constructor)
        // Phaser auto-starts the first scene, but without data
        // We need to restart it with our initial data
        const sceneKey = 'CalendarScenePhase2';

        console.log('🎮 Starting scene with data:', initialSceneData);
        phaserGameRef.current?.scene.start(sceneKey, initialSceneData);
      });
    }

    return () => {
      // Clean up event bus listeners on unmount
      GameEventBus.destroy();

      if (phaserGameRef.current) {
        phaserGameRef.current.destroy(true);
        phaserGameRef.current = null;
      }
    };
  }, [scenes, initialSceneData]);

  return (
    <div
      ref={gameRef}
      className="outlook-canvas-frame"
      style={{ maxWidth: '900px', width: '100%' }}
    />
  );
};

export default PhaserGameContainer;
