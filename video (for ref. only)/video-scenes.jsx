// Nivara story video scenes — 1080x1920, 36 seconds
// Story: pain (subscriptions, cost, fragmentation) → reveal Nivara → CTA

const { Sprite, useSprite, useTime, useTimeline, Easing, interpolate, animate, clamp, TextSprite, ImageSprite, RectSprite } = window;

// =====================================================================
// SHARED CONSTANTS
// =====================================================================
const INK = '#0c0b14';
const INK_2 = '#3a3548';
const INK_3 = '#7a7388';
const PURPLE = '#6d4cff';
const PURPLE_2 = '#8a6cff';
const PURPLE_DEEP = '#3a1fb8';
const PURPLE_SOFT = '#efeaff';
const PAPER = '#ffffff';
const PAPER_2 = '#faf8f5';

const FONT_DISPLAY = "'Inter Tight', system-ui, sans-serif";
const FONT_MONO = "'JetBrains Mono', ui-monospace, monospace";

// =====================================================================
// SUBTITLE — appears at bottom of frame for each beat
// =====================================================================
function Subtitle({ start, end, lines = [], small }) {
  return (
    <Sprite start={start} end={end}>
      {({ localTime, duration }) => {
        const entryDur = 0.35;
        const exitDur = 0.35;
        const exitStart = Math.max(0, duration - exitDur);
        let opacity = 1;
        let ty = 0;
        if (localTime < entryDur) {
          const t = Easing.easeOutCubic(clamp(localTime / entryDur, 0, 1));
          opacity = t; ty = (1 - t) * 18;
        } else if (localTime > exitStart) {
          const t = Easing.easeInCubic(clamp((localTime - exitStart) / exitDur, 0, 1));
          opacity = 1 - t; ty = -t * 10;
        }
        const lineH = small ? 76 : 92;
        const fontSize = small ? 56 : 68;
        return (
          <div style={{
            position: 'absolute',
            left: 80, right: 80,
            bottom: 200,
            textAlign: 'center',
            opacity,
            transform: `translateY(${ty}px)`,
            fontFamily: FONT_DISPLAY,
            fontWeight: 600,
            fontSize,
            lineHeight: 1.12,
            color: INK,
            letterSpacing: '-0.022em',
          }}>
            {lines.map((l, i) => (
              <div key={i} style={{ marginTop: i === 0 ? 0 : 8 }} dangerouslySetInnerHTML={{ __html: l }} />
            ))}
          </div>
        );
      }}
    </Sprite>
  );
}

// =====================================================================
// PROGRESS BAR — thin purple bar across the bottom showing total progress
// =====================================================================
function ProgressBar(){
  const { time, duration } = useTimeline();
  const p = clamp(time / duration, 0, 1);
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0, height: 6,
      background: 'rgba(12,11,20,0.06)',
    }}>
      <div style={{
        width: `${p * 100}%`, height: '100%',
        background: PURPLE,
        boxShadow: `0 0 14px ${PURPLE}`,
        transition: 'none',
      }}/>
    </div>
  );
}

// =====================================================================
// CORNER WATERMARK — small Nivara mark in top corner throughout
// =====================================================================
function Watermark(){
  const { time, duration } = useTimeline();
  // Hide near the very end (logo takes center stage)
  const visible = time < duration - 5;
  return (
    <div style={{
      position: 'absolute', left: 70, top: 70,
      display: 'flex', alignItems: 'center', gap: 14,
      opacity: visible ? 0.55 : 0,
      transition: 'opacity 400ms',
      fontFamily: FONT_MONO,
      fontSize: 22,
      color: INK_3,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
    }}>
      <img src="nivara-logo.png" alt="" style={{ width: 36, height: 36, borderRadius: 8 }}/>
      <span>NIVARA</span>
    </div>
  );
}

