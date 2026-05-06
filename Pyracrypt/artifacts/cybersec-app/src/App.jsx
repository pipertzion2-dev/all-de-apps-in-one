import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'wouter'
import { WireBar }          from './three/WireBar.jsx'
import { usePipelineStore } from './store/usePipelineStore.js'

const pyracryptGraphic = '/pyracrypt-graphic.png'
const pyracryptLogo    = '/pyracrypt-logo-nobg.png'

const HEADER_H = 62

function scrollTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// Noise texture overlay (for purple & blue elements)
const NOISE_URI = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.11'/%3E%3C/svg%3E\")"

// ── LED backlit nav button ────────────────────────────────────────────────
// Clear plastic lens over an LED — transparent center, color glow at edges,
// hot-spot at the light source, outer halo spilling beyond the dark bezel.
function LedButton({ label, glowColor, deepColor, onClick }) {
  const [h, setH] = useState(false)
  const [p, setP] = useState(false)
  return (
    <button
      className="led-btn"
      onClick={onClick}
      onMouseEnter={() => setH(true)} onMouseLeave={() => { setH(false); setP(false) }}
      onMouseDown={() => setP(true)} onMouseUp={() => setP(false)}
      style={{
        position: 'relative',
        padding: '7px 13px',
        borderRadius: 7,
        // Dark metal bezel ring — the housing around the lens
        border: '2px solid rgba(18,20,24,0.70)',
        // Clear plastic lens: LED hot-spot at centre, color bleeds through, transparent edges
        background: `radial-gradient(ellipse at 48% 42%,
          rgba(255,255,255,${h ? '1.0' : '0.88'}) 0%,
          rgba(255,255,255,0.55) 18%,
          ${glowColor}cc 44%,
          ${deepColor}99 72%,
          rgba(0,0,0,0.08) 100%)`,
        backdropFilter: 'blur(2px)',
        WebkitBackdropFilter: 'blur(2px)',
        // Inner ring highlight + outer LED halo
        boxShadow: p
          ? `inset 0 0 6px rgba(0,0,0,0.30),
             0 0 8px ${deepColor}66`
          : `inset 0 1px 2px rgba(255,255,255,0.70),
             inset 0 -1px 3px rgba(0,0,0,0.22),
             0 0 ${h ? '20px' : '12px'} ${glowColor},
             0 0 ${h ? '38px' : '24px'} ${glowColor}88,
             0 0 ${h ? '55px' : '36px'} ${glowColor}44`,
        cursor: 'pointer',
        fontSize: 7, fontWeight: 800, letterSpacing: '0.10em', textTransform: 'uppercase',
        color: p ? 'rgba(10,12,16,0.90)' : 'rgba(20,24,30,0.78)',
        textShadow: `0 0 8px rgba(255,255,255,0.90), 0 1px 0 rgba(255,255,255,0.60)`,
        fontFamily: 'inherit',
        transition: 'all 0.13s',
        transform: p ? 'scale(0.93) translateY(1px)' : h ? 'scale(1.05)' : 'scale(1)',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}>
      {label}
    </button>
  )
}

// ── Eyebrow label ─────────────────────────────────────────────────────────
function Eyebrow({ children, color }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      fontSize: 8, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase',
      color: '#606870', marginBottom: 6,
    }}>
      <span style={{ width: 20, height: 1.5, background: color, display: 'inline-block', borderRadius: 1 }} />
      {children}
      <span style={{ width: 20, height: 1.5, background: color, display: 'inline-block', borderRadius: 1 }} />
    </div>
  )
}

// Simple column stack wrapper for CTA buttons
function CamoCTAWrapper({ children, style }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10, ...style }}>
      {children}
    </div>
  )
}

// Grain noise — higher opacity so it actually reads on screen
const BTN_GRAIN = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.22'/%3E%3C/svg%3E\")"

