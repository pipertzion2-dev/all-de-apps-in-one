import { useState, useEffect } from 'react'
import { useLocation } from 'wouter'
import { LockUI, SCAN_MODES } from '../components/LockUI.jsx'
import { usePipelineStore } from '../store/usePipelineStore.js'

const STEP_LABELS = ['Hypothesizing attack surface…', 'Combining threat vectors…', 'Mutating attack chains…', 'Simulating breach paths…', 'Generating remediation…']

export default function LockPage() {
  const [, navigate] = useLocation()
  const [selectedModes, setSelectedModes] = useState(new Set(['surface', 'simulate', 'comply', 'remediate', 'hybrid']))
  const [target, setTarget] = useState('')
  const [targetError, setTargetError] = useState('')
  const [launched, setLaunched] = useState(false)

  const {
    busy, activeStepIndex, error,
    setSystem, runPipeline,
  } = usePipelineStore()

  // Navigate to dashboard when pipeline completes
  useEffect(() => {
    if (launched && !busy && activeStepIndex === 5) {
      setTimeout(() => navigate('/dashboard'), 600)
    }
  }, [launched, busy, activeStepIndex])

  // Also navigate on completion (activeStepIndex reaches end)
  useEffect(() => {
    if (launched && !busy && activeStepIndex >= 4 && activeStepIndex !== -1) {
      setTimeout(() => navigate('/dashboard'), 800)
    }
  }, [launched, busy, activeStepIndex])

  function toggleMode(id) {
    setSelectedModes(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        if (next.size === 1) return prev // keep at least one
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function handleUnlock() {
    if (busy) return
    const t = target.trim() || 'api.example.com'
    setTargetError('')
    setSystem(t)
    setLaunched(true)
    runPipeline()
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleUnlock()
  }

  const scanStep = busy ? activeStepIndex : -1

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #EEF2F8 0%, #F4F7FC 55%, #E8EDF5 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '72px 24px 48px',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Back to home */}
      <button onClick={() => navigate('/')} style={{
        position: 'absolute', top: 24, left: 24,
        padding: '6px 16px', borderRadius: 20, cursor: 'pointer',
        background: 'transparent', border: '1px solid rgba(0,0,0,0.15)',
        fontSize: 8, fontWeight: 700, letterSpacing: '0.14em',
        textTransform: 'uppercase', color: '#606870',
      }}>← Back</button>

      {/* Background glows */}
      <div style={{
        position: 'absolute', top: '5%', right: '8%',
        width: 480, height: 480, borderRadius: '50%', pointerEvents: 'none',
        filter: 'blur(100px)', zIndex: 0,
        background: 'radial-gradient(circle, rgba(172,129,175,0.18) 0%, transparent 60%)',
      }}/>
      <div style={{
        position: 'absolute', bottom: '8%', left: '5%',
        width: 380, height: 380, borderRadius: '50%', pointerEvents: 'none',
        filter: 'blur(90px)', zIndex: 0,
        background: 'radial-gradient(circle, rgba(109,145,179,0.16) 0%, transparent 60%)',
      }}/>

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 540, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{
            fontSize: 7, fontWeight: 800, letterSpacing: '0.28em',
            textTransform: 'uppercase', color: '#6D91B3', marginBottom: 10,
          }}>— Security Analysis Engine —</div>
          <h2 style={{
            fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 800,
            color: '#1e2228', letterSpacing: '-0.01em', textTransform: 'uppercase',
            margin: '0 0 8px', lineHeight: 1.1,
          }}>
            {busy ? 'Analyzing…' : 'Configure & Launch'}
          </h2>
          <p style={{ fontSize: 11, color: '#606870', lineHeight: 1.6, margin: 0, maxWidth: 340 }}>
            {busy
              ? STEP_LABELS[Math.max(0, activeStepIndex)]
              : 'Select scan modes, enter your target, click the keyhole to run.'}
          </p>
        </div>

        {/* Target input — only show when not scanning */}
        {!busy && (
          <div style={{
            width: '100%', marginBottom: 20,
            background: 'rgba(255,255,255,0.5)',
            border: targetError ? '1px solid rgba(190,100,80,0.5)' : '1px solid rgba(0,0,0,0.12)',
            borderRadius: 8, padding: '10px 14px',
            display: 'flex', alignItems: 'center', gap: 10,
            boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
          }}>
            <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#808890', flexShrink: 0 }}>
              TARGET
            </span>
            <input
              value={target}
              onChange={e => { setTarget(e.target.value); setTargetError('') }}
              onKeyDown={handleKeyDown}
              placeholder="api.example.com or https://…"
              style={{
                flex: 1, border: 'none', outline: 'none', background: 'transparent',
                fontSize: 12, color: '#1e2228', fontFamily: 'inherit',
                letterSpacing: '0.02em',
              }}
            />
            {target && (
              <button onClick={() => setTarget('')} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#a0a8b0', fontSize: 14, padding: '0 2px', lineHeight: 1,
              }}>×</button>
            )}
          </div>
        )}

        {/* Scan mode legend — only show when idle */}
        {!busy && (
          <div style={{ width: '100%', display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            {SCAN_MODES.map(mode => {
              const isOn = selectedModes.has(mode.id)
              return (
                <button
                  key={mode.id}
                  onClick={() => toggleMode(mode.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '5px 12px', borderRadius: 20, cursor: 'pointer',
                    background: isOn ? `${mode.color}22` : 'rgba(255,255,255,0.35)',
                    border: `1px solid ${isOn ? mode.color + '88' : 'rgba(0,0,0,0.10)'}`,
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: isOn ? mode.color : 'rgba(160,168,185,0.6)',
                    boxShadow: isOn ? `0 0 5px ${mode.color}` : 'none',
                    transition: 'all 0.15s', flexShrink: 0,
                  }}/>
                  <span style={{
                    fontSize: 7.5, fontWeight: 800, letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: isOn ? mode.deep : '#909aaa',
                    transition: 'color 0.15s',
                  }}>{mode.label}</span>
                </button>
              )
            })}
          </div>
        )}

        {/* THE LOCK */}
        <div style={{ position: 'relative' }}>
          <LockUI
            size={370}
            selectedModes={selectedModes}
            onModeToggle={toggleMode}
            onUnlock={handleUnlock}
            scanStep={scanStep}
            scanning={busy}
          />

          {/* Scanning overlay hint */}
          {busy && (
            <div style={{
              position: 'absolute', bottom: 52, left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(109,145,179,0.3)', borderRadius: 6,
              padding: '6px 16px', whiteSpace: 'nowrap',
              fontSize: 8, fontWeight: 800, letterSpacing: '0.18em',
              textTransform: 'uppercase', color: '#3e6a9a',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: '#6D91B3', boxShadow: '0 0 6px #6D91B3',
                animation: 'led-pulse 0.8s ease-in-out infinite',
              }}/>
              Step {Math.max(1, activeStepIndex + 1)} / 5 — {STEP_LABELS[Math.max(0, activeStepIndex)]?.split('…')[0]}
            </div>
          )}
        </div>

        {/* Progress bar */}
        {busy && (
          <div style={{
            width: '100%', maxWidth: 370, marginTop: 16,
            height: 3, background: 'rgba(0,0,0,0.08)', borderRadius: 2,
          }}>
            <div style={{
              height: '100%', borderRadius: 2,
              background: 'linear-gradient(to right, #6D91B3, #AC81AF)',
              width: `${Math.min(100, ((activeStepIndex + 1) / 5) * 100)}%`,
              transition: 'width 0.5s ease',
              boxShadow: '0 0 8px rgba(109,145,179,0.5)',
            }}/>
          </div>
        )}

        {/* Error */}
        {error && !busy && (
          <div style={{
            marginTop: 12, padding: '10px 16px', borderRadius: 7,
            background: 'rgba(190,100,80,0.1)', border: '1px solid rgba(190,100,80,0.3)',
            fontSize: 11, color: '#b06858', textAlign: 'center', width: '100%', maxWidth: 370,
          }}>
            {error} — <button onClick={handleUnlock} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#b06858', textDecoration: 'underline', fontSize: 11, fontFamily: 'inherit',
            }}>retry</button>
          </div>
        )}

        {/* Manual launch button below lock */}
        {!busy && (
          <button
            onClick={handleUnlock}
            style={{
              marginTop: 20, width: '100%', maxWidth: 370,
              padding: '14px 24px', borderRadius: 8, cursor: 'pointer',
              background: 'linear-gradient(135deg, rgba(109,145,179,0.15) 0%, rgba(172,129,175,0.15) 100%)',
              border: '1px solid rgba(109,145,179,0.4)',
              fontSize: 9, fontWeight: 800, letterSpacing: '0.2em',
              textTransform: 'uppercase', color: '#3e6a9a',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'linear-gradient(135deg, rgba(109,145,179,0.25) 0%, rgba(172,129,175,0.25) 100%)'}
            onMouseLeave={e => e.currentTarget.style.background = 'linear-gradient(135deg, rgba(109,145,179,0.15) 0%, rgba(172,129,175,0.15) 100%)'}
          >
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: '#6D91B3', boxShadow: '0 0 7px #6D91B3',
              animation: 'pulse-dot 2s ease-in-out infinite',
            }}/>
            Unlock & Run Full Scan
            <span style={{ fontSize: 14, opacity: 0.7 }}>→</span>
          </button>
        )}

        {/* Scan mode descriptions */}
        {!busy && (
          <div style={{
            marginTop: 24, width: '100%', maxWidth: 370,
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
          }}>
            {SCAN_MODES.map(mode => {
              const isOn = selectedModes.has(mode.id)
              return (
                <div key={mode.id} style={{
                  padding: '10px 12px', borderRadius: 7,
                  background: isOn ? `${mode.color}10` : 'rgba(255,255,255,0.3)',
                  border: `1px solid ${isOn ? mode.color + '44' : 'rgba(0,0,0,0.07)'}`,
                  transition: 'all 0.15s',
                }}>
                  <div style={{
                    fontSize: 7, fontWeight: 800, letterSpacing: '0.14em',
                    textTransform: 'uppercase', color: isOn ? mode.deep : '#909aaa',
                    marginBottom: 4, transition: 'color 0.15s',
                  }}>{mode.label}</div>
                  <div style={{ fontSize: 9.5, color: isOn ? '#505860' : '#a0aab8', lineHeight: 1.5, transition: 'color 0.15s' }}>
                    {mode.sublabel}
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}
