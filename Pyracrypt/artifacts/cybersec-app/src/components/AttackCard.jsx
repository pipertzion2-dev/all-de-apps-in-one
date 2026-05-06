const glass = {
  background: 'color-mix(in srgb,var(--danger) 5%,rgba(255,255,255,0.78))',
  backdropFilter: 'blur(14px) saturate(160%)',
  WebkitBackdropFilter: 'blur(14px) saturate(160%)',
  border: '1px solid color-mix(in srgb,var(--danger) 18%,rgba(255,255,255,0.5))',
  borderRadius: 14,
  padding: '16px 18px',
  boxShadow: '0 4px 20px color-mix(in srgb,var(--danger) 8%,transparent)',
}

export function AttackCard({ mutated, attackSteps }) {
  const empty = !mutated?.mutations?.length && !mutated?.findings?.length && !attackSteps?.length
  return (
    <section style={glass}>
      <header style={{ marginBottom:12, display:'flex', alignItems:'center', justifyContent:'space-between', gap:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{
            width:26, height:26, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center',
            background:'color-mix(in srgb,var(--danger) 14%,rgba(255,255,255,0.7))',
            fontSize:13, color:'var(--danger)',
          }}>⚠</span>
          <h2 style={{ margin:0, fontSize:12, fontWeight:700, color:'var(--text)', letterSpacing:'0.02em' }}>Attack Surface</h2>
        </div>
        <span style={{ fontSize:9, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.08em' }}>Mutations + chain</span>
      </header>
      {empty ? (
        <div style={{ textAlign:'center', padding:'28px 0', color:'var(--muted)', fontSize:11 }}>No attack data yet</div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {mutated?.mutations?.length > 0 && (
            <div>
              <p style={{ margin:'0 0 6px', fontSize:9, fontWeight:700, color:'var(--danger)', textTransform:'uppercase', letterSpacing:'0.1em' }}>Mutations</p>
              <ul style={{ listStyle:'none', padding:0, margin:0, display:'flex', flexDirection:'column', gap:5 }}>
                {mutated.mutations.slice(0, 4).map((m, i) => (
                  <li key={i} style={{
                    borderRadius:7, padding:'8px 11px', fontSize:11.5, color:'var(--text)',
                    background:'color-mix(in srgb,var(--danger) 8%,rgba(255,255,255,0.7))',
                    border:'1px solid color-mix(in srgb,var(--danger) 14%,transparent)',
                  }}>{m}</li>
                ))}
              </ul>
            </div>
          )}
          {mutated?.findings?.length > 0 && (
            <div>
              <p style={{ margin:'0 0 6px', fontSize:9, fontWeight:700, color:'var(--danger)', textTransform:'uppercase', letterSpacing:'0.1em' }}>Findings</p>
              <ul style={{ listStyle:'none', padding:0, margin:0, display:'flex', flexDirection:'column', gap:5 }}>
                {mutated.findings.slice(0, 4).map((f, i) => (
                  <li key={i} style={{
                    borderRadius:7, padding:'8px 11px',
                    border:'1px solid color-mix(in srgb,var(--danger) 14%,rgba(255,255,255,0.4))',
                    background:'rgba(255,255,255,0.5)',
                  }}>
                    <p style={{ margin:0, fontSize:11, color:'var(--muted)', fontWeight:600 }}>{f.mutation}</p>
                    {f.failure
                      ? <p style={{ margin:'3px 0 0', fontSize:10.5, color:'var(--danger)' }}>{f.failure}</p>
                      : <p style={{ margin:'3px 0 0', fontSize:10, color:'var(--success)' }}>✓ No failure</p>
                    }
                  </li>
                ))}
              </ul>
            </div>
          )}
          {attackSteps?.length > 0 && (
            <div>
              <p style={{ margin:'0 0 6px', fontSize:9, fontWeight:700, color:'var(--accent)', textTransform:'uppercase', letterSpacing:'0.1em' }}>Simulated chain</p>
              <ol style={{ paddingLeft:18, margin:0, display:'flex', flexDirection:'column', gap:4 }}>
                {attackSteps.map((s, i) => (
                  <li key={i} style={{ fontSize:11.5, color:'var(--text)', lineHeight:1.55 }}>{s}</li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
