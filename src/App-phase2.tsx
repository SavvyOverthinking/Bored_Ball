import { CalendarBreakoutPhase2, Layout } from '@components/index';
import { GameHUD, MeetingTypesInfo, PowerUpInfo } from '@components/game-ui';

function App() {
  return (
    <Layout phase="2">
      <section className="outlook-window" aria-label="Calendar Breakout work week">
        <div className="outlook-titlebar">
          <div className="outlook-app-switcher" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </div>
          <div className="outlook-title">Calendar</div>
          <div className="outlook-search">Search calendar</div>
          <div className="outlook-account">CB</div>
        </div>

        <div className="outlook-commandbar">
          <span className="outlook-command is-active">Work week</span>
          <span className="outlook-command">Today</span>
          <span className="outlook-command">Board</span>
          <span className="outlook-commandbar-spacer" />
          <span className="outlook-sync-dot" aria-hidden="true" />
          <span className="outlook-sync-copy">Campaign mode</span>
        </div>

        <div className="outlook-body">
          <aside className="outlook-nav" aria-label="Outlook navigation">
            <span className="outlook-nav-item is-active">Cal</span>
            <span className="outlook-nav-item">Mail</span>
            <span className="outlook-nav-item">To Do</span>
          </aside>

          <section className="outlook-calendar-pane">
            <GameHUD />
            <CalendarBreakoutPhase2 />
          </section>
        </div>
      </section>

      <section className="outlook-reference-grid" aria-label="Game reference">
        <MeetingTypesInfo />
        <PowerUpInfo />
      </section>
    </Layout>
  );
}

export default App;
