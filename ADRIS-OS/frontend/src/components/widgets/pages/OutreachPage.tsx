const BARS = [11, 19, 26, 15, 22, 9, 28, 17, 24, 13, 20, 27, 14, 21];

/** Page 2 — an agent visibly at work. The clearest demonstration in the whole shell that
 *  something is actually running, rather than a dashboard showing yesterday's numbers. */
export default function OutreachPage({
  writingTo = 'Priya Menon', doneOf = 4, total = 12,
}: { writingTo?: string; doneOf?: number; total?: number }) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <div style={{
          width: 7, height: 7, borderRadius: '999px', background: 'var(--accent-light)',
          boxShadow: '0 0 10px var(--accent-light)', animation: 'adrisPulse 1.2s ease-in-out infinite',
        }} />
        <div style={{ fontSize: 16 }}>Writing to {writingTo}</div>
        <div className="mono" style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--text-faint)' }}>{doneOf}/{total}</div>
      </div>
      <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 44, marginTop: 20 }}>
        {BARS.map((h, i) => (
          <div key={i} style={{
            flex: 1, height: h, borderRadius: 2,
            background: 'linear-gradient(180deg,#B49EFF,rgba(124,92,255,.15))',
            boxShadow: '0 0 6px rgba(142,109,255,.35)',
          }} />
        ))}
      </div>
      <div className="mono" style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 18, fontSize: 13, color: 'var(--text-muted)' }}>
        <div style={{ color: 'var(--ok)' }}>✓ pulled last thread</div>
        <div style={{ color: 'var(--ok)' }}>✓ checked pricing sheet</div>
        <div>› drafting reply…</div>
      </div>
    </>
  );
}
