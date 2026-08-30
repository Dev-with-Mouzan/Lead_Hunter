import { useState, useEffect, useCallback } from 'react'
import { motion } from 'motion/react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import {
  Server,
  Palette,
  User,
  RefreshCw,
  Check,
  Wifi,
  WifiOff,
  Loader2,
  Building2,
  Globe,
  Plug,
  Save,
  Copy,
} from 'lucide-react'
import { pingApi, getBackendConfig } from '../lib/api'
import type { PingResult, BackendConfig } from '../lib/api'
import { toast } from './__root'

const SETTINGS_KEY = 'odify_preferences'

interface Preferences {
  fullName: string
  email: string
  company: string
  role: string
  theme: string
  accent: string
}

const defaultPrefs: Preferences = {
  fullName: '',
  email: '',
  company: '',
  role: 'Web Designer',
  theme: 'Dark',
  accent: '#e86a33',
}

function loadPrefs(): Preferences {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    return raw ? { ...defaultPrefs, ...JSON.parse(raw) } : { ...defaultPrefs }
  } catch {
    return { ...defaultPrefs }
  }
}

export function SettingsPage() {
  const [prefs, setPrefs] = useState<Preferences>(loadPrefs)
  const [saved, setSaved] = useState(false)
  const [activeSection, setActiveSection] = useState('backend')

  const [ping, setPing] = useState<PingResult>({ online: false, latency: null, app: null })
  const [config, setConfig] = useState<BackendConfig | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const p = await pingApi()
    setPing(p)
    setConfig(p.online ? await getBackendConfig() : null)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const online = ping.online

  const setPref = <K extends keyof Preferences>(key: K, value: Preferences[K]) => {
    setPrefs(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(prefs))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const sections = [
    { id: 'backend', label: 'Backend', icon: Server },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'appearance', label: 'Appearance', icon: Palette },
  ]

  return (
    <div className="min-h-screen bg-background px-6 pt-24 pb-20 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <h1 className="text-4xl md:text-5xl font-heading font-bold text-white leading-tight">
          <span className="gradient-text">Settings</span>
        </h1>
        <p className="mt-2 text-muted-foreground max-w-md mx-auto">
          Manage your LeadHunter backend connection and preferences
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Nav */}
        <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}>
          <Card className="lg:sticky lg:top-20">
            <CardContent className="p-2">
              {sections.map(section => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeSection === section.id
                      ? 'bg-primary text-white shadow-lg shadow-primary/20'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <section.icon className="w-4 h-4" />
                  {section.label}
                </button>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Settings Content */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-3"
        >
          {/* ───────────── BACKEND ───────────── */}
          {activeSection === 'backend' && (
            <div className="space-y-5">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Server className="w-4 h-4 text-primary" />
                    Backend Connection
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loading ? (
                    <div className="flex items-center gap-3 py-4">
                      <Loader2 className="w-5 h-5 text-primary animate-spin" />
                      <p className="text-sm text-muted-foreground">Contacting backend…</p>
                    </div>
                  ) : (
                    <>
                      {/* Status banner */}
                      <div className={`flex items-center gap-3 p-4 rounded-xl border ${
                        online
                          ? 'bg-emerald-500/[0.05] border-emerald-500/20'
                          : 'bg-red-500/[0.05] border-red-500/20'
                      }`}>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          online ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                        }`}>
                          {online ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm font-semibold ${online ? 'text-emerald-400' : 'text-red-400'}`}>
                            {online ? 'Backend connected' : 'Backend offline'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {online
                              ? `${config?.app ?? 'LeadHunter API'} v${config?.version ?? '—'} responding`
                              : 'Start the LeadHunter API server to enable live search, stats, and exports.'}
                          </p>
                        </div>
                        {online && ping.latency !== null && (
                          <span className="text-xs font-mono text-muted-foreground shrink-0">{ping.latency}ms</span>
                        )}
                        <button
                          onClick={load}
                          className="p-2 rounded-lg text-muted-foreground hover:text-white hover:bg-muted transition-all shrink-0"
                          title="Re-check connection"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Mode status */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-4 rounded-xl bg-muted/30 border border-border">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-orange-400" />
                              <span className="text-sm font-medium text-white">Google Places</span>
                            </div>
                            <StatusDot on={online && (config?.places.enabled ?? false)} />
                          </div>
                          <p className="text-xs text-muted-foreground">{config?.places.provider ?? 'Google Maps (keyless scrape)'}</p>
                          {online && config?.places.api_key === false && (
                            <p className="text-xs text-muted-foreground/70 mt-2">
                              Running keyless — scraping Google Maps directly
                            </p>
                          )}
                        </div>
                        <div className="p-4 rounded-xl bg-muted/30 border border-border">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Globe className="w-4 h-4 text-blue-400" />
                              <span className="text-sm font-medium text-white">Web Search</span>
                            </div>
                            <StatusDot on={online && (config?.web.enabled ?? false)} />
                          </div>
                          <p className="text-xs text-muted-foreground">{config?.web.provider ?? 'DuckDuckGo + scraper'}</p>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* API endpoints */}
              {online && config && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Plug className="w-4 h-4 text-primary" />
                      API Endpoints
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1.5">
                      {config.endpoints.map(endpoint => (
                        <div
                          key={endpoint}
                          className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg bg-muted/30 border border-border group"
                        >
                          <code className="text-xs text-muted-foreground font-mono truncate">{endpoint}</code>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin}${endpoint}`)
                              toast('Endpoint copied')
                            }}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-white hover:bg-muted transition-all shrink-0"
                            title="Copy"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {!online && (
                <Card>
                  <CardContent className="py-8 text-center">
                    <WifiOff className="w-8 h-8 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-sm font-medium text-white">No backend reachable</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Connection details (endpoints, version, mode status) appear here once the API is online.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* ───────────── PROFILE ───────────── */}
          {activeSection === 'profile' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Profile Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    placeholder="John Doe"
                    value={prefs.fullName}
                    onChange={e => setPref('fullName', e.target.value)}
                  />
                  <Input
                    label="Email"
                    type="email"
                    placeholder="john@example.com"
                    value={prefs.email}
                    onChange={e => setPref('email', e.target.value)}
                  />
                </div>
                <Input
                  label="Company"
                  placeholder="Your Agency"
                  value={prefs.company}
                  onChange={e => setPref('company', e.target.value)}
                />
                <div>
                  <label className="text-xs font-medium text-muted-foreground tracking-wide">Role</label>
                  <select
                    value={prefs.role}
                    onChange={e => setPref('role', e.target.value)}
                    className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl bg-card border border-border text-sm text-card-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
                  >
                    <option>Web Designer</option>
                    <option>Agency Owner</option>
                    <option>Freelancer</option>
                    <option>Marketing Consultant</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ───────────── APPEARANCE ───────────── */}
          {activeSection === 'appearance' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Appearance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <label className="text-xs font-medium text-muted-foreground tracking-wide">Theme</label>
                  <div className="grid grid-cols-3 gap-3 mt-2">
                    {['Light', 'Dark', 'System'].map(theme => (
                      <button
                        key={theme}
                        onClick={() => setPref('theme', theme)}
                        className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                          prefs.theme === theme
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-border text-muted-foreground hover:border-border-hover hover:text-white'
                        }`}
                      >
                        {theme}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground tracking-wide">Accent Color</label>
                  <div className="flex items-center gap-2 mt-2">
                    {['#e86a33', '#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#ec4899'].map(color => (
                      <button
                        key={color}
                        onClick={() => setPref('accent', color)}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          prefs.accent === color ? 'border-card-foreground scale-110' : 'border-transparent hover:scale-110'
                        }`}
                        style={{ background: color }}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Save Button */}
          <div className="flex justify-end mt-6">
            <Button onClick={handleSave} disabled={saved || activeSection === 'backend'}>
              {saved ? (
                <><Check className="w-4 h-4" /> Saved!</>
              ) : (
                <><Save className="w-4 h-4" /> Save Preferences</>
              )}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

function StatusDot({ on }: { on: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <motion.div
        animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className={`w-1.5 h-1.5 rounded-full ${on ? 'bg-emerald-400' : 'bg-red-400'}`}
      />
      <span className={`text-[10px] font-semibold uppercase tracking-wider ${on ? 'text-emerald-400' : 'text-red-400'}`}>
        {on ? 'Active' : 'Off'}
      </span>
    </div>
  )
}