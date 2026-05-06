import { useLocation } from 'wouter'

const STEPS = [
  { num: '01', title: 'Connect', color: '#DCE5CA', desc: 'Point Wavy at your system — URL, IP range, cloud account, or architecture diagram. No agents, no installs. It discovers everything automatically.' },
  { num: '02', title: 'Map', color: '#DFB2A9', desc: 'The AI builds a living 3D model of your infrastructure — every service, dependency, data flow, and trust boundary. This becomes your security baseline.' },
  { num: '03', title: 'Simulate', color: '#6D91B3', desc: '37 AI engines run simultaneously: STRIDE analysis, MITRE ATT&CK mapping, mutation fuzzing, lateral movement simulation, and supply chain probing.' },
  { num: '04', title: 'Score', color: '#AC81AF', desc: 'Every finding is ranked by exploitability, blast radius, and business impact. You see your actual risk exposure — not a raw list of CVEs.' },
  { num: '05', title: 'Fix', color: '#DCE5CA', desc: 'Each finding includes a concrete fix: updated architecture, patched code, configuration change — with a before/after comparison and NIST CSF alignment.' },
]

export default function MethodPage() {
  const [, navigate] = useLocation()
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #EEF2F8 0%, #F4F7FC 60%, #E8EDF5 100%)', paddingTop: 80 }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '60px 80px' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span style={{ width: 20, height: 1.5, background: '#DFB2A9', display: 'inline-block', borderRadius: 1 }}/>
          <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#606870' }}>Method</span>
          <span style={{ width: 20, height: 1.5, background: '#DFB2A9', display: 'inline-block', borderRadius: 1 }}/>
        </div>

        <h1 style={{ fontSize: 'clamp(36px,5vw,72px)', fontWeight: 800, color: '#1e2228', textTransform: 'uppercase', lineHeight: 0.95, letterSpacing: '-0.02em', margin: '0 0 16px' }}>
          One platform.<br/>
          <span style={{
            backgroundImage: 'linear-gradient(135deg, #a06858 0%, #DFB2A9 40%, #f0cfc8 60%, #DFB2A9 80%, #a06858 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>Complete coverage.</span>
        </h1>

        <p style={{ fontSize: 13.5, color: '#505860', lineHeight: 1.9, maxWidth: 520, marginBottom: 64 }}>
          From attack surface discovery to architectural remediation — every step in a single, unified session. No hand-offs, no gaps, no waiting.
        </p>

        {/* Steps */}
        <div style={{ position: 'relative' }}>
          {/* Timeline line */}
          <div style={{ position: 'absolute', left: 27, top: 32, bottom: 32, width: 1, background: 'linear-gradient(to bottom, rgba(0,0,0,0.08), rgba(0,0,0,0.04))' }}/>

          {STEPS.map((step, i) => (
            <div key={step.num} style={{ display: 'flex', gap: 32, marginBottom: 44, position: 'relative' }}>
              {/* Number circle */}
              <div style={{
                width: 54, height: 54, borderRadius: '50%', flexShrink: 0,
                background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(10px)',
                border: `2px solid ${step.color}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 800, color: step.color, letterSpacing: '0.05em',
                boxShadow: `0 0 18px ${step.color}44`,
                zIndex: 1,
              }}>
                {step.num}
              </div>
              {/* Content */}
              <div style={{ paddingTop: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#1e2228', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                  {step.title}
                </div>
                <p style={{ fontSize: 12.5, color: '#505860', lineHeight: 1.85, margin: 0, maxWidth: 560 }}>
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 20, display: 'flex', gap: 14 }}>
          <button onClick={() => navigate('/dashboard')} style={{
            padding: '12px 32px', borderRadius: 6, cursor: 'pointer',
            background: 'rgba(220,229,202,0.15)', border: '1px solid rgba(220,229,202,0.5)',
            backdropFilter: 'blur(12px)', fontSize: 9, fontWeight: 800,
            letterSpacing: '0.16em', textTransform: 'uppercase', color: '#283822',
          }}>
            Start a Session →
          </button>
        </div>
      </div>
    </div>
  )
}
