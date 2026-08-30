import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'motion/react'
import { useNavigate } from '@tanstack/react-router'
import {
  Building2, Phone, ArrowRight, Globe,
  TrendingUp, Zap, BarChart3, Sparkles, Target,
  ArrowUpRight, Rocket, Circle, RefreshCw, Server,
  Activity, Wifi, WifiOff,
} from 'lucide-react'
import { getSearchHistory, removeSearchSession } from '../lib/storage'
import { pingApi, getServerStats } from '../lib/api'
import type { PingResult } from '../lib/api'
import type { SearchSession } from '../types'
import { toast } from './__root'
import { BgAnimation } from '../components/landing/bg-animation'

type ConnState = 'checking' | 'online' | 'offline'

interface SessionItem {
  id: string
  mode: 'places' | 'web'
  query: string
  location: string
  resultCount: number
  phoneCount: number
  timestamp: number
  source: 'server' | 'local'
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'yesterday'
  return `${days}d ago`
}

function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    if (value === 0) { setDisplay(0); return }
    const step = Math.max(1, Math.floor(value / 25))
    let current = 0
    const timer = setInterval(() => {
      current += step
      if (current >= value) { setDisplay(value); clearInterval(timer) }
      else setDisplay(current)
    }, 25)
    return () => clearInterval(timer)
  }, [value])
  return <>{display}{suffix}</>
}

const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

