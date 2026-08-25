const AVATAR_COLORS = ['#7C5CFF', '#5B90F7', '#EDAE49', '#3FB27F', '#E5677F'];

/** Page 3 — the Council, one of the two tools pinned from first boot (plan.md Targets). */
export default function CouncilPage({ onAsk }: { onAsk?: () => void }) {
  return (
    <>
      <div style={{ fontSize: 16, color: 'var(--text-muted)', lineHeight: 1.55 }}>
        Put a decision to five advisers and read what each one says.
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {AVATAR_COLORS.map((c, i) => (
            <div key={i} style={{
              width: 40, height: 40, borderRadius: '999px', marginLeft: i ? -11 : 0,
              background: `linear-gradient(165deg,${c},rgba(0,0,0,.45))`,
              border: '2px solid rgba(255,255,255,.12)', boxShadow: '0 3px 8px rgba(0,0,0,.4)',
            }} />
          ))}
        </div>
        <button
          onClick={onAsk}
          style={{
            padding: '12px 24px', borderRadius: 13, fontSize: 15, fontWeight: 500, color: '#fff',
            background: 'linear-gradient(170deg,#8E6DFF,#6544D8)',
            boxShadow: '0 5px 14px -5px rgba(124,92,255,.85),0 1px 0 rgba(255,255,255,.24) inset',
            border: 'none', cursor: 'pointer', font: 'inherit',
          }}
        >Ask</button>
      </div>
    </>
  );
}