// =====================================================================
// SCENE 1 — Setup: "It's another Sunday night"  (0 – 3s)
// =====================================================================
function Scene1Setup(){
  return (
    <Sprite start={0} end={3.2}>
      {({ localTime }) => {
        const t = localTime;
        // Clock pulse
        const pulse = 1 + Math.sin(t * 4) * 0.04;
        return (
          <>
            {/* Time display center-ish */}
            <div style={{
              position: 'absolute', left: '50%', top: 620,
              transform: `translate(-50%, 0) scale(${pulse})`,
              fontFamily: FONT_MONO, fontWeight: 600,
              fontSize: 80, color: INK_3, letterSpacing: '0.04em',
            }}>11:47 PM</div>
            {/* Date */}
            <div style={{
              position: 'absolute', left: '50%', top: 740,
              transform: 'translate(-50%, 0)',
              fontFamily: FONT_MONO, fontSize: 28, color: INK_3,
              letterSpacing: '0.18em', textTransform: 'uppercase',
            }}>Sunday · ship day -1</div>

            {/* Big purple soft circle behind */}
            <div style={{
              position: 'absolute',
              left: '50%', top: 900,
              width: 600, height: 600,
              transform: `translate(-50%, -50%) scale(${0.8 + Math.min(t / 1.2, 1) * 0.2})`,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${PURPLE_SOFT} 0%, transparent 65%)`,
              opacity: Math.min(t / 0.8, 1),
            }}/>
          </>
        );
      }}
    </Sprite>
  );
}

// =====================================================================
// SCENE 2 — Laptop intro: "You open your laptop to ship one feature." (3.2 – 7s)
// =====================================================================
function Scene2Laptop(){
  return (
    <Sprite start={3.2} end={7.2}>
      {({ localTime }) => {
        const open = clamp(localTime / 0.9, 0, 1);
        const lidAngle = Easing.easeOutCubic(open) * 1.0; // 0 → 1
        // Terminal lines progressive
        const showLine1 = localTime > 1.0;
        const showLine2 = localTime > 1.8;
        const showLine3 = localTime > 2.5;
        return (
          <div style={{
            position: 'absolute',
            left: '50%', top: 760,
            transform: `translate(-50%, -50%)`,
            width: 820, perspective: 1400,
          }}>
            {/* Laptop screen */}
            <div style={{
              width: 820, height: 520,
              background: '#0c0b14',
              borderRadius: '22px 22px 6px 6px',
              border: '1px solid #2a2540',
              transformOrigin: 'bottom',
              transform: `rotateX(${(1 - lidAngle) * -75}deg)`,
              padding: 26,
              boxShadow: '0 30px 60px rgba(109,76,255,0.18)',
              fontFamily: FONT_MONO, color: '#e6dcff', fontSize: 26,
              lineHeight: 1.5,
            }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
                <span style={{ width: 12, height: 12, borderRadius: 6, background: '#2a2540' }}/>
                <span style={{ width: 12, height: 12, borderRadius: 6, background: '#2a2540' }}/>
                <span style={{ width: 12, height: 12, borderRadius: 6, background: '#2a2540' }}/>
              </div>
              {showLine1 && (
                <div style={{ opacity: clamp((localTime - 1.0) / 0.3, 0, 1) }}>
                  <span style={{ color: PURPLE_2 }}>$</span> ship-feature
                </div>
              )}
              {showLine2 && (
                <div style={{ opacity: clamp((localTime - 1.8) / 0.3, 0, 1), color: '#7a7388' }}>
                  // first, the daily ritual...
                </div>
              )}
              {showLine3 && (
                <div style={{ opacity: clamp((localTime - 2.5) / 0.3, 0, 1) }}>
                  <span style={{ color: PURPLE_2 }}>$</span> login --everything<span style={{
                    display: 'inline-block', width: 14, height: 26, background: PURPLE_2,
                    verticalAlign: 'middle', marginLeft: 4,
                    opacity: Math.sin(localTime * 6) > 0 ? 1 : 0,
                  }}/>
                </div>
              )}
            </div>
            {/* Laptop base */}
            <div style={{
              width: 880, height: 28, marginTop: -6, marginLeft: -30,
              background: 'linear-gradient(180deg, #1a1530 0%, #0a0814 100%)',
              borderRadius: '4px 4px 14px 14px',
            }}/>
          </div>
        );
      }}
    </Sprite>
  );
}

// =====================================================================
// SCENE 3 — Subscription stack (7.2 – 13.5s)
// Each subscription card drops in with price; purple highlights mounting cost.
// =====================================================================
const SUBS = [
  { name: 'Cursor Pro',         price: '$20',  color: '#000' },
  { name: 'ChatGPT Teams',      price: '$30',  color: '#10a37f' },
  { name: 'Zapier Pro',         price: '$29',  color: '#ff4f00' },
  { name: 'NordVPN',            price: '$12',  color: '#4687ff' },
  { name: 'HuggingFace + GPU',  price: '$25',  color: '#1b1b1b' },
];

function Scene3Subscriptions(){
  return (
    <Sprite start={7.2} end={13.6}>
      {({ localTime, duration }) => {
        const stagger = 0.55;
        return (
          <div style={{
            position: 'absolute',
            left: '50%', top: 600,
            transform: 'translateX(-50%)',
            width: 880,
            display: 'flex', flexDirection: 'column', gap: 18,
          }}>
            {/* Header */}
            <div style={{
              fontFamily: FONT_MONO, fontSize: 24, color: INK_3,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              opacity: clamp(localTime / 0.4, 0, 1),
              marginBottom: 14,
            }}>// THIS MONTH</div>

            {SUBS.map((s, i) => {
              const start = i * stagger;
              const lt = localTime - start;
              if (lt < 0) return <div key={i} style={{ height: 100 }}/>;
              const inT = Easing.easeOutBack(clamp(lt / 0.45, 0, 1));
              const op = clamp(lt / 0.3, 0, 1);
              // strike-through after a moment
              const strike = clamp((lt - 0.7) / 0.35, 0, 1);
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '24px 30px',
                  background: PAPER_2,
                  border: `1px solid rgba(12,11,20,0.08)`,
                  borderRadius: 18,
                  opacity: op,
                  transform: `translateX(${(1 - inT) * 80}px)`,
                  position: 'relative', overflow: 'hidden',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 12,
                      background: s.color, color: '#fff',
                      display: 'grid', placeItems: 'center',
                      fontFamily: FONT_MONO, fontWeight: 700, fontSize: 18,
                    }}>{s.name.slice(0, 2)}</div>
                    <div style={{ fontSize: 32, fontWeight: 600, color: INK }}>{s.name}</div>
                  </div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 30, fontWeight: 600, color: PURPLE_DEEP }}>
                    {s.price}/mo
                  </div>
                  {/* strike-through bar */}
                  <div style={{
                    position: 'absolute', left: 28, right: 28, top: '50%',
                    height: 3, background: PURPLE,
                    transform: `scaleX(${strike})`, transformOrigin: 'left',
                    opacity: strike,
                  }}/>
                </div>
              );
            })}
          </div>
        );
      }}
    </Sprite>
  );
}

// =====================================================================
// SCENE 4 — Big price reveal (13.6 – 17.6s)
// "₹9,600 a month." massive purple
// =====================================================================
function Scene4Price(){
  return (
    <Sprite start={13.6} end={17.6}>
      {({ localTime, duration }) => {
        // Counter from 0 → 9600
        const counterT = Easing.easeOutCubic(clamp(localTime / 1.2, 0, 1));
        const value = Math.round(9600 * counterT);
        const valueStr = value.toLocaleString('en-IN');
        // pulse the number after counter ends
        const after = Math.max(0, localTime - 1.4);
        const pulse = 1 + Math.sin(after * 4) * 0.012;
        const op = clamp(localTime / 0.3, 0, 1);
        const exitOp = 1 - clamp((localTime - (duration - 0.4)) / 0.4, 0, 1);
        return (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            opacity: op * exitOp,
            paddingBottom: 400,
          }}>
            <div style={{
              fontFamily: FONT_MONO, fontSize: 28, color: INK_3,
              letterSpacing: '0.18em', textTransform: 'uppercase',
              marginBottom: 28,
            }}>MONTHLY BLEED</div>
            <div style={{
              fontFamily: FONT_DISPLAY, fontWeight: 800,
              fontSize: 280, lineHeight: 0.9,
              color: PURPLE,
              letterSpacing: '-0.05em',
              transform: `scale(${pulse})`,
              textShadow: `0 0 60px rgba(109,76,255,0.25)`,
            }}>
              ₹{valueStr}
            </div>
            <div style={{
              fontFamily: FONT_DISPLAY, fontWeight: 500,
              fontSize: 42, color: INK_2,
              marginTop: 24, letterSpacing: '-0.01em',
            }}>per month · per developer</div>
          </div>
        );
      }}
    </Sprite>
  );
}

// =====================================================================
// SCENE 5 — Fragmentation: "Five tools. Five logins. Five tabs." (17.6 – 21.6s)
// =====================================================================
function Scene5Fragment(){
  const rows = [
    { label: 'tools',  delay: 0.0 },
    { label: 'logins', delay: 0.55 },
    { label: 'tabs',   delay: 1.10 },
  ];
  return (
    <Sprite start={17.6} end={21.6}>
      {({ localTime, duration }) => {
        const exitOp = 1 - clamp((localTime - (duration - 0.4)) / 0.4, 0, 1);
        return (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            opacity: exitOp,
            paddingBottom: 380,
            gap: 26,
          }}>
            {rows.map((r, i) => {
              const lt = localTime - r.delay;
              if (lt < 0) return <div key={i} style={{ height: 200, opacity: 0 }}/>;
              const inT = Easing.easeOutCubic(clamp(lt / 0.5, 0, 1));
              const op = clamp(lt / 0.3, 0, 1);
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'baseline', gap: 32,
                  opacity: op,
                  transform: `translateY(${(1 - inT) * 24}px)`,
                }}>
                  <div style={{
                    fontFamily: FONT_DISPLAY, fontWeight: 900,
                    fontSize: 220, lineHeight: 0.9,
                    color: PURPLE,
                    letterSpacing: '-0.06em',
                  }}>5</div>
                  <div style={{
                    fontFamily: FONT_DISPLAY, fontWeight: 600,
                    fontSize: 76, color: INK,
                    letterSpacing: '-0.025em',
                  }}>{r.label}</div>
                </div>
              );
            })}
          </div>
        );
      }}
    </Sprite>
  );
}

// =====================================================================
// SCENE 6 — Question pause: "There has to be a better way." (21.6 – 24.6s)
// =====================================================================
function Scene6Question(){
  return (
    <Sprite start={21.6} end={24.6}>
      {({ localTime, duration }) => {
        const op = clamp(localTime / 0.5, 0, 1);
        const exitOp = 1 - clamp((localTime - (duration - 0.4)) / 0.4, 0, 1);
        // very soft drift
        const drift = Math.sin(localTime * 1.4) * 6;
        return (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: op * exitOp,
            paddingBottom: 400,
          }}>
            {/* Three pulsing dots like a chat is typing */}
            <div style={{ display: 'flex', gap: 22, transform: `translateY(${drift}px)` }}>
              {[0, 1, 2].map(i => {
                const p = (Math.sin((localTime * 3) - i * 0.5) + 1) / 2;
                return (
                  <div key={i} style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: PURPLE,
                    transform: `scale(${0.6 + p * 0.5})`,
                    opacity: 0.4 + p * 0.6,
                  }}/>
                );
              })}
            </div>
          </div>
        );
      }}
    </Sprite>
  );
}

// =====================================================================
// SCENE 7 — Nivara reveal (24.6 – 28.6s)
// =====================================================================
function Scene7Reveal(){
  return (
    <Sprite start={24.6} end={28.6}>
      {({ localTime, duration }) => {
        const t = localTime;
        // Logo scale-in with overshoot
        const logoT = Easing.easeOutBack(clamp(t / 0.9, 0, 1));
        const logoScale = 0.3 + logoT * 0.7;
        const logoOp = clamp(t / 0.4, 0, 1);
        // Wordmark slide-up
        const wmT = Easing.easeOutCubic(clamp((t - 0.7) / 0.7, 0, 1));
        const wmOp = clamp((t - 0.7) / 0.4, 0, 1);

        // ripple
        const rippleT = clamp((t - 0.4) / 1.6, 0, 1);
        const exitOp = 1 - clamp((t - (duration - 0.4)) / 0.4, 0, 1);

        return (
          <div style={{ position: 'absolute', inset: 0, opacity: exitOp }}>
            {/* ripples */}
            {[0, 1, 2].map(i => {
              const delay = i * 0.25;
              const lt = clamp((t - 0.4 - delay) / 1.6, 0, 1);
              if (lt <= 0 || lt >= 1) return null;
              return (
                <div key={i} style={{
                  position: 'absolute', left: '50%', top: 850,
                  width: 200 + lt * 900, height: 200 + lt * 900,
                  transform: 'translate(-50%, -50%)',
                  borderRadius: '50%',
                  border: `2px solid ${PURPLE}`,
                  opacity: (1 - lt) * 0.4,
                }}/>
              );
            })}
            {/* logo */}
            <div style={{
              position: 'absolute', left: '50%', top: 850,
              transform: `translate(-50%, -50%) scale(${logoScale})`,
              opacity: logoOp,
            }}>
              <img src="nivara-logo.png" alt="Nivara" style={{
                width: 360, height: 360, borderRadius: 72,
                boxShadow: `0 30px 80px rgba(109,76,255,0.4)`,
              }}/>
            </div>
            {/* wordmark */}
            <div style={{
              position: 'absolute', left: 0, right: 0, top: 1180,
              textAlign: 'center',
              fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 144,
              color: INK, letterSpacing: '-0.04em',
              opacity: wmOp,
              transform: `translateY(${(1 - wmT) * 30}px)`,
            }}>Nivara</div>
          </div>
        );
      }}
    </Sprite>
  );
}

// =====================================================================
// SCENE 8 — What's inside: 6 modules (28.6 – 32.6s)
// =====================================================================
const MODULES = [
  { name: 'Krew',       sub: '43 AI agents' },
  { name: 'Coder',      sub: 'AI terminal' },
  { name: 'Automation', sub: 'Workflows' },
  { name: 'Models',     sub: 'Local AI' },
  { name: 'Vault',      sub: 'Privacy' },
  { name: 'Guard',      sub: 'Security' },
];
function Scene8Modules(){
  return (
    <Sprite start={28.6} end={32.6}>
      {({ localTime, duration }) => {
        const stagger = 0.18;
        const exitOp = 1 - clamp((localTime - (duration - 0.4)) / 0.4, 0, 1);
        return (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            paddingBottom: 360,
            opacity: exitOp,
          }}>
            <div style={{
              fontFamily: FONT_MONO, fontSize: 28, color: PURPLE_DEEP,
              letterSpacing: '0.18em', textTransform: 'uppercase',
              marginBottom: 40,
              background: PURPLE_SOFT, padding: '14px 24px', borderRadius: 999,
              opacity: clamp(localTime / 0.3, 0, 1),
            }}>// ALL IN ONE APP</div>

            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24,
              width: 880,
            }}>
              {MODULES.map((m, i) => {
                const lt = localTime - i * stagger - 0.2;
                if (lt < 0) return <div key={i} style={{ height: 130, opacity: 0 }}/>;
                const inT = Easing.easeOutBack(clamp(lt / 0.45, 0, 1));
                const op = clamp(lt / 0.3, 0, 1);
                return (
                  <div key={i} style={{
                    padding: '26px 32px',
                    background: PAPER_2,
                    border: `1px solid rgba(12,11,20,0.08)`,
                    borderRadius: 22,
                    display: 'flex', flexDirection: 'column', gap: 6,
                    opacity: op,
                    transform: `scale(${0.7 + inT * 0.3})`,
                  }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                    }}>
                      <span style={{
                        width: 14, height: 14, borderRadius: 4,
                        background: PURPLE, boxShadow: `0 0 12px ${PURPLE}`,
                      }}/>
                      <span style={{
                        fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 44,
                        color: INK, letterSpacing: '-0.02em',
                      }}>{m.name}</span>
                    </div>
                    <div style={{
                      fontFamily: FONT_MONO, fontSize: 22, color: INK_3,
                      letterSpacing: '0.06em', textTransform: 'uppercase',
                      marginLeft: 28,
                    }}>{m.sub}</div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }}
    </Sprite>
  );
}

// =====================================================================
// SCENE 9 — CTA (32.6 – 36s)
// =====================================================================
function Scene9CTA(){
  return (
    <Sprite start={32.6} end={36.2}>
      {({ localTime, duration }) => {
        const t = localTime;
        const logoT = Easing.easeOutCubic(clamp(t / 0.6, 0, 1));
        const tagT = Easing.easeOutCubic(clamp((t - 0.4) / 0.6, 0, 1));
        const pillsT = Easing.easeOutCubic(clamp((t - 0.9) / 0.6, 0, 1));
        const linkT = Easing.easeOutCubic(clamp((t - 1.3) / 0.6, 0, 1));

        return (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            paddingBottom: 220,
          }}>
            {/* Logo + wordmark */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 28,
              opacity: clamp(t / 0.3, 0, 1),
              transform: `translateY(${(1 - logoT) * 24}px)`,
              marginBottom: 60,
            }}>
              <img src="nivara-logo.png" alt="" style={{
                width: 140, height: 140, borderRadius: 32,
                boxShadow: `0 18px 50px rgba(109,76,255,0.35)`,
              }}/>
              <div style={{
                fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 120,
                color: INK, letterSpacing: '-0.04em',
              }}>Nivara</div>
            </div>

            {/* Tagline */}
            <div style={{
              fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 76,
              color: INK, letterSpacing: '-0.03em',
              textAlign: 'center', lineHeight: 1.05,
              opacity: clamp((t - 0.4) / 0.3, 0, 1),
              transform: `translateY(${(1 - tagT) * 24}px)`,
              marginBottom: 50,
            }}>
              Your AI team.<br/>
              <span style={{ color: PURPLE }}>Yours to keep.</span>
            </div>

            {/* Pills */}
            <div style={{
              display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center',
              opacity: clamp((t - 0.9) / 0.3, 0, 1),
              transform: `translateY(${(1 - pillsT) * 18}px)`,
              marginBottom: 60,
              width: 900,
            }}>
              {['43 agents', '100% local', '₹0 with free Gemini key'].map((p, i) => (
                <div key={i} style={{
                  fontFamily: FONT_MONO, fontSize: 28, color: INK_2,
                  padding: '16px 26px', borderRadius: 999,
                  background: PURPLE_SOFT, border: `1px solid rgba(109,76,255,0.2)`,
                  letterSpacing: '0.02em',
                }}>{p}</div>
              ))}
            </div>

            {/* Link */}
            <div style={{
              padding: '32px 56px',
              background: PURPLE,
              borderRadius: 28,
              fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 64,
              color: '#fff', letterSpacing: '-0.02em',
              boxShadow: `0 22px 60px rgba(109,76,255,0.4)`,
              opacity: clamp((t - 1.3) / 0.3, 0, 1),
              transform: `translateY(${(1 - linkT) * 24}px)`,
              display: 'flex', alignItems: 'center', gap: 22,
            }}>
              Nivara.tech
              <span style={{
                width: 60, height: 60, borderRadius: 30, background: '#fff',
                color: PURPLE, display: 'grid', placeItems: 'center',
                fontWeight: 800, fontSize: 36,
              }}>↗</span>
            </div>
          </div>
        );
      }}
    </Sprite>
  );
}

// =====================================================================
// MASTER STORY — composes all scenes + subtitles
// =====================================================================
function NivaraStory(){
  return (
    <>
      {/* Soft purple wash in background corners — gentle, always present */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `radial-gradient(60% 40% at 10% 0%, rgba(109,76,255,0.05), transparent 60%),
                     radial-gradient(60% 40% at 100% 100%, rgba(109,76,255,0.06), transparent 65%)`,
      }}/>

      <Watermark />

      {/* Scenes */}
      <Scene1Setup />
      <Scene2Laptop />
      <Scene3Subscriptions />
      <Scene4Price />
      <Scene5Fragment />
      <Scene6Question />
      <Scene7Reveal />
      <Scene8Modules />
      <Scene9CTA />

      {/* Subtitles — bottom of frame, white bg */}
      <Subtitle start={0.4}   end={3.0}  lines={["It's another Sunday night."]} />
      <Subtitle start={3.4}   end={7.0}  lines={["You open your laptop", "to ship one feature."]} />
      <Subtitle start={7.4}   end={11.0} lines={["Cursor. ChatGPT.", "Zapier. VPN. GPU."]} />
      <Subtitle start={11.2}  end={13.4} lines={["Every one of them", "wants your card again."]} />
      <Subtitle start={13.8}  end={17.4} lines={["<span style='color:#6d4cff'>₹9,600</span> a month.", "For one developer."]} />
      <Subtitle start={17.8}  end={21.4} lines={["Five tools. Five logins.", "Five tabs to forget."]} />
      <Subtitle start={21.8}  end={24.4} lines={["There has to be", "a better way."]} />
      <Subtitle start={24.8}  end={28.4} lines={["Meet <span style='color:#6d4cff;font-weight:800'>Nivara</span>."]} />
      <Subtitle start={28.8}  end={32.4} lines={["One app. 43 AI agents.", "A terminal. Automations. Privacy."]} />
      <Subtitle start={32.8}  end={35.8} lines={["Your AI team.", "Yours to keep."]} small />

      <ProgressBar />
    </>
  );
}

// Export to window so the host App can use it
window.NivaraStory = NivaraStory;
