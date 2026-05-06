import { useState, useCallback } from 'react'
import './App.css'
import { LeftPanel } from './LeftPanel'
import { CenterPanel } from './CenterPanel'
import { RightPanel } from './RightPanel'
import { CtaBar } from './CtaBar'
import { SEOBlock } from './SEOBlock'
import { generatePreview } from './preview'
import type { PreviewResult, FormState } from './types'

const SVIVVA_URL = 'https://svivva.com'

export default function App() {
  const [form, setForm] = useState<FormState>({
    description: '',
    mode: 'hardware',
    budget: '',
    genre: '',
    materials: '',
    region: '',
    collaborationSize: '',
  })
  const [preview, setPreview] = useState<PreviewResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = useCallback(async () => {
    if (!form.description.trim()) {
      setError('Please enter a short description.')
      return
    }
    setError(null)
    setLoading(true)
    setPreview(null)
    try {
      const result = await generatePreview(form)
      setPreview(result)
      track('preview generated', { mode: form.mode })
    } catch (e) {
      setError('Preview failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [form])

  const handleCtaClick = useCallback(() => {
    track('CTA click', { type: 'primary' })
    window.open(SVIVVA_URL, '_blank')
  }, [])

  const handleSecondaryCta = useCallback(() => {
    track('CTA click', { type: 'secondary' })
    window.open(SVIVVA_URL, '_blank')
  }, [])

  return (
    <div className="app">
      <header className="seo-header">
        <h1>Hardware Compliance Checker — Free Risk & Regulatory Scanner</h1>
      </header>

      <div className="three-panel">
        <LeftPanel
          form={form}
          onChange={setForm}
          onSubmit={handleSubmit}
          loading={loading}
          error={error}
          onModuleInterest={trackModuleInterest}
        />
        <CenterPanel preview={preview} loading={loading} onSecondaryCta={handleSecondaryCta} />
        <RightPanel preview={preview} mode={form.mode} />
      </div>

      <CtaBar onPrimaryCta={handleCtaClick} />

      <SEOBlock />
    </div>
  )
}

function track(event: string, data?: Record<string, string>) {
  if (typeof window !== 'undefined' && (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag) {
    (window as unknown as { gtag: (...a: unknown[]) => void }).gtag('event', event, data)
  }
  console.log('[analytics]', event, data)
}

function trackModuleInterest(mode: string) {
  track('module interest', { module: mode })
}
