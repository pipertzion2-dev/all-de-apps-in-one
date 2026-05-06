import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'wavy_admin_secret'
const API_BASE = import.meta.env.VITE_API_URL ?? ''

async function getBootstrap() {
  const r = await fetch(`${API_BASE}/api/admin/bootstrap`)
  if (!r.ok) throw new Error(await r.text())
  return r.json()
}

async function getOverview(secret) {
  const r = await fetch(`${API_BASE}/api/admin/overview`, {
    headers: { 'X-Admin-Secret': secret },
  })
  if (!r.ok) {
    const t = await r.text()
    throw new Error(t || `HTTP ${r.status}`)
  }
  return r.json()
}

async function getTemplate(secret) {
  const r = await fetch(`${API_BASE}/api/admin/replit-env-template`, {
    headers: { 'X-Admin-Secret': secret },
  })
  if (!r.ok) throw new Error(await r.text())
  return r.json()
}

export default function AdminConsole() {
  const [bootstrap, setBootstrap] = useState(null)
  const [secret, setSecret] = useState(() => sessionStorage.getItem(STORAGE_KEY) || '')
  const [overview, setOverview] = useState(null)
  const [template, setTemplate] = useState('')
  const [err, setErr] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    document.title = 'Admin · Pyracrypt'
    getBootstrap()
      .then(setBootstrap)
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false))
  }, [])

  const loadLocked = useCallback(async (s) => {
    setErr(null)
    const o = await getOverview(s)
    setOverview(o)
    sessionStorage.setItem(STORAGE_KEY, s)
    try {
      const t = await getTemplate(s)
      setTemplate(t.content || '')
    } catch {
      setTemplate(o.replit_env_template || '')
    }
  }, [])

  useEffect(() => {
    if (!bootstrap?.admin_secret_configured) return undefined
    const s = sessionStorage.getItem(STORAGE_KEY)
    if (!s) return undefined
    let cancelled = false
    ;(async () => {
      try {
        const o = await getOverview(s)
        if (cancelled) return
        setOverview(o)
        sessionStorage.setItem(STORAGE_KEY, s)
        try {
          const t = await getTemplate(s)
          if (!cancelled) setTemplate(t.content || '')
        } catch {
          if (!cancelled) setTemplate(o.replit_env_template || '')
        }
      } catch (e) {
        if (!cancelled) {
          setErr(e?.message || 'Session unlock failed')
          sessionStorage.removeItem(STORAGE_KEY)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [bootstrap])

  const unlock = async () => {
    setErr(null)
    setOverview(null)
    setTemplate('')
    try {
      await loadLocked(secret)
    } catch (e) {
      setErr(e?.message || 'Unlock failed')
      sessionStorage.removeItem(STORAGE_KEY)
    }
  }

  const copyTemplate = () => {
    const text = template || overview?.replit_env_template || ''
    if (!text) return
    navigator.clipboard.writeText(text)
  }

  const logout = () => {
    sessionStorage.removeItem(STORAGE_KEY)
    setSecret('')
    setOverview(null)
    setTemplate('')
  }

  return (
    <div className="u-bg u-text min-h-full">
      <header className="u-border border-b u-bg-danger-soft px-6 py-4">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-base font-semibold u-danger">Administrator console</h1>
            <p className="mt-1 text-xs u-muted">
              Hidden from the main app UI. Open <span className="u-text">/admin</span> on your deployment only.
            </p>
          </div>
          <a href="/" className="text-xs u-primary underline">
            ← Back to app
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 p-6">
        {loading ? <p className="text-sm u-muted">Loading bootstrap…</p> : null}
        {err ? <div className="rounded-lg border u-border u-bg-danger-soft p-3 text-sm u-danger">{err}</div> : null}

        {bootstrap ? (
          <section className="u-card u-border rounded-xl p-4 shadow-sm">
            <h2 className="text-sm font-semibold u-text">Replit quick start</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm u-muted">
              {bootstrap.first_time_steps?.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
            <p className="mt-3 font-mono text-xs u-muted">{bootstrap.replit?.recommended_run}</p>
          </section>
        ) : null}

        <section className="u-card u-border rounded-xl p-4 shadow-sm">
          <h2 className="text-sm font-semibold u-text">Admin secret</h2>
          <p className="mt-1 text-xs u-muted">
            Must match server env <span className="font-mono u-text">ADMIN_SECRET</span> (Replit Secrets). End users
            never see this screen.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <input
              type="password"
              className="min-w-[220px] flex-1 rounded-lg border u-border bg-transparent px-3 py-2 text-sm u-text outline-none focus:u-ring-accent"
              placeholder="ADMIN_SECRET"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
            />
            <button
              type="button"
              className="rounded-lg border u-border px-4 py-2 text-sm font-medium u-primary hover:u-bg-accent-soft"
              onClick={() => unlock()}
            >
              Save &amp; load overview
            </button>
            <button
              type="button"
              className="rounded-lg border u-border px-4 py-2 text-sm u-muted hover:u-bg-primary-soft"
              onClick={() => logout()}
            >
              Clear session
            </button>
          </div>
          {!bootstrap?.admin_secret_configured ? (
            <p className="mt-3 text-xs font-medium u-danger">
              ADMIN_SECRET is not set on the server. Add it in Replit → Secrets, restart Run, then return here.
            </p>
          ) : null}
        </section>

        {overview ? (
          <>
            <section className="u-card u-border rounded-xl p-4 shadow-sm">
              <h2 className="text-sm font-semibold u-text">LLM &amp; connectivity</h2>
              <pre className="mt-2 overflow-x-auto rounded-lg u-bg-primary-soft p-3 text-xs u-text">
                {JSON.stringify(overview.llm, null, 2)}
              </pre>
            </section>

            <section className="u-card u-border rounded-xl p-4 shadow-sm">
              <h2 className="text-sm font-semibold u-text">Server</h2>
              <pre className="mt-2 overflow-x-auto rounded-lg u-bg-primary-soft p-3 text-xs u-text">
                {JSON.stringify(overview.server, null, 2)}
              </pre>
            </section>

            <section className="u-card u-border rounded-xl p-4 shadow-sm">
              <h2 className="text-sm font-semibold u-text">API surface</h2>
              <pre className="mt-2 overflow-x-auto rounded-lg u-bg-primary-soft p-3 text-xs u-text">
                {JSON.stringify(overview.api_surface, null, 2)}
              </pre>
            </section>

            <section className="u-card u-border rounded-xl p-4 shadow-sm">
              <h2 className="text-sm font-semibold u-text">Integrations roadmap</h2>
              <p className="mt-1 text-xs u-muted">
                <span className="u-text">available</span> = used by the app today. <span className="u-text">planned</span>{' '}
                = env keys reserved for you to wire next.
              </p>
              <ul className="mt-3 space-y-3">
                {overview.integrations?.map((row) => (
                  <li key={row.id} className="rounded-lg border u-border p-3 text-sm">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="font-semibold u-text">{row.name}</span>
                      <span className="text-xs uppercase u-accent">{row.status}</span>
                    </div>
                    <p className="mt-1 text-xs u-muted">{row.notes}</p>
                    <p className="mt-1 font-mono text-xs u-primary">{row.env?.join(' · ')}</p>
                  </li>
                ))}
              </ul>
            </section>

            <section className="u-card u-border rounded-xl p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-semibold u-text">Replit / env template</h2>
                <button
                  type="button"
                  className="rounded-lg border u-border px-3 py-1.5 text-xs font-medium u-success hover:u-bg-success-soft"
                  onClick={copyTemplate}
                >
                  Copy to clipboard
                </button>
              </div>
              <pre className="mt-2 max-h-64 overflow-auto rounded-lg u-bg-accent-soft p-3 text-xs u-text whitespace-pre-wrap">
                {template || overview.replit_env_template}
              </pre>
            </section>

            <section className="u-card u-border rounded-xl p-4 shadow-sm">
              <h2 className="text-sm font-semibold u-text">Frontend build env</h2>
              <pre className="mt-2 overflow-x-auto rounded-lg u-bg-primary-soft p-3 text-xs u-text">
                {JSON.stringify(overview.frontend_build_env, null, 2)}
              </pre>
            </section>
          </>
        ) : null}
      </main>
    </div>
  )
}