function CTA({ label, onClick, outline = false, large = false }) {
  const [h, setH] = useState(false)
  const pad = large ? '13px 30px' : '8px 20px'
  const fz  = large ? 11 : 9.5

  // Layer stack (top → bottom):
  //  1. grain noise (visible grit)
  //  2. glass specular sweep (keeps it looking glassy)
  //  3. camo color blobs — the 4 brand colors as overlapping soft patches
  //  4. very faint base
  const bg = `
    ${BTN_GRAIN},
    linear-gradient(112deg,
      rgba(255,255,255,0.0) 0%,
      rgba(255,255,255,${h ? '0.52' : '0.36'}) 26%,
      rgba(255,255,255,0.04) 50%,
      rgba(255,255,255,${h ? '0.22' : '0.10'}) 74%,
      rgba(255,255,255,0.0) 100%),
    radial-gradient(ellipse 55% 90% at 8%  50%,  rgba(220,229,202,0.42) 0%, transparent 72%),
    radial-gradient(ellipse 45% 80% at 38% 20%,  rgba(109,145,179,0.38) 0%, transparent 68%),
    radial-gradient(ellipse 40% 75% at 62% 80%,  rgba(172,129,175,0.36) 0%, transparent 65%),
    radial-gradient(ellipse 38% 70% at 88% 30%,  rgba(223,178,169,0.34) 0%, transparent 62%),
    radial-gradient(ellipse 30% 60% at 50% 55%,  rgba(109,145,179,0.18) 0%, transparent 55%),
    rgba(220,229,202,0.08)`

  return (
    <button onClick={onClick}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        padding: pad, fontSize: fz, fontWeight: 700, fontFamily: 'inherit',
        letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer',
        transition: 'all 0.17s', borderRadius: 3,
        border: `1px solid ${h ? 'rgba(220,229,202,0.60)' : 'rgba(220,229,202,0.35)'}`,
        borderBottom: `1px solid rgba(0,0,0,0.08)`,
        background: bg,
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        color: '#283822',
        boxShadow: h
          ? '0 1px 0 rgba(255,255,255,0.80) inset, 0 4px 16px rgba(220,229,202,0.30)'
          : '0 1px 0 rgba(255,255,255,0.65) inset, 0 1px 6px rgba(0,0,0,0.08)',
        transform: h ? 'translateY(-1px)' : 'none',
      }}>{label}</button>
  )
}

// ── Glass feature card ────────────────────────────────────────────────────
function FeatureCard({ icon, title, desc, accent, accentDeep }) {
  const [h, setH] = useState(false)
  return (
    <div onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{
      position: 'relative',
      background: h ? 'rgba(255,255,255,0.42)' : 'rgba(255,255,255,0.26)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      border: `1px solid ${h ? 'rgba(255,255,255,0.70)' : 'rgba(255,255,255,0.50)'}`,
      borderTop: `2.5px solid ${accent}`,
      borderRadius: 4,
      padding: '32px 28px',
      transition: 'all 0.22s',
      cursor: 'default',
      boxShadow: h ? '0 8px 28px rgba(0,0,0,0.14)' : '0 2px 10px rgba(0,0,0,0.09)',
    }}>
      <div style={{
        fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase',
        color: accentDeep, marginBottom: 14,
      }}>{icon}  {title}</div>
      <div style={{ fontSize: 11.5, color: '#505860', lineHeight: 1.8 }}>{desc}</div>
    </div>
  )
}

