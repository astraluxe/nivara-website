import WidgetCard from './WidgetCard';

const CouncilIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-light)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="10" r="3" /><path d="M3.5 20c0-3.2 2.4-5.4 5.5-5.4S14.5 16.8 14.5 20" />
    <circle cx="17" cy="11" r="2.4" /><path d="M15.5 15.2c2.8 0 4.5 2 4.5 4.8" />
  </svg>
);

const AVATAR_COLORS = ['#7C5CFF', '#5B90F7', '#EDAE49', '#3FB27F', '#E5677F'];

/** One of the tools pinned on the rail from first boot (see Targets in plan.md) — a real widget,
 *  not only a rail shortcut. Ask a question, five advisers argue it out. */
export default function CouncilWidget({ onAsk }: { onAsk?: () => void }) {
  return (
    <WidgetCard icon={CouncilIcon} title="Council">
      <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
        Put a decision to five advisers and read what each one says.
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {AVATAR_COLORS.map((c, i) => (
            <div key={i} style={{
              width: 32, height: 32, borderRadius: '999px', marginLeft: i ? -10 : 0,
              background: `linear-gradient(165deg,${c},rgba(0,0,0,.45))`,
              border: '2px solid var(--window-bg)', boxShadow: '0 3px 8px rgba(0,0,0,.5)',
            }} />
          ))}
        </div>
        <button
          onClick={onAsk}
          style={{
            padding: '9px 15px', borderRadius: 11, fontSize: 11.5, fontWeight: 500, color: '#fff',
            background: 'linear-gradient(170deg,#8E6DFF,#6544D8)',
            boxShadow: '0 5px 14px -5px rgba(124,92,255,.85),0 1px 0 rgba(255,255,255,.24) inset',
            border: 'none', cursor: 'pointer', font: 'inherit',
          }}
        >Ask</button>
      </div>
    </WidgetCard>
  );
}
