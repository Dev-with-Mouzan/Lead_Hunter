const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

// ── Types ──

export interface PlaceLeadDTO {
  name: string
  phone: string
  address: string
  email: string
  website: string
}

export interface WebLeadDTO {
  url: string
  emails: string[]
  phones: string[]
  emails_str: string
  phones_str: string
}

export interface SearchPlacesResponse {
  session_id: string
  results: PlaceLeadDTO[]
}

export interface SearchWebResponse {
  session_id: string
  results: WebLeadDTO[]
}

export interface ServerSessionDTO {
  id: string
  mode: 'places' | 'web'
  query: string
  location: string
  max_results: number
  result_count: number
  phone_count: number
  timestamp: number
}

export interface ServerStats {
  sessions: number
  leads: number
  phones: number
  places_sessions: number
  web_sessions: number
}

export interface ServerStatsResponse {
  stats: ServerStats
  sessions: ServerSessionDTO[]
}

export type SessionResult = PlaceLeadDTO | WebLeadDTO

export interface SessionDetailDTO extends ServerSessionDTO {
  results: SessionResult[]
}

export interface ApiInfo {
  ok: boolean
  app: string
}

export interface PingResult {
  online: boolean
  latency: number | null
  app: string | null
}

export interface BackendConfig {
  app: string
  version: string
  places: { enabled: boolean; provider: string; api_key: boolean }
  web: { enabled: boolean; provider: string }
  endpoints: string[]
}

// ── Google Places Search ──

export async function searchPlaces(
  niche: string,
  location: string,
  maxResults: number,
): Promise<SearchPlacesResponse> {
  const params = new URLSearchParams()
  params.set('niche', niche)
  params.set('location', location)
  params.set('max_results', String(maxResults))
  const res = await fetch(`${BASE}/search-places`, { method: 'POST', body: params })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Search failed (${res.status})`)
  }
  return res.json()
}

// ── DuckDuckGo Web Search ──

export async function searchWeb(
  niche: string,
  country: string,
  maxResults: number,
): Promise<SearchWebResponse> {
  const params = new URLSearchParams()
  params.set('niche', niche)
  params.set('country', country)
  params.set('max_results', String(maxResults))
  const res = await fetch(`${BASE}/search`, { method: 'POST', body: params })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Search failed (${res.status})`)
  }
  return res.json()
}

// ── Download Helpers ──

export function csvUrl(sessionId: string) {
  return `${BASE}/download/csv/${sessionId}`
}

export function vcardUrl(sessionId: string, idx: number) {
  return `${BASE}/download/vcard/${sessionId}/${idx}`
}

export function allVcardsUrl(sessionId: string) {
  return `${BASE}/download/all-vcards/${sessionId}`
}

export function dbUrl() {
  return `${BASE}/download/db`
}

export function allHistoryCsvUrl() {
  return `${BASE}/download/all-history.csv`
}

// ── Server Stats & Health ──

export async function pingApi(): Promise<PingResult> {
  const start = performance.now()
  try {
    const res = await fetch(`${BASE}/health`)
    const data = await res.json()
    return {
      online: data.ok === true,
      latency: Math.round(performance.now() - start),
      app: data.app ?? null,
    }
  } catch {
    return { online: false, latency: null, app: null }
  }
}

export async function getServerStats(): Promise<ServerStatsResponse> {
  const res = await fetch(`${BASE}/stats`)
  if (!res.ok) throw new Error(`Failed to load stats (${res.status})`)
  return res.json()
}

export async function getSessionDetail(sessionId: string): Promise<SessionDetailDTO | null> {
  const res = await fetch(`${BASE}/sessions/${sessionId}`)
  if (!res.ok) return null
  return res.json()
}

export async function getBackendConfig(): Promise<BackendConfig | null> {
  try {
    const res = await fetch(`${BASE}/config`)
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

// ── Health Check ──

export async function healthCheck(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/health`)
    const data = await res.json()
    return data.ok === true
  } catch {
    return false
  }
}

export async function getApiInfo(): Promise<ApiInfo | null> {
  try {
    const res = await fetch(`${BASE}/health`)
    return await res.json()
  } catch {
    return null
  }
}
