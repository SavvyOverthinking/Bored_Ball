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
      backgroundColor: '#fafbfc',
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    };

    phaserGameRef.current = new Phaser.Game(config);

    // If initial scene data is provided, start the first scene with it
    if (initialSceneData && scenes.length > 0) {
      phaserGameRef.current.events.once('ready', () => {
        // Get scene key from the first scene class
        const FirstScene = scenes[0];
        const tempInstance = new FirstScene();
        const sceneKey = tempInstance.sys?.settings?.key || 'default';

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
      className="shadow-2xl rounded-lg overflow-hidden bg-white border border-gray-200"
      style={{ maxWidth: '900px', width: '100%' }}
    />
  );
};

export default PhaserGameContainer;
