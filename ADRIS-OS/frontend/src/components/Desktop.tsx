import WallpaperLayer from './WallpaperLayer';
import TopBar from './TopBar';
import Dock from './Dock';
import Rail from './Rail';
import TodayPanel from './widgets/TodayPanel';
import TodaysOutreachWidget from './widgets/TodaysOutreachWidget';
import CouncilWidget from './widgets/CouncilWidget';

const RAIL_WIDTH = 312;

/**
 * Screen 01/02 from the design, revised after seeing it running: eight separate widgets on the
 * canvas was "crowded" — the accurate word for it — and two of them (Clock, Calendar) duplicated
 * what the rail already shows on the right the whole time. This is the cut-down version: ONE main
 * info card (TodayPanel — what's next, the running focus session, and the two or three numbers
 * worth a glance) plus the two widgets that are genuinely their own thing: Today's outreach (the
 * clearest demonstration of an agent visibly doing work) and Council (a real, distinct feature,
 * not a duplicate of anything in the rail). Three things to look at, not eight.
 */
export default function Desktop({ wallpaperId }: { wallpaperId: string }) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', color: 'var(--text)' }}>
      <WallpaperLayer wallpaperId={wallpaperId} />
      <TopBar />
      <div style={{
        position: 'absolute', top: 38, left: 0, right: RAIL_WIDTH, bottom: 0,
        padding: '32px 32px 74px', boxSizing: 'border-box', overflow: 'auto', zIndex: 1,
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'flex-start' }}>
          <TodayPanel />
          <TodaysOutreachWidget state="working" />
          <CouncilWidget />
        </div>
      </div>
      <Dock railWidth={RAIL_WIDTH} />
      <Rail />
    </div>
  );
}