// ── Glass cap card ────────────────────────────────────────────────────────
function CapCard({ f }) {
  const [h, setH] = useState(false)
  return (
    <div onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{
      borderRadius: 3, padding: '12px 14px',
      background: h ? 'rgba(255,255,255,0.50)' : 'rgba(255,255,255,0.24)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      border: `1px solid ${h ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.44)'}`,
      boxShadow: h ? '0 4px 14px rgba(0,0,0,0.12)' : '0 1px 4px rgba(0,0,0,0.07)',
      transition: 'all 0.15s', cursor: 'default',
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: h ? '#b06858' : '#404650', letterSpacing: '0.04em', marginBottom: 3 }}>
        {f.name || f.id || String(f)}
      </div>
      {f.description && (
        <div style={{ fontSize: 9, color: '#606870', lineHeight: 1.65 }}>{f.description}</div>
      )}
    </div>
  )
}

// ── Header — brushed aluminum with LED buttons ────────────────────────────
function Header({ featCount }) {
  const [, navigate] = useLocation()
  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
      height: HEADER_H,
      // Brushed aluminum: fine horizontal lines + gradient
      background: `
        repeating-linear-gradient(90deg,
          transparent, transparent 2px,
          rgba(255,255,255,0.028) 2px, rgba(255,255,255,0.028) 3px),
        linear-gradient(to bottom,
          #dde0e8 0%, #c8ccd8 12%, #bcc0cc 48%, #c4c8d4 62%, #b8bcc8 100%)`,
      borderBottom: '1px solid rgba(0,0,0,0.22)',
      boxShadow: '0 1px 0 rgba(255,255,255,0.88) inset, 0 3px 10px rgba(0,0,0,0.22)',
      display: 'flex', alignItems: 'center',
      padding: '0 24px',
      gap: 20,
    }}>

      {/* Logo — far left, goes home */}
      <div
        onClick={() => navigate('/')}
        style={{ cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
        <img
          src={pyracryptLogo}
          alt="Pyracrypt"
          style={{ height: 44, width: 'auto', display: 'block' }}
        />
      </div>

      {/* Inset rail — holds the LED buttons, centered; scrollable on mobile */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.04) 100%)',
        borderRadius: 8,
        border: '1px solid rgba(0,0,0,0.12)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.60) inset',
        padding: '8px 14px',
        margin: '9px 0',
        minWidth: 0,
        // overflow must stay visible so the LED halo box-shadow isn't clipped
        overflow: 'visible',
      }}>
        <div className="led-rail-inner"
          onWheel={e => { e.currentTarget.scrollLeft += e.deltaY; }}
        >
          <LedButton label="Product"       glowColor="#DCE5CA" deepColor="#DCE5CA" onClick={() => navigate('/product')} />
          <LedButton label="Method"        glowColor="#DFB2A9" deepColor="#b87060" onClick={() => navigate('/method')} />
          <LedButton label="Capabilities"  glowColor="#6D91B3" deepColor="#3e6a9a" onClick={() => navigate('/capabilities')} />
          <LedButton label="Intelligence"  glowColor="#AC81AF" deepColor="#865a8a" onClick={() => navigate('/intelligence')} />
          <LedButton label="Pricing"       glowColor="#D4A476" deepColor="#a07040" onClick={() => navigate('/pricing')} />
        </div>
      </div>

      {/* Right — contact + engine count */}
      <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <button onClick={() => navigate('/contact')} style={{
          padding: '4px 12px', borderRadius: 20, cursor: 'pointer',
          background: 'transparent', border: '1px solid rgba(0,0,0,0.18)',
          fontSize: 7.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#505860',
        }}>Contact</button>
        {featCount > 0 && (
          <div style={{
            padding: '4px 12px', borderRadius: 20,
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.88) 0%, rgba(220,224,232,0.82) 100%)',
            border: '1px solid rgba(0,0,0,0.16)',
            boxShadow: '0 1px 0 rgba(255,255,255,0.85) inset, 0 1px 3px rgba(0,0,0,0.14)',
            fontSize: 7.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
            color: '#1e2228', display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span style={{
              width: 5, height: 5, borderRadius: '50%', display: 'inline-block',
              background: '#DCE5CA', boxShadow: '0 0 5px rgba(220,229,202,0.9)',
              animation: 'pulse-dot 2.5s ease-in-out infinite',
            }} />
            {featCount} Engines
          </div>
        )}
      </div>
    </header>
  )
}

