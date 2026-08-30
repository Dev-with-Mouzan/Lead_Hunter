import type { SearchSession } from '../types'

const HISTORY_KEY = 'odify_search_history'

export function getSearchHistory(): SearchSession[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function addSearchSession(session: Omit<SearchSession, 'id'>): SearchSession {
  const history = getSearchHistory()
  const newSession: SearchSession = {
    ...session,
    id: crypto.randomUUID?.() ?? Date.now().toString(36),
  }
  history.unshift(newSession)
  // Keep last 50 sessions
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 50)))
  return newSession
}

export function removeSearchSession(id: string) {
  const history = getSearchHistory()
  localStorage.setItem(
    HISTORY_KEY,
    JSON.stringify(history.filter(s => s.id !== id)),
  )
}

export function clearSearchHistory() {
  localStorage.removeItem(HISTORY_KEY)
}
