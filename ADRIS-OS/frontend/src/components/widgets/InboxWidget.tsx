import WidgetCard from './WidgetCard';

const InboxIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-light)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="6" width="18" height="12" rx="2.4" /><path d="M3.6 7.2L12 13l8.4-5.8" />
  </svg>
);

export interface InboxThread { name: string; subject: string }
const AVATAR_COLORS = ['#E5677F', '#5B90F7', '#EDAE49', '#3FB27F', '#8E6DFF'];

export default function InboxWidget({ needReply = 4, extra = 2, threads }: {
  needReply?: number; extra?: number; threads: InboxThread[];
}) {
  return (
    <WidgetCard icon={InboxIcon} title="Inbox">
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
        <div>
          <div style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-.035em', lineHeight: 1, textShadow: '0 2px 10px rgba(0,0,0,.5)' }}>{needReply}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>need a reply</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
          {AVATAR_COLORS.slice(0, 3).map((c, i) => (
            <div key={i} style={{
              width: 30, height: 30, borderRadius: '999px', marginLeft: i ? -9 : 0,
              background: `linear-gradient(165deg,${c},rgba(0,0,0,.4))`,
              border: '2px solid var(--window-bg)', boxShadow: '0 3px 7px rgba(0,0,0,.45)',
            }} />
          ))}
          {extra > 0 && (
            <div style={{
              width: 30, height: 30, borderRadius: '999px', marginLeft: -9,
              background: 'var(--well-bg)', border: '2px solid var(--window-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, color: 'var(--text-muted)',
            }}>+{extra}</div>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 13 }}>
        {threads.map((t, i) => (
          <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'center', padding: '8px 10px', borderRadius: 11, background: 'rgba(255,255,255,.045)', border: '1px solid rgba(255,255,255,.06)' }}>
            <div style={{ width: 6, height: 6, borderRadius: '999px', background: 'var(--accent-mid)', flex: 'none' }} />
            <div style={{ fontSize: 11 }}>{t.name}</div>
            <div style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-faint)' }}>{t.subject}</div>
          </div>
        ))}
      </div>
    </WidgetCard>
  );
}
