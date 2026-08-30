import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Search, Download, Loader2, AlertCircle, Building2, Phone, MapPin,
  Check, UserPlus, Copy, ClipboardList, Globe, Mail,
  ExternalLink, Sparkles,
} from 'lucide-react'
import { searchPlaces, searchWeb, csvUrl, vcardUrl, allVcardsUrl } from '../lib/api'
import { addSearchSession } from '../lib/storage'
import type { PlaceLead, WebLead } from '../types'
import { toast } from './__root'
import { BgAnimation } from '../components/landing/bg-animation'

const logs = [
  'Initializing search...',
  'Fetching results...',
  'Processing data...',
  'Filtering results...',
  'Preparing output...',
]

export function SearchPage() {
  const [mode, setMode] = useState<'places' | 'web'>('places')
  const [niche, setNiche] = useState('')
  const [location, setLocation] = useState('')
  const [maxResults, setMaxResults] = useState(30)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [placeLeads, setPlaceLeads] = useState<PlaceLead[]>([])
  const [webLeads, setWebLeads] = useState<WebLead[]>([])
  const [currentLogIdx, setCurrentLogIdx] = useState(0)
  const logTimer = useRef<ReturnType<typeof setInterval>>(undefined)
  const resultsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (loading) {
      setCurrentLogIdx(0)
      logTimer.current = setInterval(() => {
        setCurrentLogIdx(prev => Math.min(prev + 1, logs.length - 1))
      }, 2000)
    } else {
      clearInterval(logTimer.current)
    }
    return () => clearInterval(logTimer.current)
  }, [loading])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!niche.trim() || !location.trim()) return
    setLoading(true)
    setError(null)
    setSessionId(null)
    setPlaceLeads([])
    setWebLeads([])
    try {
      if (mode === 'places') {
        const data = await searchPlaces(niche.trim(), location.trim(), maxResults)
        setSessionId(data.session_id)
        setPlaceLeads(data.results)
        addSearchSession({
          mode: 'places', query: niche.trim(), location: location.trim(),
          maxResults, resultCount: data.results.length,
          phoneCount: data.results.filter(r => r.phone).length, timestamp: Date.now(),
          results: data.results,
        })
        if (!data.results.length) toast('No businesses without websites found — try different terms')
        else toast(`Found ${data.results.length} businesses without websites`)
      } else {
        const data = await searchWeb(niche.trim(), location.trim(), maxResults)
        setSessionId(data.session_id)
        setWebLeads(data.results)
        addSearchSession({
          mode: 'web', query: niche.trim(), location: location.trim(),
          maxResults, resultCount: data.results.length,
          phoneCount: data.results.reduce((a, r) => a + r.phones.length, 0), timestamp: Date.now(),
          results: data.results,
        })
        if (!data.results.length) toast('No results found — try different search terms')
        else toast(`Found ${data.results.length} results with contact info`)
      }
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setNiche(''); setLocation(''); setMaxResults(30)
    setSessionId(null); setPlaceLeads([]); setWebLeads([]); setError(null)
  }

  const totalResults = mode === 'places' ? placeLeads.length : webLeads.length
  const progress = loading ? Math.min(((currentLogIdx + 1) / logs.length) * 100, 95) : 0

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

      {/* Hero Search Section */}
      <section className="relative z-10 px-6 pt-28 pb-16 max-w-4xl mx-auto">
        {/* Mode Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center mb-10"
        >
          <div className="inline-flex items-center gap-1 p-1 rounded-2xl bg-card border border-border/50">
            <button
              onClick={() => { setMode('places'); handleClear() }}
              className={`relative flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                mode === 'places' ? 'text-white' : 'text-muted-foreground hover:text-white'
              }`}
            >
              {mode === 'places' && (
                <motion.div
                  layoutId="mode-bg"
                  className="absolute inset-0 rounded-xl gradient-primary"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <Building2 className="w-4 h-4 relative z-10" />
              <span className="relative z-10">Google Places</span>
            </button>
            <button
              onClick={() => { setMode('web'); handleClear() }}
              className={`relative flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                mode === 'web' ? 'text-white' : 'text-muted-foreground hover:text-white'
              }`}
            >
              {mode === 'web' && (
                <motion.div
                  layoutId="mode-bg"
                  className="absolute inset-0 rounded-xl gradient-primary"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <Globe className="w-4 h-4 relative z-10" />
              <span className="relative z-10">Web Search</span>
            </button>
          </div>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-10"
        >
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-white leading-tight">
            {mode === 'places' ? (
              <>Find businesses that <br /><span className="gradient-text">need a website</span></>
            ) : (
              <>Scrape contacts from <br /><span className="gradient-text">any website</span></>
            )}
          </h1>
          <p className="mt-4 text-muted-foreground text-lg max-w-xl mx-auto">
            {mode === 'places'
              ? 'Search any niche and location to discover businesses on Google without a website.'
              : 'Search the web and automatically extract emails and phone numbers from results.'}
          </p>
        </motion.div>

        {/* Search Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <form onSubmit={handleSubmit}>
            <div className="relative rounded-2xl border border-border/50 bg-card p-2 shadow-lg shadow-black/20">
              <div className="flex flex-col md:flex-row gap-2">
                <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl bg-muted/50 border border-transparent focus-within:border-primary/30 focus-within:bg-muted transition-all">
                  {mode === 'places' ? <Building2 className="w-5 h-5 text-muted-foreground shrink-0" /> : <Search className="w-5 h-5 text-muted-foreground shrink-0" />}
                  <input
                    type="text"
                    value={niche}
                    onChange={e => setNiche(e.target.value)}
                    placeholder={mode === 'places' ? 'e.g. Dentists, Plumbers, Restaurants' : 'e.g. web design agency New York'}
                    required
                    className="flex-1 bg-transparent text-white placeholder:text-muted-foreground text-sm focus:outline-none"
                  />
                </div>
                <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl bg-muted/50 border border-transparent focus-within:border-primary/30 focus-within:bg-muted transition-all">
                  <MapPin className="w-5 h-5 text-muted-foreground shrink-0" />
                  <input
                    type="text"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    placeholder={mode === 'places' ? 'e.g. Austin, TX' : 'e.g. United States'}
                    required
                    className="flex-1 bg-transparent text-white placeholder:text-muted-foreground text-sm focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-muted/50 border border-transparent focus-within:border-primary/30 focus-within:bg-muted transition-all md:w-32">
                  <input
                    type="number"
                    value={maxResults}
                    onChange={e => setMaxResults(Number(e.target.value))}
                    max={50}
                    min={1}
                    className="w-full bg-transparent text-white text-sm focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-xs text-muted-foreground whitespace-nowrap">results</span>
                </div>
                <button
                  type="submit"
                  disabled={loading || !niche.trim() || !location.trim()}
                  className="flex items-center justify-center gap-2 px-8 py-3 rounded-xl gradient-primary text-white font-semibold text-sm hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Sparkles className="w-5 h-5" />
                  )}
                  {loading ? 'Searching...' : 'Find Leads'}
                </button>
              </div>
            </div>
          </form>
          <p className="text-center text-xs text-muted-foreground/60 mt-3">
            {mode === 'places'
              ? "Finds businesses on Google that don't have a website — perfect for web designers and agencies."
              : 'Searches DuckDuckGo for URLs, then scrapes emails and phone numbers from those pages.'}
          </p>
        </motion.div>
      </section>

      {/* Loading State */}
      <AnimatePresence>
        {loading && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative z-10 px-6 max-w-4xl mx-auto mb-12"
          >
            <div className="rounded-2xl border border-border/50 bg-card p-6 space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Searching results</p>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-primary">{niche}</span> in <span className="text-primary">{location}</span>
                  </p>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full rounded-full gradient-primary"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <div className="space-y-2">
                {logs.map((log, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    {i < currentLogIdx ? (
                      <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      </div>
                    ) : i === currentLogIdx ? (
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-muted shrink-0" />
                    )}
                    <span className={
                      i < currentLogIdx ? 'text-muted-foreground' :
                      i === currentLogIdx ? 'text-white font-medium' :
                      'text-muted-foreground/40'
                    }>
                      {log}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Error State */}
      <AnimatePresence>
        {error && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10 px-6 max-w-4xl mx-auto mb-12"
          >
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm font-semibold text-destructive">Search failed</p>
                <p className="text-xs text-muted-foreground mt-0.5">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-xs text-muted-foreground hover:text-white transition-colors"
              >
                Dismiss
              </button>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {!loading && totalResults === 0 && !error && (
        <section className="relative z-10 px-6 max-w-4xl mx-auto mb-12">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-5">
              {mode === 'places' ? (
                <Building2 className="w-7 h-7 text-muted-foreground/50" />
              ) : (
                <Globe className="w-7 h-7 text-muted-foreground/50" />
              )}
            </div>
            <h3 className="text-lg font-heading font-semibold text-white mb-2">
              {mode === 'places' ? 'Ready to find businesses?' : 'Ready to search the web?'}
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {mode === 'places'
                ? 'Enter a business niche and location above to discover businesses on Google without a website.'
                : 'Enter a search query and location above to find websites with contact information.'}
            </p>
          </motion.div>
        </section>
      )}

      {/* Export Toolbar */}
      {sessionId && totalResults > 0 && (
        <section className="relative z-10 px-6 max-w-4xl mx-auto mb-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-3"
          >
            <span className="col-span-2 sm:col-auto sm:mr-2 text-sm text-muted-foreground">
              <span className="text-white font-semibold">{totalResults}</span> leads found
            </span>
            <a
              href={csvUrl(sessionId)}
              download
              className="flex w-full sm:w-auto items-center justify-center gap-2 px-4 py-2 rounded-xl gradient-primary text-white text-xs font-semibold hover:shadow-lg hover:shadow-primary/25 transition-all"
            >
              <Download className="w-3.5 h-3.5" /> Download CSV
            </a>
            <a
              href={allVcardsUrl(sessionId)}
              download
              className="flex w-full sm:w-auto items-center justify-center gap-2 px-4 py-2 rounded-xl bg-card border border-border text-white text-xs font-semibold hover:border-primary/30 transition-all"
            >
              <Download className="w-3.5 h-3.5" /> Download vCards
            </a>
            {mode === 'places' && (
              <button
                onClick={() => {
                  const phones = placeLeads.map(l => l.phone).filter(Boolean).join('\n')
                  navigator.clipboard.writeText(phones)
                  toast('Phone numbers copied')
                }}
                className="flex w-full sm:w-auto items-center justify-center gap-2 px-4 py-2 rounded-xl bg-card border border-border text-white text-xs font-semibold hover:border-primary/30 transition-all"
              >
                <ClipboardList className="w-3.5 h-3.5" /> Copy All Phones
              </button>
            )}
          </motion.div>
        </section>
      )}

      {/* Results — Places Mode */}
      <section ref={resultsRef} className="relative z-10 px-6 max-w-4xl mx-auto pb-20">
        <AnimatePresence>
          {mode === 'places' && placeLeads.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              {placeLeads.map((lead, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="group rounded-2xl border border-border/50 bg-card p-4 sm:p-5 hover:border-primary/20 hover:bg-card-hover transition-all duration-300"
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-all">
                      <Building2 className="w-5 h-5 text-primary group-hover:text-white" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">#{i + 1}</span>
                        <h3 className="text-sm font-semibold text-white truncate max-w-[200px] sm:max-w-[380px]">{lead.name || 'Unknown Business'}</h3>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                          lead.website
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {lead.website ? 'Has website' : 'No website'}
                        </span>
                      </div>

                      <div className="mt-2.5 space-y-1.5">
                        {lead.phone && (
                          <div className="flex items-center gap-2 text-xs min-w-0">
                            <span className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              <Phone className="w-3 h-3 text-primary" />
                            </span>
                            <a
                              href={`tel:${lead.phone.replace(/[^+\d]/g, '')}`}
                              className="font-mono text-white hover:text-primary transition-colors truncate"
                            >
                              {lead.phone}
                            </a>
                            <button
                              onClick={() => {
                                if (lead.phone) navigator.clipboard.writeText(lead.phone)
                                toast('Phone copied')
                              }}
                              className="p-1 rounded-md text-muted-foreground hover:text-white hover:bg-muted transition-all shrink-0"
                              title="Copy phone"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                        {lead.address && (
                          <div className="flex items-center gap-2 text-xs min-w-0">
                            <span className="w-6 h-6 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                              <MapPin className="w-3 h-3 text-orange-400" />
                            </span>
                            <span className="text-muted-foreground truncate">{lead.address}</span>
                          </div>
                        )}
                        {lead.email && (
                          <div className="flex items-center gap-2 text-xs min-w-0">
                            <span className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                              <Mail className="w-3 h-3 text-emerald-400" />
                            </span>
                            <a href={`mailto:${lead.email}`} className="text-emerald-300 hover:text-emerald-200 transition-colors truncate">
                              {lead.email}
                            </a>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(lead.email)
                                toast('Email copied')
                              }}
                              className="p-1 rounded-md text-muted-foreground hover:text-white hover:bg-muted transition-all shrink-0"
                              title="Copy email"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                        {lead.website && (
                          <div className="flex items-center gap-2 text-xs min-w-0">
                            <span className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                              <Globe className="w-3 h-3 text-blue-400" />
                            </span>
                            <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary-hover transition-colors truncate">
                              {lead.website.replace(/^https?:\/\/(www\.)?/, '')}
                            </a>
                            <ExternalLink className="w-3 h-3 text-muted-foreground shrink-0" />
                          </div>
                        )}
                        {!lead.phone && !lead.address && !lead.email && !lead.website && (
                          <span className="text-xs text-muted-foreground italic">No contact info</span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 items-center shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`${lead.name}${lead.phone ? ` — ${lead.phone}` : ''}`)
                          toast('Copied to clipboard')
                        }}
                        className="p-2 rounded-lg text-muted-foreground hover:text-white hover:bg-muted transition-all"
                        title="Copy"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      {sessionId && (
                        <a
                          href={vcardUrl(sessionId, i)}
                          download
                          className="p-2 rounded-lg text-muted-foreground hover:text-white hover:bg-muted transition-all"
                          title="Download vCard"
                        >
                          <UserPlus className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results — Web Mode */}
        <AnimatePresence>
          {mode === 'web' && webLeads.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              {webLeads.map((lead, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="group rounded-2xl border border-border/50 bg-card p-4 sm:p-5 hover:border-primary/20 hover:bg-card-hover transition-all duration-300"
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 group-hover:bg-blue-500 group-hover:text-white transition-all">
                      <Globe className="w-5 h-5 text-blue-400 group-hover:text-white" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">#{i + 1}</span>
                        <a
                          href={lead.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-semibold text-primary hover:text-primary-hover truncate max-w-[200px] sm:max-w-[380px]"
                          title={lead.url}
                        >
                          {lead.url.replace(/^https?:\/\/(www\.)?/, '').slice(0, 70)}
                        </a>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => {
                              const lines = [lead.url, ...lead.emails, ...lead.phones].join('\n')
                              navigator.clipboard.writeText(lines)
                              toast('Copied to clipboard')
                            }}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-white hover:bg-muted transition-all"
                            title="Copy all"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <a
                            href={lead.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-md text-muted-foreground hover:text-white hover:bg-muted transition-all"
                            title="Open"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>

                      <div className="mt-3 grid gap-2">
                        {lead.emails.length > 0 && (
                          <div className="rounded-xl bg-muted/30 border border-border/40 p-3">
                            <div className="flex items-center gap-1.5 mb-2">
                              <div className="w-5 h-5 rounded bg-emerald-500/10 flex items-center justify-center shrink-0">
                                <Mail className="w-3 h-3 text-emerald-400" />
                              </div>
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">Emails</span>
                              <span className="ml-auto text-[10px] font-mono text-muted-foreground">{lead.emails.length}</span>
                            </div>
                            <div className="space-y-1">
                              {lead.emails.map((em, j) => (
                                <div key={j} className="flex items-center gap-2 min-w-0">
                                  <a href={`mailto:${em}`} className="text-xs text-emerald-300 hover:text-emerald-200 transition-colors truncate">
                                    {em}
                                  </a>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(em)
                                      toast('Email copied')
                                    }}
                                    className="p-1 rounded-md text-muted-foreground hover:text-white hover:bg-muted transition-all shrink-0"
                                    title="Copy email"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {lead.phones.length > 0 && (
                          <div className="rounded-xl bg-muted/30 border border-border/40 p-3">
                            <div className="flex items-center gap-1.5 mb-2">
                              <div className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center shrink-0">
                                <Phone className="w-3 h-3 text-primary" />
                              </div>
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">Phones</span>
                              <span className="ml-auto text-[10px] font-mono text-muted-foreground">{lead.phones.length}</span>
                            </div>
                            <div className="space-y-1">
                              {lead.phones.map((ph, j) => (
                                <div key={j} className="flex items-center gap-2 min-w-0">
                                  <span className="text-xs text-white font-mono truncate">{ph}</span>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(ph)
                                      toast('Phone copied')
                                    }}
                                    className="p-1 rounded-md text-muted-foreground hover:text-white hover:bg-muted transition-all shrink-0"
                                    title="Copy phone"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {lead.emails.length === 0 && lead.phones.length === 0 && (
                          <span className="text-xs text-muted-foreground italic">No contact info found</span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  )
}