export function DashboardPage() {
  const [history, setHistory] = useState<SearchSession[]>([])
  const [ping, setPing] = useState<PingResult>({ online: false, latency: null, app: null })
  const [liveStats, setLiveStats] = useState<{ sessions: number; leads: number; phones: number; places_sessions: number; web_sessions: number }>({ sessions: 0, leads: 0, phones: 0, places_sessions: 0, web_sessions: 0 })
  const [serverSessions, setServerSessions] = useState<SessionItem[]>([])
  const [conn, setConn] = useState<ConnState>('checking')
  const [refreshing, setRefreshing] = useState(false)
  const navigate = useNavigate()
  const pollRef = useRef<ReturnType<typeof setInterval>>(undefined)

  const load = useCallback(async () => {
    setRefreshing(true)
    const p = await pingApi()
    setPing(p)
    setConn(p.online ? 'online' : 'offline')
    if (!p.online) {
      setLiveStats({ sessions: 0, leads: 0, phones: 0, places_sessions: 0, web_sessions: 0 })
      setServerSessions([])
      setRefreshing(false)
      return
    }
    try {
      const res = await getServerStats()
      setLiveStats(res.stats)
      setServerSessions(
        res.sessions.map(s => ({
          id: s.id,
          mode: s.mode,
          query: s.query,
          location: s.location,
          resultCount: s.result_count,
          phoneCount: s.phone_count,
          timestamp: s.timestamp,
          source: 'server' as const,
        })),
      )
    } catch {
      // Backend answered the health ping but stats failed — keep live state.
    }
    setRefreshing(false)
  }, [])

  useEffect(() => {
    load()
    pollRef.current = setInterval(load, 30000)
    return () => clearInterval(pollRef.current)
  }, [load])

  useEffect(() => {
    setHistory(getSearchHistory())
  }, [])

  const online = conn === 'online'

  const localLeads = history.reduce((a, s) => a + s.resultCount, 0)
  const localPhones = history.reduce((a, s) => a + s.phoneCount, 0)
  const localPlaces = history.filter(s => s.mode === 'places').length
  const localWeb = history.filter(s => s.mode === 'web').length

  const leads = online ? liveStats.leads : localLeads
  const phones = online ? liveStats.phones : localPhones
  const sessions = online ? liveStats.sessions : history.length
  const placesSessions = online ? liveStats.places_sessions : localPlaces
  const webSessions = online ? liveStats.web_sessions : localWeb
  const hasData = sessions > 0

  const avgPerSearch = sessions > 0 ? Math.round(leads / sessions) : 0
  const phoneRate = leads > 0 ? Math.round((phones / leads) * 100) : 0
  const placesPct = sessions > 0 ? Math.round((placesSessions / sessions) * 100) : 0
  const webPct = sessions > 0 ? Math.round((webSessions / sessions) * 100) : 0

  const recent = online ? serverSessions : history.map<SessionItem>(s => ({
    id: s.id,
    mode: s.mode,
    query: s.query,
    location: s.location,
    resultCount: s.resultCount,
    phoneCount: s.phoneCount,
    timestamp: s.timestamp,
    source: 'local',
  }))
  const recentList = recent.slice(0, 6)

  const handleDelete = (id: string) => {
    removeSearchSession(id)
    setHistory(getSearchHistory())
    toast('Search removed from history')
  }

  const statusConfig = {
    checking: {
      label: 'Connecting to backend',
      dot: 'bg-amber-400',
      ring: 'bg-amber-500/10 border-amber-500/20',
      text: 'text-amber-400',
      icon: Activity,
    },
    online: {
      label: ping.latency ? `System Online · ${ping.latency}ms` : 'System Online',
      dot: 'bg-emerald-400',
      ring: 'bg-emerald-500/10 border-emerald-500/20',
      text: 'text-emerald-400',
      icon: Wifi,
    },
    offline: {
      label: 'Backend Offline',
      dot: 'bg-red-400',
      ring: 'bg-red-500/10 border-red-500/20',
      text: 'text-red-400',
      icon: WifiOff,
    },
  }[conn]

  const subtitle = conn === 'checking'
    ? 'Establishing a secure link to your search backend…'
    : online
      ? `Commanding ${placesSessions} Places & ${webSessions} web search session${webSessions === 1 ? '' : 's'} — ${leads} leads scraped, ${phones} phone numbers captured. Keep the momentum going.`
      : hasData
        ? `Backend unreachable — showing ${history.length} archived search${history.length === 1 ? '' : 'es'} from local storage. Start the server to go live.`
        : 'Ready to find your next clients? Start a search to begin generating leads.'

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <BgAnimation />
      {/* Ambient Glows */}
      <div className="fixed top-[-30%] left-[-10%] w-[70vw] h-[70vw] rounded-full bg-primary/[0.04] blur-[200px] pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-accent/[0.03] blur-[180px] pointer-events-none" />

      {/* Grid pattern */}
      <div
        className="fixed inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* ═══════════ HERO ═══════════ */}
      <section className="relative z-10 pt-20 sm:pt-24 pb-10 sm:pb-14 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative rounded-3xl border border-border/30 bg-card/30 backdrop-blur-xl overflow-hidden"
          >
            {/* Hero background glow */}
            <div className="absolute inset-0">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-[140px] bg-gradient-to-b from-primary/[0.06] to-transparent" />
              <motion.div
                animate={{ scale: [1, 1.15, 1], opacity: [0.25, 0.45, 0.25] }}
                transition={{ duration: 5, repeat: Infinity }}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] h-[280px] rounded-full bg-primary/[0.07] blur-[120px] pointer-events-none"
              />
            </div>

            <div className="relative px-4 py-8 sm:px-12 sm:py-14">
              <div className="max-w-2xl mx-auto text-center">
                {/* Status pill */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border mb-6 ${statusConfig.ring}`}
                >
                  {conn === 'checking' ? (
                    <Activity className={`w-3.5 h-3.5 ${statusConfig.text} animate-pulse`} />
                  ) : (
                    <motion.div
                      animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className={`w-2 h-2 rounded-full ${statusConfig.dot}`}
                    />
                  )}
                  <span className={`text-xs font-semibold ${statusConfig.text}`}>{statusConfig.label}</span>
                  {online && ping.latency !== null && (
                    <span className="text-[10px] font-mono text-muted-foreground">{ping.latency}ms</span>
                  )}
                </motion.div>

                <h1 className="text-[32px] sm:text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-white leading-[1.1] mb-3 sm:mb-4">
                  Lead Generation
                  <br />
                  <span className="gradient-text">Command Center</span>
                </h1>
                <p className="text-muted-foreground text-base sm:text-lg max-w-xl leading-relaxed mx-auto">
                  {subtitle}
                </p>

                {/* CTA */}
                <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-4 mt-6 sm:mt-8">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate({ to: '/search' })}
                    className="group relative col-span-2 sm:col-auto flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl gradient-primary text-white font-semibold text-sm shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-shadow"
                  >
                    <Sparkles className="w-4 h-4" />
                    Start New Search
                    <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </motion.button>
                  {hasData && (
                    <button
                      onClick={() => navigate({ to: '/history' })}
                      className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-border/50 hover:border-border text-muted-foreground hover:text-white font-medium text-sm transition-all"
                    >
                      View History
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={load}
                    disabled={refreshing}
                    className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-border/50 hover:border-border text-muted-foreground hover:text-white transition-all disabled:opacity-60"
                    title="Refresh live stats"
                  >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {/* Hero stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-4 sm:gap-y-5 mt-8 sm:mt-12 pt-5 sm:pt-8 border-t border-border/40">
                  {[
                    { value: leads, label: 'Leads Found', color: 'text-orange-400', icon: Target },
                    { value: sessions, label: 'Search Sessions', color: 'text-blue-400', icon: BarChart3, sub: `${placesSessions} places · ${webSessions} web` },
                    { value: phones, label: 'Phones Found', color: 'text-emerald-400', icon: Phone },
                    { value: avgPerSearch, label: 'Avg Leads / Search', color: 'text-amber-400', icon: TrendingUp },
                  ].map((stat, i) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 + i * 0.07 }}
                      className="text-center"
                    >
                      <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-1">
                        <stat.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 opacity-60 ${stat.color}`} />
                        <p className={`text-3xl sm:text-4xl md:text-5xl font-heading font-bold ${stat.color}`}>
                          <AnimatedNumber value={stat.value} />
                        </p>
                      </div>
                      <p className="text-[11px] sm:text-xs text-muted-foreground mt-1 font-medium">{stat.label}</p>
                      {'sub' in stat && stat.sub && (
                        <p className="text-[10px] text-muted-foreground/60 mt-0.5 font-mono">{stat.sub}</p>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════ OVERVIEW GRID ═══════════ */}
      <section className="relative z-10 px-4 sm:px-6 pb-12">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Server Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-border/30 bg-card/30 backdrop-blur-xl p-4 sm:p-6"
          >
            <h3 className="text-sm font-heading font-semibold text-white mb-5 flex items-center gap-2">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${statusConfig.ring}`}>
                <Server className={`w-3.5 h-3.5 ${statusConfig.text}`} />
              </div>
              Server Status
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Connection</span>
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${statusConfig.text}`}>
                  <motion.div
                    animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`}
                  />
                  {conn === 'checking' ? 'Checking…' : online ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Latency</span>
                <span className="text-xs font-mono text-white">{ping.latency !== null ? `${ping.latency} ms` : '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Backend</span>
                <span className="text-xs font-mono text-white">{ping.app ?? '—'}</span>
              </div>
              <div className="h-px bg-border/30" />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Cached sessions</span>
                <span className="text-xs font-bold text-white"><AnimatedNumber value={sessions} /></span>
              </div>
              <button
                onClick={load}
                disabled={refreshing}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-muted/40 hover:bg-muted/70 text-xs font-medium text-muted-foreground hover:text-white transition-all disabled:opacity-60"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing…' : 'Refresh data'}
              </button>
            </div>
          </motion.div>

          {/* Search Modes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.26 }}
            className="rounded-2xl border border-border/30 bg-card/30 backdrop-blur-xl p-4 sm:p-6"
          >
            <h3 className="text-sm font-heading font-semibold text-white mb-5 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5 text-accent" />
              </div>
              Search Modes
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Building2 className="w-3 h-3 text-orange-400" /> Google Places
                  </span>
                  <span className="text-xs font-bold text-orange-400">{placesSessions}</span>
                </div>
                <div className="h-2.5 rounded-full bg-muted/30 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${placesPct}%` }}
                    transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
                    className="h-full rounded-full bg-gradient-to-r from-orange-500 to-red-500"
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Globe className="w-3 h-3 text-blue-400" /> Web Search
                  </span>
                  <span className="text-xs font-bold text-blue-400">{webSessions}</span>
                </div>
                <div className="h-2.5 rounded-full bg-muted/30 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${webPct}%` }}
                    transition={{ duration: 1, delay: 0.6, ease: 'easeOut' }}
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border/30">
                <span className="text-xs text-muted-foreground">Total</span>
                <span className="text-xs font-heading font-bold text-white"><AnimatedNumber value={sessions} /> sessions</span>
              </div>
            </div>
          </motion.div>

          {/* Performance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32 }}
            className="rounded-2xl border border-border/30 bg-card/30 backdrop-blur-xl p-4 sm:p-6"
          >
            <h3 className="text-sm font-heading font-semibold text-white mb-5 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-primary" />
              </div>
              Performance
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Leads scraped</span>
                <span className="text-lg font-heading font-bold text-orange-400"><AnimatedNumber value={leads} /></span>
              </div>
              <div className="h-px bg-border/30" />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Phones found</span>
                <span className="text-lg font-heading font-bold text-emerald-400"><AnimatedNumber value={phones} /></span>
              </div>
              <div className="h-px bg-border/30" />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Phone rate</span>
                <span className="text-lg font-heading font-bold text-white">
                  <AnimatedNumber value={phoneRate} suffix="%" />
                </span>
              </div>
              <div className="h-px bg-border/30" />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Avg leads / search</span>
                <span className="text-lg font-heading font-bold text-white"><AnimatedNumber value={avgPerSearch} /></span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════ QUICK ACTIONS ═══════════ */}
      <section className="relative z-10 px-4 sm:px-6 pb-12">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Google Places Card */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.36 }}
            whileHover={{ scale: 1.01, y: -2 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => navigate({ to: '/search' })}
            className="group relative rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-500/[0.08] to-transparent p-4 sm:p-6 text-left overflow-hidden transition-all hover:border-orange-500/30 hover:shadow-[0_0_40px_rgba(249,115,22,0.08)]"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-orange-500/[0.06] blur-[60px] rounded-full" />
            <div className="relative flex items-start gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className="text-base sm:text-lg font-heading font-bold text-white">Google Places</h3>
                  <span className="text-[10px] font-mono text-orange-400/70 shrink-0">{placesSessions} sessions</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Discover every business — each tagged with website presence, ideal prospecting for designers and agencies.
                </p>
                <div className="mt-3 sm:mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-orange-400 group-hover:text-orange-300 transition-colors">
                  Start searching <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </motion.button>

          {/* Web Search Card */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.42 }}
            whileHover={{ scale: 1.01, y: -2 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => navigate({ to: '/search' })}
            className="group relative rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/[0.08] to-transparent p-4 sm:p-6 text-left overflow-hidden transition-all hover:border-blue-500/30 hover:shadow-[0_0_40px_rgba(59,130,246,0.08)]"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/[0.06] blur-[60px] rounded-full" />
            <div className="relative flex items-start gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className="text-base sm:text-lg font-heading font-bold text-white">Web Search</h3>
                  <span className="text-[10px] font-mono text-blue-400/70 shrink-0">{webSessions} sessions</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Scrape any website for emails and phone numbers — extract contact info from search results automatically.
                </p>
                <div className="mt-3 sm:mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-400 group-hover:text-blue-300 transition-colors">
                  Start searching <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </motion.button>
        </div>
      </section>

      {/* ═══════════ RECENT ACTIVITY ═══════════ */}
      <section className="relative z-10 px-4 sm:px-6 pb-16 sm:pb-20">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            {recentList.length === 0 ? (
              <div className="rounded-2xl border border-border/30 bg-card/30 backdrop-blur-xl p-6 sm:p-10">
                <div className="max-w-md mx-auto text-center">
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/20"
                  >
                    <Rocket className="w-9 h-9 text-white" />
                  </motion.div>
                  <h3 className="text-2xl font-heading font-bold text-white mb-3">
                    {online ? 'Your Command Center is live' : 'Ready to Launch?'}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
                    {online
                      ? 'Your server is connected and listening. Launch your first search and results will stream in here.'
                      : 'Your dashboard will come alive once you start searching. Each search brings you closer to your next client.'}
                  </p>
                  <button
                    onClick={() => navigate({ to: '/search' })}
                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl gradient-primary text-white font-semibold text-sm shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-shadow"
                  >
                    <Sparkles className="w-4 h-4" />
                    {online ? 'Launch First Search' : 'Find Your First Leads'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${online ? 'bg-emerald-500/10' : 'bg-primary/10'}`}>
                      {online
                        ? <Circle className="w-4 h-4 text-emerald-400" />
                        : <BarChart3 className="w-4 h-4 text-primary" />}
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-base sm:text-lg font-heading font-bold text-white">Recent Sessions</h2>
                      <p className="text-xs text-muted-foreground truncate">
                        {online ? 'Live from backend · refreshing automatically' : 'Archived on this device'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate({ to: '/history' })}
                    className="text-xs font-medium text-primary hover:text-primary-hover transition-colors flex items-center gap-1 shrink-0"
                  >
                    View all <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {recentList.map((session, i) => (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + i * 0.05 }}
                      whileHover={{ scale: 1.02 }}
                      className="group relative rounded-xl border border-border/40 bg-card/40 backdrop-blur-sm p-4 text-left hover:border-primary/20 hover:bg-card/60 transition-all overflow-hidden"
                    >
                      <div className={`absolute top-0 left-0 w-1 h-full rounded-l-xl ${
                        session.mode === 'places' ? 'bg-gradient-to-b from-orange-500 to-red-500' : 'bg-gradient-to-b from-blue-500 to-cyan-500'
                      }`} />

                      <div className="pl-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                              session.mode === 'places' ? 'bg-orange-500/10 text-orange-400' : 'bg-blue-500/10 text-blue-400'
                            }`}>
                              {session.mode === 'places' ? 'Places' : 'Web'}
                            </span>
                            {session.source === 'server' && (
                              <span className="text-[10px] font-mono text-emerald-400/80">● live</span>
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground">{timeAgo(session.timestamp)}</span>
                        </div>
                        <h3 className="text-sm font-semibold text-white truncate mb-0.5">{session.query}</h3>
                        <p className="text-xs text-muted-foreground truncate mb-3">{session.location}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5">
                              <Target className="w-3 h-3 text-primary" />
                              <span className="text-xs font-bold text-white">{session.resultCount}</span>
                              <span className="text-[10px] text-muted-foreground">leads</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Phone className="w-3 h-3 text-emerald-400" />
                              <span className="text-xs font-bold text-white">{session.phoneCount}</span>
                              <span className="text-[10px] text-muted-foreground">phones</span>
                            </div>
                          </div>
                          {session.source === 'local' && (
                            <button
                              onClick={() => handleDelete(session.id)}
                              className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                              title="Delete from history"
                            >
                              <span className="text-xs font-bold">×</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        </div>
      </section>

      {/* ═══════════ OFFLINE BANNER ═══════════ */}
      {conn === 'offline' && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 px-6 pb-12"
        >
          <div className="max-w-6xl mx-auto">
            <a
              href={BASE || 'http://localhost:8000'}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-4 sm:p-5 hover:border-red-500/40 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                <WifiOff className="w-5 h-5 text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">Backend is offline</p>
                <p className="text-xs text-muted-foreground mt-0.5 break-words">
                  Showing locally archived data. Start the LeadHunter API server ({BASE || 'http://localhost:8000'}) to enable live stats and session tracking.
                </p>
              </div>
              <span className="text-xs font-medium text-red-400 group-hover:text-red-300 transition-colors shrink-0">
                Try again →
              </span>
            </a>
          </div>
        </motion.section>
      )}
    </div>
  )
}