// ── Hero ──────────────────────────────────────────────────────────────────
function HeroSection() {
  const [, navigate] = useLocation()
  return (
    <section id="hero" className="hero-full" style={{
      paddingTop: HEADER_H + 32,
      background: 'linear-gradient(135deg, #EEF2F8 0%, #F4F7FC 55%, #E8EDF5 100%)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Background glows */}
      <div style={{
        position: 'absolute', top: '-10%', right: '-5%',
        width: 600, height: 600, borderRadius: '50%', pointerEvents: 'none',
        filter: 'blur(100px)', zIndex: 0,
        background: 'radial-gradient(circle, rgba(172,129,175,0.22) 0%, transparent 60%)',
      }} />
      <div style={{
        position: 'absolute', bottom: '5%', left: '-8%',
        width: 500, height: 500, borderRadius: '50%', pointerEvents: 'none',
        filter: 'blur(90px)', zIndex: 0,
        background: 'radial-gradient(circle, rgba(109,145,179,0.20) 0%, transparent 60%)',
      }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 680 }}>
        <Eyebrow color="#6D91B3">Live Threat Intelligence</Eyebrow>

        <h1 style={{
          margin: '0 0 24px', fontWeight: 800,
          fontSize: 'clamp(44px, 6vw, 82px)', lineHeight: 0.93, color: '#1e2228',
          textTransform: 'uppercase', letterSpacing: '-0.01em',
        }}>
          Detect<br />Threats<br />
          <span style={{
            color: '#A03940',
            display: 'block',
          }}>Before<br />They Strike</span>
        </h1>

        <p style={{ margin: '0 0 42px', fontSize: 13, lineHeight: 1.85, color: '#505860', maxWidth: 430 }}>
          AI-powered attack surface mapping, real-time threat visualization,
          and automated remediation — deployed in one session.
        </p>

        <CamoCTAWrapper style={{ marginBottom: 56 }}>
          <CTA label="Run Security Scan →" onClick={() => navigate('/lock')} large />
          <CTA label="View Dashboard" onClick={() => navigate('/dashboard')} outline large />
        </CamoCTAWrapper>

        <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap' }}>
          {[['7','Frameworks'],['5','Pipeline Stages'],['∞','Real-Time 3D']].map(([n, l]) => (
            <div key={l}>
              <div style={{
                fontSize: 'clamp(22px,2.8vw,34px)', fontWeight: 800, lineHeight: 1,
                color: '#6D91B3', fontVariantNumeric: 'tabular-nums',
              }}>{n}</div>
              <div style={{ fontSize: 8, color: '#606870', letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 6 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Method / Features ─────────────────────────────────────────────────────
function FeaturesSection() {
  return (
    <section id="features" className="section-pad" style={{
      background: 'linear-gradient(to bottom, #EDF1F7 0%, #E8EDF5 100%)',
      borderTop: '1px solid rgba(0,0,0,0.06)',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: 52, maxWidth: 580 }}>
          <Eyebrow color="#4a72a0">Method</Eyebrow>
          <h2 style={{
            margin: '0 0 14px', fontSize: 'clamp(26px,3vw,42px)', fontWeight: 800,
            color: '#1e2228', letterSpacing: '-0.02em', lineHeight: 1.05, textTransform: 'uppercase',
          }}>
            One platform.<br />
            <span style={{ color: '#AC81AF' }}>Complete coverage.</span>
          </h2>
          <p style={{ fontSize: 12.5, color: '#505860', lineHeight: 1.85 }}>
            From attack surface discovery to architectural remediation — everything in one session.
          </p>
        </div>

        <div className="features-grid">
          <FeatureCard
            accent="#DFB2A9" accentDeep="#b06858"
            icon="I"   title="3D Threat Mapping"
            desc="Your system's security topology rendered live — nodes, flow edges, and real-time threat propagation across your entire architecture."
          />
          <FeatureCard
            accent="#AC81AF" accentDeep="#865a8a"
            icon="II"  title="AI Attack Simulation"
            desc="STRIDE, MITRE ATT&CK, mutation fuzzing, and attack chain simulation — all scored and ranked in seconds, not weeks."
          />
          <FeatureCard
            accent="#6D91B3" accentDeep="#3e6090"
            icon="III" title="Auto-Remediation"
            desc="Every finding ships with a concrete fix, improved architecture diagram, and NIST CSF alignment — ready for your engineering team."
          />
        </div>
      </div>
    </section>
  )
}

// ── Capabilities ──────────────────────────────────────────────────────────
function CapabilitiesSection({ features }) {
  const [active, setActive] = useState('All')
  const cats = {
    'All':        features,
    'Threat':     features.filter(f => /threat|attack|stride|vuln/i.test(f.name || f.id || '')),
    'Compliance': features.filter(f => /grc|compliance|nist|soc|iso/i.test(f.name || f.id || '')),
    'AI-Sec':     features.filter(f => /ai|llm|ml|model/i.test(f.name || f.id || '')),
  }
  const shown = cats[active]?.length ? cats[active] : features

  return (
    <section id="capabilities" className="section-pad" style={{
      background: 'linear-gradient(to bottom, #E4EAF2 0%, #E8EDF5 100%)',
      borderTop: '1px solid rgba(0,0,0,0.07)',
    }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ marginBottom: 40, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 18 }}>
          <div>
            <Eyebrow color="#865a8a">Capabilities</Eyebrow>
            <h2 style={{ margin: '0 0 6px', fontSize: 'clamp(22px,2.5vw,34px)', fontWeight: 800, color: '#1e2228', textTransform: 'uppercase' }}>
              {features.length > 0 ? `${features.length} Detection Engines` : 'Detection Engines'}
            </h2>
            <p style={{ margin: 0, fontSize: 11.5, color: '#505860', letterSpacing: '0.04em' }}>
              Frameworks, modules, and threat intelligence systems
            </p>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {Object.keys(cats).map(g => (
              <button key={g} onClick={() => setActive(g)} style={{
                padding: '5px 14px', borderRadius: 3,
                border: `1px solid ${active === g ? 'rgba(0,0,0,0.20)' : 'rgba(0,0,0,0.10)'}`,
                background: active === g
                  ? 'linear-gradient(to bottom, rgba(255,255,255,0.88), rgba(223,178,169,0.60))'
                  : 'rgba(255,255,255,0.28)',
                color: active === g ? '#8a3820' : '#606870',
                fontSize: 8.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                textTransform: 'uppercase', letterSpacing: '0.12em', transition: 'all 0.14s',
                boxShadow: active === g ? '0 1px 0 rgba(255,255,255,0.8) inset, 0 2px 5px rgba(0,0,0,0.12)' : 'none',
              }}>
                {g}{g !== 'All' && cats[g]?.length > 0 ? ` (${cats[g].length})` : ''}
              </button>
            ))}
          </div>
        </div>

        {features.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '56px 0', color: '#606870', fontSize: 11 }}>Loading capabilities…</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 7 }}>
            {shown.map((f, i) => <CapCard key={i} f={f} />)}
          </div>
        )}
      </div>
    </section>
  )
}

// ── Footer ────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{
      background: `
        repeating-linear-gradient(90deg,
          transparent, transparent 2px,
          rgba(255,255,255,0.025) 2px, rgba(255,255,255,0.025) 3px),
        linear-gradient(to bottom, #c0c4d0, #b0b4c0)`,
      borderTop: '1px solid rgba(0,0,0,0.18)',
      boxShadow: '0 -1px 0 rgba(255,255,255,0.6) inset',
    }}>
      <div style={{
        padding: '22px 40px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 26, height: 26, borderRadius: 4, overflow: 'hidden', flexShrink: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.30)' }}>
            <img src={pyracryptGraphic} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
          <span style={{ fontSize: 8.5, fontWeight: 700, color: '#505860', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            Pyracrypt · AI-Powered Defense Intelligence
          </span>
        </div>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
          {['POST /pipeline', 'POST /suite', 'GET /features'].map(r => (
            <span key={r} style={{ fontSize: 8.5, color: '#707880', letterSpacing: '0.08em', fontWeight: 700 }}>{r}</span>
          ))}
        </div>
      </div>

      {/* Svivva cross-promo strip */}
      <div style={{
        borderTop: '1px solid rgba(0,0,0,0.12)',
        background: 'rgba(0,0,0,0.06)',
        padding: '10px 40px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
      }}>
        <span style={{ fontSize: 8, color: '#707880', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>
          Also from our ecosystem →
        </span>
        <a
          href="https://svivva.replit.app"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: 8.5, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase',
            color: '#865a8a', textDecoration: 'none',
            padding: '4px 12px', borderRadius: 20,
            border: '1px solid rgba(134,90,138,0.40)',
            background: 'rgba(134,90,138,0.08)',
            transition: 'background 0.15s',
          }}
        >
          Svivva ↗
        </a>
        <span style={{ fontSize: 8, color: '#909aa0', letterSpacing: '0.06em' }}>
          Secure your full stack — two tools, one ecosystem.
        </span>
      </div>
    </footer>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────
export default function App() {
  const loadFeatures = usePipelineStore(s => s.loadFeatures)
  const features     = usePipelineStore(s => s.features)

  useEffect(() => { loadFeatures() }, [loadFeatures])

  return (
    <div style={{ minHeight: '100vh', background: '#EDF1F7' }}>
      <Header featCount={features.length} />
      <HeroSection />
      <WireBar height={92} bgColor="#EDF1F7" />
      <FeaturesSection />
      <WireBar height={92} bgColor="#EDF1F7" />
      <CapabilitiesSection features={features} />
      <Footer />
    </div>
  )
}
