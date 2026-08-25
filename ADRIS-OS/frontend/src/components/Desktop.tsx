import { useState } from 'react';
import WallpaperLayer from './WallpaperLayer';
import TopBar from './TopBar';
import CenterClock from './CenterClock';
import Dock from './Dock';
import Rail from './Rail';
import CalendarPanel from './CalendarPanel';
import AllApps from './AllApps';
import WidgetCarousel from './widgets/WidgetCarousel';
import TodayPage from './widgets/pages/TodayPage';
import OutreachPage from './widgets/pages/OutreachPage';
import CouncilPage from './widgets/pages/CouncilPage';
import { launchApp } from '../lib/linuxApps';
import { useScreenScale } from '../lib/useScreenScale';

/**
 * The desktop, fourth pass — rebuilt against Apple HIG desktop conventions after the honest
 * feedback that it was "too small and too boring".
 *
 * The specific failures, and what each one became:
 * - **Everything was undersized.** HIG puts desktop body text at 13pt (~17px) with a 10pt (~13px)
 *   floor; the old shell ran 9–12px almost everywhere, which is why it read as cramped rather than
 *   calm. Type is up across the board and the widget box is 480px instead of 340px.
 * - **A screen that was mostly nothing.** One small card floating in the middle of a large canvas.
 *   The layout now uses its corners deliberately: clock top-centre, the widget box below it,
 *   calendar bottom-left, dock bottom-centre, rail down the right.
 * - **The calendar was buried in the rail**, eating a third of it. It is its own panel now, in the
 *   bottom-left, where reference material belongs — HIG's "most important items near the top and
 *   leading side" cuts the other way for something you glance at twice a day.
 *
 * Everything is positioned against the four edges rather than centred in a flow, because on a
 * desktop the corners are free real estate and the middle is where the eye starts.
 */
export default function Desktop({
  wallpaperId, theme, onToggleTheme, onOpenWallpaper,
}: {
  wallpaperId: string;
  theme: 'ink' | 'paper';
  onToggleTheme: () => void;
  onOpenWallpaper: () => void;
}) {
  const [allApps, setAllApps] = useState(false);
  // Every size below comes from the actual screen — see useScreenScale. Nothing here is a fixed
  // pixel guess against one test window any more.
  const S = useScreenScale();

  async function openApp(id: string, name: string) {
    const r = await launchApp(id);
    if (!r.ok) console.warn(`${name}: ${r.error}`);
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', color: 'var(--text)' }}>
      <WallpaperLayer wallpaperId={wallpaperId} />
      <TopBar theme={theme} onToggleTheme={onToggleTheme} onOpenWallpaper={onOpenWallpaper} />
      <CenterClock railWidth={S.rail + 36} scale={S.scale} />

      {/* The widget box, under the clock. Deliberately not vertically centred: sitting it just
          below the clock keeps them reading as one group instead of two things floating apart. */}
      <div style={{
        position: 'absolute', top: Math.round(230 * S.scale), left: 0, right: S.rail + 36,
        display: 'flex', justifyContent: 'center', zIndex: 1, pointerEvents: 'none',
      }}>
        <div style={{ pointerEvents: 'auto' }}>
          <WidgetCarousel
            width={S.widget}
            scale={S.scale}
            pages={[
              { id: 'Today', content: <TodayPage /> },
              { id: 'Outreach', content: <OutreachPage /> },
              { id: 'Council', content: <CouncilPage /> },
            ]}
          />
        </div>
      </div>

      {/* Bottom-left: the calendar, out of the rail, in a corner of its own. Hidden on a screen
          too small for it to earn the space — the rail still carries the day's agenda, so nothing
          is actually lost. */}
      {!S.compact && (
        <div style={{ position: 'absolute', left: 24, bottom: 24, zIndex: 1 }}>
          <CalendarPanel width={S.calendar} scale={S.scale} />
        </div>
      )}

      <Dock railWidth={S.rail + 36} iconSize={S.dockIcon} onOpenAllApps={() => setAllApps(true)} />
      <Rail width={S.rail} scale={S.scale} />

      {allApps && <AllApps onOpen={openApp} onClose={() => setAllApps(false)} />}
    </div>
  );
}
