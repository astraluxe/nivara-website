import WallpaperLayer from './WallpaperLayer';
import TopBar from './TopBar';
import Dock from './Dock';
import Rail from './Rail';
import ClockWidget from './widgets/ClockWidget';
import CalendarWidget from './widgets/CalendarWidget';
import FocusWidget from './widgets/FocusWidget';
import TodaysOutreachWidget from './widgets/TodaysOutreachWidget';
import InboxWidget from './widgets/InboxWidget';
import SystemWidget from './widgets/SystemWidget';
import BatteryWidget from './widgets/BatteryWidget';
import CouncilWidget from './widgets/CouncilWidget';

const RAIL_WIDTH = 312;

/**
 * Screen 01/02 from the design — the whole product in one image. The canvas is the same
 * `repeat(auto-fill,248px)` widget grid the design's own catalogue screen (04) uses — every widget
 * is the same WidgetCard plate, so what ships and what a user adds later never look like two
 * different products. Eight widgets here on purpose, more than the design's single-screen mockup
 * shows: this is meant to demonstrate real capacity, not just recreate one frame. Adding a ninth is
 * one more line, not a layout change — that's the point of the grid being auto-fill, not a fixed
 * column count.
 *
 * See ../../design of adris.OS.html for the pixel reference this was built against, and
 * plan.md §5/§6 for why each of these specific widgets is here.
 */
export default function Desktop({ wallpaperId }: { wallpaperId: string }) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', color: 'var(--text)' }}>
      <WallpaperLayer wallpaperId={wallpaperId} />
      <TopBar />
      <div style={{
        position: 'absolute', top: 38, left: 0, right: RAIL_WIDTH, bottom: 0,
        padding: '24px 26px 74px', boxSizing: 'border-box', overflow: 'auto', zIndex: 1,
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,248px)', gap: 24, justifyContent: 'start' }}>
          <ClockWidget />
          <CalendarWidget items={[
            { time: '10:00', label: 'Demo with Acme', soon: true },
            { time: '2:30', label: 'Vendor call' },
          ]} />
          <FocusWidget />
          <TodaysOutreachWidget state="resting" />
          <InboxWidget needReply={4} extra={2} threads={[
            { name: 'Priya Menon', subject: 'Re: March pricing' },
            { name: 'Designo Studio', subject: 'Contract draft' },
          ]} />
          <SystemWidget />
          <BatteryWidget />
          <CouncilWidget />
        </div>
      </div>
      <Dock railWidth={RAIL_WIDTH} />
      <Rail />
    </div>
  );
}
