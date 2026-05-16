import { PhaserGameContainer } from './PhaserGameContainer';
import { MainScenePhase2 } from '@game/scenes/MainScenePhase2';
import WeekendStageScene from '@game/scenes/WeekendStageScene';
import { curve } from '@game/utils/levelCurve';
import { getInitialDay } from '@game/utils/dayProgression';

export function CalendarBreakoutPhase2() {
  const initialDay = getInitialDay();

  // Get proper tuning from curve function for the first board.
  // This ensures paddle scale and speed are correct for arcade progression
  const initialSceneData = {
    week: initialDay,
    score: 0,
    lives: 3,
    tuning: curve(initialDay)
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
