import WallpaperLayer from './WallpaperLayer';
import TopBar from './TopBar';
import CenterClock from './CenterClock';
import Dock from './Dock';
import Rail from './Rail';
import WidgetCarousel from './widgets/WidgetCarousel';
import TodayPage from './widgets/pages/TodayPage';
import OutreachPage from './widgets/pages/OutreachPage';
import CouncilPage from './widgets/pages/CouncilPage';

const RAIL_WIDTH = 312;

/**
 * The desktop, third pass. Previous versions put first eight and then three separate widget cards
 * on the canvas, and both read as crowded — the second one less so, but still a wall of boxes
 * competing with the wallpaper.
 *
 * Now: ONE widget box, carrying several pages, with dots underneath saying which page you're on.
 * Everything that used to be its own card is a page inside it. It's draggable — grab the handle
 * strip at its top and put it wherever suits — and the position is remembered.
 *
 * The clock moved out of the rail and up to the top-centre, large, which is where the eye goes
 * first on a real desktop; the rail no longer shows a second copy of it.
 */
export default function Desktop({
  wallpaperId, theme, onToggleTheme, onOpenWallpaper,
}: {
  wallpaperId: string;
  theme: 'ink' | 'paper';
  onToggleTheme: () => void;
  onOpenWallpaper: () => void;
}) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', color: 'var(--text)' }}>
      <WallpaperLayer wallpaperId={wallpaperId} />
      <TopBar theme={theme} onToggleTheme={onToggleTheme} onOpenWallpaper={onOpenWallpaper} />
      <CenterClock />

      <div style={{
        position: 'absolute', top: 200, left: 0, right: RAIL_WIDTH, bottom: 74,
        padding: '0 40px', boxSizing: 'border-box', zIndex: 1,
        display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
      }}>
        {/* One box. More pages is one more entry in this array — which is deliberately the shape
            an agent adding a screen would extend (plan.md: "it notices your day and writes you a
            tool for it"). */}
        <WidgetCarousel
          pages={[
            { id: 'Today', content: <TodayPage /> },
            { id: 'Outreach', content: <OutreachPage /> },
            { id: 'Council', content: <CouncilPage /> },
          ]}
        />
      </div>

      <Dock railWidth={RAIL_WIDTH} />
      <Rail />
    </div>
  );
}
