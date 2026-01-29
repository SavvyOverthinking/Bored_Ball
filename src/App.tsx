import { CalendarBreakout, Layout } from '@components/index';
import { GameHUD, MeetingTypesInfo } from '@components/game-ui';

function App() {
  return (
    <Layout phase="1">
      <div className="relative">
        <CalendarBreakout />
        <GameHUD />
      </div>
      <MeetingTypesInfo /> {/* Added MeetingTypesInfo */}
    </Layout>
  );
}

export default App;
