// Empty base = same origin (Replit / Vite dev): requests go through Vite proxy → FastAPI.
// Set VITE_API_URL only if the API is on another host.
const API_BASE = import.meta.env.VITE_API_URL ?? ''

async function get(path) {
  const res = await fetch(`${API_BASE}${path}`)
  if (!res.ok) {
    const t = await res.text()
    throw new Error(t || `Request failed: ${res.status}`)
  }
  return res.json()
}

async function post(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(t || `Request failed: ${res.status}`)
  }
  return res.json()
}

export const api = {
  features: () => get('/features'),
  hypothesis: (system) => post('/hypothesis', { system }),
  combine: (system) => post('/combine', { system }),
  mutate: (system) => post('/mutate', { system }),
  simulate: (hypothesis) => post('/simulate', { hypothesis }),
  remedy: (attack) => post('/remedy', { attack }),
  pipeline: (system) => post('/pipeline', { system }),
  suite: (system) => post('/suite', { system }),
}
