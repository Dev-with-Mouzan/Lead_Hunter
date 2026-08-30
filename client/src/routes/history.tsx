import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useNavigate } from '@tanstack/react-router'
import {
  Search, Building2, Phone, Globe, Trash2, Calendar, MapPin,
  Download, Copy, ExternalLink, Mail, Loader2,
  AlertCircle, RefreshCw, Files, ChevronRight,
} from 'lucide-react'
import {
  getSearchHistory, removeSearchSession, clearSearchHistory,
} from '../lib/storage'
import { pingApi, getServerStats, getSessionDetail, csvUrl, allVcardsUrl, dbUrl, allHistoryCsvUrl } from '../lib/api'
import type { PingResult, ServerSessionDTO, SessionDetailDTO } from '../lib/api'
import { isPlaceLead, isWebLead } from '../types'
import type { SearchSession } from '../types'
import { toast } from './__root'
import { BgAnimation } from '../components/landing/bg-animation'

function timeAgo(ts: number): string {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Yesterday'
  return `${days}d ago`
}

function formatDate(ts: number): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  }).format(new Date(ts))
}

type HistoryItem = {
  id: string
  mode: 'places' | 'web'
  query: string
  location: string
  resultCount: number
  phoneCount: number
  timestamp: number
  source: 'server' | 'local'
}

