import { useLocation } from 'wouter'

const FEATURES = [
  { icon: '⬡', title: '3D Threat Mapping', color: '#DFB2A9', desc: 'Your entire attack surface rendered as a live 3D topology. Every node, connection, and threat vector visible in real time — not a static diagram, a living map of your infrastructure.' },
  { icon: '⬡', title: 'AI Attack Simulation', color: '#AC81AF', desc: 'STRIDE, MITRE ATT&CK, mutation fuzzing, and attack chain simulation run simultaneously. Scored and ranked in seconds, not weeks. Know your weakest points before attackers do.' },
  { icon: '⬡', title: 'Auto-Remediation Engine', color: '#6D91B3', desc: 'Every finding ships with a concrete architectural fix, improved diagram, and NIST CSF alignment — ready for your engineering team to implement immediately.' },
  { icon: '⬡', title: '37 AI Engines', color: '#DCE5CA', desc: 'A pipeline of 37 specialized AI models — each one trained on a different class of vulnerability. They run in parallel and cross-validate each other\'s findings.' },
  { icon: '⬡', title: 'One-Session Deployment', color: '#DFB2A9', desc: 'From zero to full security posture in a single working session. No agent installs, no long onboarding, no consultant fees. Just connect and go.' },
  { icon: '⬡', title: 'Framework Agnostic', color: '#AC81AF', desc: 'Works with any architecture — cloud native, on-prem, hybrid, legacy. AWS, Azure, GCP, Kubernetes, bare metal. If it\'s on a network, Wavy can see it.' },
]

export default function ProductPage() {
  const [, navigate] = useLocation()
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #EEF2F8 0%, #F4F7FC 60%, #E8EDF5 100%)', paddingTop: 80 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 80px' }}>

        {/* Eyebrow */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span style={{ width: 20, height: 1.5, background: '#DCE5CA', display: 'inline-block', borderRadius: 1 }}/>
          <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#606870' }}>Product</span>
          <span style={{ width: 20, height: 1.5, background: '#DCE5CA', display: 'inline-block', borderRadius: 1 }}/>
        </div>

        <h1 style={{ fontSize: 'clamp(36px,5vw,72px)', fontWeight: 800, color: '#1e2228', textTransform: 'uppercase', lineHeight: 0.95, letterSpacing: '-0.02em', margin: '0 0 28px' }}>
          Security that<br/>
          <span style={{
            backgroundImage: 'linear-gradient(135deg, #DCE5CA 0%, #eaf2d8 50%, #DCE5CA 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>thinks for you</span>
        </h1>

        <p style={{ fontSize: 13.5, color: '#505860', lineHeight: 1.9, maxWidth: 560, marginBottom: 52 }}>
          Wavy is not a scanner. It's a reasoning system that understands your architecture, models how attackers think, and generates security intelligence your team can act on — immediately.
        </p>

        {/* Feature grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20, marginBottom: 64 }}>
          {FEATURES.map(f => (
            <div key={f.title} style={{
              background: 'rgba(255,255,255,0.42)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.6)',
              borderRadius: 10,
              padding: '24px 26px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: f.color, letterSpacing: '0.08em', marginBottom: 10 }}>
                {f.title}
              </div>
              <p style={{ fontSize: 12, color: '#505860', lineHeight: 1.8, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/dashboard')} style={{
            padding: '12px 32px', borderRadius: 6, cursor: 'pointer',
            background: 'rgba(220,229,202,0.15)', border: '1px solid rgba(220,229,202,0.5)',
            backdropFilter: 'blur(12px)', fontSize: 9, fontWeight: 800,
            letterSpacing: '0.16em', textTransform: 'uppercase', color: '#283822',
          }}>
            Try the Dashboard →
          </button>
          <button onClick={() => navigate('/contact')} style={{
            padding: '12px 32px', borderRadius: 6, cursor: 'pointer',
            background: 'transparent', border: '1px solid rgba(0,0,0,0.18)',
            fontSize: 9, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#505860',
          }}>
            Talk to Us
          </button>
        </div>
      </div>
    </div>
  )
}
