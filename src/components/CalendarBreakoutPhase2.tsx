import { PhaserGameContainer } from './PhaserGameContainer';
import { MainScenePhase2 } from '@game/scenes/MainScenePhase2';
import WeekendStageScene from '@game/scenes/WeekendStageScene';
import { curve } from '@game/utils/levelCurve';

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
    <>
      <PhaserGameContainer 
        scenes={[MainScenePhase2, WeekendStageScene]} 
        initialSceneData={initialSceneData}
      />
    </>
  );
}