export function HistoryPage() {
  const [localHistory, setLocalHistory] = useState<SearchSession[]>([])
  const [ping, setPing] = useState<PingResult>({ online: false, latency: null, app: null })
  const [serverSessions, setServerSessions] = useState<ServerSessionDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<'all' | 'places' | 'web'>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<SessionDetailDTO | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const navigate = useNavigate()
  const fetchSeq = useRef(0)

  const load = useCallback(async () => {
    setRefreshing(true)
    const p = await pingApi()
    setPing(p)
    if (p.online) {
      try {
        const res = await getServerStats()
        setServerSessions(res.sessions)
      } catch {
        setServerSessions([])
      }
    } else {
      setServerSessions([])
    }
    setRefreshing(false)
    setLoading(false)
  }, [])

  useEffect(() => {
    setLocalHistory(getSearchHistory())
    load()
  }, [load])

  const online = ping.online
  const history: HistoryItem[] = online
    ? serverSessions.map(s => ({
        id: s.id,
        mode: s.mode,
        query: s.query,
        location: s.location,
        resultCount: s.result_count,
        phoneCount: s.phone_count,
        timestamp: s.timestamp,
        source: 'server' as const,
      }))
    : localHistory.map<HistoryItem>(s => ({
        id: s.id,
        mode: s.mode,
        query: s.query,
        location: s.location,
        resultCount: s.resultCount,
        phoneCount: s.phoneCount,
        timestamp: s.timestamp,
        source: 'local' as const,
      }))

  const filtered = filter === 'all' ? history : history.filter(h => h.mode === filter)

  const totalLeads = history.reduce((a, s) => a + s.resultCount, 0)
  const totalPhones = history.reduce((a, s) => a + s.phoneCount, 0)

  const openDetail = async (id: string) => {
    const isTogglingClose = expandedId === id
    setExpandedId(prev => (prev === id ? null : id))
    if (isTogglingClose) return
    setDetail(null)
    setDetailError(null)
    setDetailLoading(true)

    const item = history.find(h => h.id === id)
    if (item?.source === 'local') {
      const local = localHistory.find(s => s.id === id)
      const results = local?.results
      if (results && results.length > 0) {
        setDetail({ mode: local!.mode, results } as unknown as SessionDetailDTO)
      } else {
        setDetailError('Lead details are not stored on this device for this session.')
      }
      setDetailLoading(false)
      return
    }

    const seq = ++fetchSeq.current
    try {
      const d = await getSessionDetail(id)
      if (seq !== fetchSeq.current) return
      if (!d) {
        setDetailError('This session is no longer available on the server.')
      } else {
        setDetail(d)
      }
    } catch {
      if (seq === fetchSeq.current) setDetailError('Failed to load session details')
    } finally {
      if (seq === fetchSeq.current) setDetailLoading(false)
    }
  }

  const handleDelete = (id: string) => {
    removeSearchSession(id)
    setLocalHistory(getSearchHistory())
    setExpandedId(null)
    toast('Search removed from history')
  }

  const handleClearAll = () => {
    clearSearchHistory()
    setLocalHistory([])
    setExpandedId(null)
    toast('Search history cleared')
  }

  const filters: { id: typeof filter; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: history.length },
    { id: 'places', label: 'Places', count: history.filter(h => h.mode === 'places').length },
    { id: 'web', label: 'Web', count: history.filter(h => h.mode === 'web').length },
  ]

  return (
    <div className="min-h-screen bg-background">
      <BgAnimation />
      {/* Ambient Glows */}
      <div className="fixed top-[-20%] left-[10%] w-[50vw] h-[50vw] rounded-full bg-primary/5 blur-[150px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[5%] w-[40vw] h-[40vw] rounded-full bg-accent/3 blur-[120px] pointer-events-none" />

      {/* Grid pattern */}
      <div
        className="fixed inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '80px 80px',
        }}
      />

      {/* Main Content */}
      <section className="relative z-10 px-6 pt-24 pb-20 max-w-6xl mx-auto">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center gap-4 mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-white leading-tight">
              Search <span className="gradient-text">History</span>
            </h1>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
              online ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}>
              <motion.div
                animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className={`w-1.5 h-1.5 rounded-full ${online ? 'bg-emerald-400' : 'bg-red-400'}`}
              />
              {online ? 'Live' : 'Local'}
            </span>
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {online
              ? 'All searches recorded on the backend — click any session to see its leads.'
              : 'Backend offline — showing searches archived on this device.'}
          </p>
          <div className="grid grid-cols-2 gap-2 w-full max-w-[320px] sm:flex sm:w-auto sm:max-w-none sm:items-center sm:gap-2 sm:shrink-0">
            <button
              onClick={load}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 px-3 py-2.5 sm:py-2 rounded-xl border border-border/50 text-muted-foreground hover:text-white hover:border-border text-sm font-medium transition-all disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            {online && history.length > 0 && (
              <>
                <a
                  href={dbUrl()}
                  download="leadhunter_history.db"
                  className="inline-flex items-center justify-center gap-2 px-3 py-2.5 sm:py-2 rounded-xl border border-border/50 text-muted-foreground hover:text-white hover:border-border text-sm font-medium transition-all min-h-[44px] sm:min-h-0"
                  title="Download the full SQLite database (all history)"
                >
                  <Download className="w-4 h-4" />
                  Database
                </a>
                <a
                  href={allHistoryCsvUrl()}
                  download="all_history.csv"
                  className="inline-flex items-center justify-center gap-2 px-3 py-2.5 sm:py-2 rounded-xl border border-border/50 text-muted-foreground hover:text-white hover:border-border text-sm font-medium transition-all min-h-[44px] sm:min-h-0"
                  title="Download every lead from every session as one CSV"
                >
                  <Download className="w-4 h-4" />
                  All CSV
                </a>
              </>
            )}
            {history.length > 0 && (
              <button
                onClick={handleClearAll}
                className="inline-flex items-center justify-center gap-2 px-3 py-2.5 sm:py-2 rounded-xl border border-destructive/20 text-destructive text-sm font-medium hover:bg-destructive/10 transition-all min-h-[44px] sm:min-h-0"
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </button>
            )}
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-3 gap-2 sm:gap-4 mb-8"
        >
          {[
            { label: 'Total Searches', value: history.length, icon: Search, color: 'text-blue-400', bg: 'bg-blue-500/10' },
            { label: 'Leads Found', value: totalLeads, icon: Building2, color: 'text-orange-400', bg: 'bg-orange-500/10' },
            { label: 'Phone Numbers', value: totalPhones, icon: Phone, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="rounded-xl sm:rounded-2xl border border-border/50 bg-card p-3 sm:p-5"
            >
              <div className="flex items-center justify-center sm:justify-start gap-2 sm:gap-3 mb-1.5 sm:mb-3">
                <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <span className="hidden sm:inline text-xs text-muted-foreground font-medium">{stat.label}</span>
              </div>
              <p className="text-xl sm:text-2xl font-heading font-bold text-white text-center sm:text-left">{stat.value}</p>
              <p className="sm:hidden text-[10px] text-muted-foreground font-medium text-center mt-1 truncate">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Filters */}
        {history.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex items-center justify-center gap-2 mb-6"
          >
            {filters.map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  filter === f.id
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'bg-card border border-border text-muted-foreground hover:text-white hover:border-border-hover'
                }`}
              >
                {f.label}
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  filter === f.id ? 'bg-white/20' : 'bg-muted text-muted-foreground'
                }`}>{f.count}</span>
              </button>
            ))}
          </motion.div>
        )}

        {/* History List */}
        {loading ? (
          <div className="text-center py-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Loading your history…</p>
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-5">
              <Files className="w-7 h-7 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-heading font-semibold text-white mb-2">
              {filter === 'all' ? 'No search history' : `No ${filter === 'places' ? 'Places' : 'Web'} searches`}
            </h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              {filter === 'all'
                ? 'Your past searches will appear here. Start by finding some leads!'
                : 'Try a different filter, or start a new search to populate this category.'}
            </p>
            <button
              onClick={() => navigate({ to: '/search' })}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-primary text-white text-sm font-semibold hover:shadow-lg hover:shadow-primary/25 transition-all"
            >
              <Search className="w-4 h-4" />
              Find Leads
            </button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {filtered.map((session, i) => {
              const expanded = expandedId === session.id
              return (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`rounded-2xl border border-border/50 bg-card overflow-hidden transition-all duration-300 ${
                    expanded ? 'border-primary/30 bg-card-hover' : 'hover:border-primary/20'
                  }`}
                >
                  {/* Row */}
                  <button
                    onClick={() => openDetail(session.id)}
                    className="w-full flex items-start sm:items-center gap-3 sm:gap-4 p-4 sm:p-5 text-left group"
                  >
                    <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                      session.mode === 'places'
                        ? 'bg-orange-500/10 text-orange-400 group-hover:bg-orange-500 group-hover:text-white'
                        : 'bg-blue-500/10 text-blue-400 group-hover:bg-blue-500 group-hover:text-white'
                    }`}>
                      {session.mode === 'places' ? <Building2 className="w-5 h-5" /> : <Globe className="w-5 h-5" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-white truncate">{session.query}</h3>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 ${
                          session.mode === 'places' ? 'bg-orange-500/10 text-orange-400' : 'bg-blue-500/10 text-blue-400'
                        }`}>
                          {session.mode}
                        </span>
                        <ChevronRight className={`sm:hidden w-4 h-4 ml-auto text-muted-foreground transition-transform shrink-0 ${expanded ? 'rotate-90' : ''}`} />
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(session.timestamp)}
                        </span>
                        <span>•</span>
                        <span className="truncate">{session.location}</span>
                      </div>
                      {/* Mobile stats strip */}
                      <div className="sm:hidden flex items-center gap-4 mt-2.5 pt-2.5 border-t border-border/20">
                        <span className="flex items-baseline gap-1">
                          <span className="text-base font-bold text-white">{session.resultCount}</span>
                          <span className="text-[10px] text-muted-foreground">leads</span>
                        </span>
                        <span className="flex items-baseline gap-1">
                          <span className="text-base font-bold text-white">{session.phoneCount}</span>
                          <span className="text-[10px] text-muted-foreground">phones</span>
                        </span>
                        <span className="ml-auto text-[10px] text-muted-foreground">{timeAgo(session.timestamp)}</span>
                      </div>
                    </div>

                    {/* Desktop stats */}
                    <div className="hidden sm:flex items-center gap-5 shrink-0">
                      <div className="text-right">
                        <p className="text-lg font-bold text-white">{session.resultCount}</p>
                        <p className="text-[10px] text-muted-foreground">leads</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-white">{session.phoneCount}</p>
                        <p className="text-[10px] text-muted-foreground">phones</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">{timeAgo(session.timestamp)}</p>
                      </div>
                      <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${expanded ? 'rotate-90' : ''}`} />
                    </div>
                  </button>

                  {/* Detail */}
                  <AnimatePresence>
                    {expanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        <div className="px-5 pb-5 border-t border-border/40">
                          <SessionDetail
                            mode={session.mode}
                            detail={detail}
                            loading={detailLoading}
                            error={detailError}
                            resultCount={session.resultCount}
                          />
                          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border/30">
                            {session.source === 'server' && session.resultCount > 0 && (
                              <>
                                <a
                                  href={csvUrl(session.id)}
                                  download
                                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl gradient-primary text-white text-xs font-semibold hover:shadow-lg hover:shadow-primary/25 transition-all"
                                >
                                  <Download className="w-3.5 h-3.5" /> CSV
                                </a>
                                <a
                                  href={allVcardsUrl(session.id)}
                                  download
                                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-card border border-border text-white text-xs font-semibold hover:border-primary/30 transition-all"
                                >
                                  <Download className="w-3.5 h-3.5" /> All vCards
                                </a>
                              </>
                            )}
                            {session.source === 'local' && (
                              <button
                                onClick={() => handleDelete(session.id)}
                                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-destructive/20 text-destructive text-xs font-medium hover:bg-destructive/10 transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                              </button>
                            )}
                            {session.source === 'server' && (
                              <span className="ml-auto text-xs text-emerald-400/80 font-mono">● live session</span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

function SessionDetail({
  mode,
  detail,
  loading,
  error,
  resultCount,
}: {
  mode: 'places' | 'web'
  detail: SessionDetailDTO | null
  loading: boolean
  error: string | null
  resultCount: number
}) {
  if (loading) {
    return (
      <div className="py-8 flex flex-col items-center justify-center">
        <Loader2 className="w-6 h-6 text-primary animate-spin mb-3" />
        <p className="text-xs text-muted-foreground">Loading lead details…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-6 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
          <AlertCircle className="w-4 h-4 text-red-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-red-400">Could not load details</p>
          <p className="text-xs text-muted-foreground mt-0.5">{error}</p>
        </div>
      </div>
    )
  }

  if (!detail || !detail.results || detail.results.length === 0) {
    return (
      <div className="py-6">
        <p className="text-sm text-muted-foreground italic">
          {resultCount === 0 ? 'No leads were found in this search.' : 'Lead details are unavailable for this session.'}
        </p>
      </div>
    )
  }

  if (mode === 'places') {
    return (
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 mt-4">
          Businesses without websites ({detail.results.length})
        </h4>
        <div className="space-y-2">
          {detail.results.map((row, i) => {
            const lead = row as NonNullable<SessionDetailDTO['results']>[number]
            if (!isPlaceLead(lead)) return null
            return (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border/40">
                <div className="w-7 h-7 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                  <Building2 className="w-3.5 h-3.5 text-orange-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{lead.name || 'Unknown Business'}</p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 mt-0.5 text-xs text-muted-foreground">
                    {lead.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" /> <span className="font-mono text-white">{lead.phone}</span>
                      </span>
                    )}
                    {lead.address && (
                      <span className="flex items-center gap-1 max-w-[280px] truncate">
                        <MapPin className="w-3 h-3" /> {lead.address}
                      </span>
                    )}
                    {!lead.phone && !lead.address && <span className="italic text-muted-foreground/70">No contact info</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(lead.phone || lead.name || '')
                      toast('Copied')
                    }}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-white hover:bg-muted transition-all"
                    title="Copy"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // web mode
  return (
    <div>
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 mt-4">
        Websites with contact info ({detail.results.length})
      </h4>
      <div className="space-y-2">
        {detail.results.map((row, i) => {
          const lead = row as NonNullable<SessionDetailDTO['results']>[number]
          if (!isWebLead(lead)) return null
          return (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border/40">
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                <Globe className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <a
                    href={lead.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-primary hover:text-primary-hover truncate"
                  >
                    {lead.url.replace(/^https?:\/\/(www\.)?/, '').slice(0, 60)}
                  </a>
                  <ExternalLink className="w-3 h-3 text-muted-foreground shrink-0" />
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 mt-0.5 text-xs">
                  {lead.emails.length > 0 && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-300">{lead.emails_str || lead.emails.join(', ')}</span>
                    </span>
                  )}
                  {lead.phones.length > 0 && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-primary" />
                      <span className="font-mono text-white">{lead.phones_str || lead.phones.join(', ')}</span>
                    </span>
                  )}
                  {lead.emails.length === 0 && lead.phones.length === 0 && (
                    <span className="italic text-muted-foreground/70">No contact info found</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText([lead.url, ...lead.emails, ...lead.phones].join('\n'))
                  toast('Copied')
                }}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-white hover:bg-muted transition-all shrink-0"
                title="Copy"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
