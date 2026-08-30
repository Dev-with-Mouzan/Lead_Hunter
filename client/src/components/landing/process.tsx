import { useState, useEffect, useRef } from 'react'
import { motion, useInView, AnimatePresence } from 'motion/react'
import { useNavigate } from '@tanstack/react-router'

const steps = [
  {
    number: '01',
    title: 'Search',
    description: 'Enter a business niche and location. Choose between Google Places or Web Search.',
  },
  {
    number: '02',
    title: 'Extract',
    description: 'The system automatically scrapes emails, phone numbers, and addresses.',
  },
  {
    number: '03',
    title: 'Export',
    description: 'Download your leads as CSV or vCard files to import into your CRM.',
  },
]

/* ── Animated Search Mockup ── */
function SearchMockup() {
  const [niche, setNiche] = useState('')
  const [location, setLocation] = useState('')
  const nicheText = 'Dentists'
  const locationText = 'Austin, TX'

  useEffect(() => {
    let i = 0
    const interval = setInterval(() => {
      if (i <= nicheText.length) {
        setNiche(nicheText.slice(0, i))
        i++
      } else {
        clearInterval(interval)
        let j = 0
        const locInterval = setInterval(() => {
          if (j <= locationText.length) {
            setLocation(locationText.slice(0, j))
            j++
          } else {
            clearInterval(locInterval)
          }
        }, 60)
      }
    }, 70)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="rounded-2xl border border-border/50 bg-card/80 p-5 space-y-4">
      {/* Search mode selector */}
      <div className="flex gap-2">
        <div className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/30 text-xs font-semibold text-primary">
          Google Places
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-muted text-xs font-medium text-muted-foreground">
          Web Search
        </div>
      </div>

      {/* Niche input */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Business Niche
        </label>
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-background border border-border/50">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-sm text-foreground font-mono">{niche}</span>
          <span className="w-0.5 h-4 bg-primary animate-pulse" />
        </div>
      </div>

      {/* Location input */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Location
        </label>
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-background border border-border/50">
          <span className="text-sm text-foreground font-mono">{location}</span>
        </div>
      </div>

      {/* Max results */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Max Results
        </label>
        <div className="px-3 py-2.5 rounded-xl bg-background border border-border/50">
          <span className="text-sm text-foreground font-mono">50</span>
        </div>
      </div>

      {/* Search button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 }}
        className="w-full py-2.5 rounded-xl gradient-primary text-white text-sm font-semibold"
      >
        Search Leads
      </motion.button>
    </div>
  )
}

/* ── Animated Extract Mockup ── */
function ExtractMockup() {
  const leads = [
    { name: 'Smile Dental Clinic', email: 'info@smiledental.com', phone: '(512) 555-0123' },
    { name: 'Austin Family Dentistry', email: 'hello@austindent.com', phone: '(512) 555-0456' },
    { name: 'Bright Teeth Studio', email: 'contact@brightteeth.com', phone: '(512) 555-0789' },
  ]

  return (
    <div className="rounded-2xl border border-border/50 bg-card/80 p-5 space-y-3">
      {/* Status bar */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-xs font-mono text-emerald-400">Extracting data...</span>
        <div className="flex-1" />
        <span className="text-xs font-mono text-muted-foreground">3/3</span>
      </div>

      {leads.map((lead, i) => (
        <motion.div
          key={lead.name}
          initial={{ opacity: 0, x: -20, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ delay: 0.3 + i * 0.4, duration: 0.4 }}
          className="p-3 rounded-xl bg-background border border-border/30 space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">{lead.name}</span>
            <div className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-[10px] font-bold text-emerald-400">
              FOUND
            </div>
          </div>
          <div className="flex gap-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 + i * 0.4 }}
              className="flex items-center gap-1.5"
            >
              <div className="w-1 h-1 rounded-full bg-blue-400" />
              <span className="text-xs font-mono text-muted-foreground">{lead.email}</span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 + i * 0.4 }}
              className="flex items-center gap-1.5"
            >
              <div className="w-1 h-1 rounded-full bg-emerald-400" />
              <span className="text-xs font-mono text-muted-foreground">{lead.phone}</span>
            </motion.div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

/* ── Animated Export Mockup ── */
function ExportMockup() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval)
          return 100
        }
        return p + 2
      })
    }, 40)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="rounded-2xl border border-border/50 bg-card/80 p-5 space-y-4">
      {/* Export options */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 rounded-xl bg-background border border-border/30 text-center space-y-2"
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center mx-auto">
            <span className="text-lg font-bold text-emerald-400">.csv</span>
          </div>
          <p className="text-xs font-semibold text-foreground">CSV Export</p>
          <p className="text-[10px] text-muted-foreground">Spreadsheet ready</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-4 rounded-xl bg-background border border-border/30 text-center space-y-2"
        >
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center mx-auto">
            <span className="text-lg font-bold text-blue-400">.vcf</span>
          </div>
          <p className="text-xs font-semibold text-foreground">vCard Export</p>
          <p className="text-[10px] text-muted-foreground">Phone contacts</p>
        </motion.div>
      </div>

      {/* Download progress */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="p-3 rounded-xl bg-background border border-border/30"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-foreground">leads_export.csv</span>
          <span className="text-[10px] font-mono text-primary">{progress}%</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full rounded-full gradient-primary"
            style={{ width: `${progress}%` }}
          />
        </div>
      </motion.div>

      {/* Success state */}
      <AnimatePresence>
        {progress >= 100 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
          >
            <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
              <span className="text-white text-xs">✓</span>
            </div>
            <span className="text-xs font-semibold text-emerald-400">Download complete — 50 leads exported</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ── Main Process Component ── */
export function Process() {
  const [activeStep, setActiveStep] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const navigate = useNavigate()

  // Auto-advance steps
  useEffect(() => {
    if (!isInView) return
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [isInView])

  const mockups = [<SearchMockup key="search" />, <ExtractMockup key="extract" />, <ExportMockup key="export" />]

  return (
    <section id="how-it-works" className="relative py-24 px-6 scroll-mt-20 overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[40vw] rounded-full bg-primary/3 blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto" ref={ref}>
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="text-sm font-semibold text-primary uppercase tracking-widest mb-4 block">
            How It Works
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-white leading-tight">
            Three steps to{' '}
            <span className="gradient-text">more leads</span>
          </h2>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
            Simple, fast, and effective lead generation
          </p>
        </motion.div>

        {/* Main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left: Steps + Description */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-4"
          >
            {steps.map((step, i) => (
              <button
                key={step.number}
                onClick={() => setActiveStep(i)}
                className={`w-full flex items-start gap-4 p-5 rounded-2xl border transition-all duration-500 text-left ${
                  activeStep === i
                    ? 'bg-primary/5 border-primary/30 shadow-[0_0_30px_rgba(232,106,51,0.08)]'
                    : 'bg-card/30 border-border/30 hover:border-border/50 hover:bg-card/50'
                }`}
              >
                {/* Step number with progress indicator */}
                <div className="relative shrink-0">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold font-heading transition-all duration-500 ${
                      activeStep === i
                        ? 'gradient-primary text-white shadow-lg shadow-primary/20'
                        : activeStep > i
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {activeStep > i ? (
                      <span className="text-base">✓</span>
                    ) : (
                      step.number
                    )}
                  </div>
                  {/* Connecting line */}
                  {i < steps.length - 1 && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-px h-4">
                      <div
                        className={`w-full h-full transition-colors duration-500 ${
                          activeStep > i ? 'bg-primary/30' : 'bg-border/30'
                        }`}
                      />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3
                      className={`text-lg font-heading font-bold transition-colors duration-300 ${
                        activeStep === i ? 'text-white' : 'text-muted-foreground'
                      }`}
                    >
                      {step.title}
                    </h3>
                  </div>
                  <p
                    className={`text-sm leading-relaxed transition-colors duration-300 ${
                      activeStep === i ? 'text-muted-foreground' : 'text-muted-foreground/60'
                    }`}
                  >
                    {step.description}
                  </p>
                </div>

                {/* Active indicator dot */}
                {activeStep === i && (
                  <motion.div
                    layoutId="activeDot"
                    className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2"
                  />
                )}
              </button>
            ))}

          </motion.div>

          {/* Right: Animated Mockup */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="relative"
          >
            {/* Mockup glow */}
            <div className="absolute -inset-8 bg-primary/[0.04] blur-[60px] rounded-full pointer-events-none" />

            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.98 }}
                transition={{ duration: 0.4 }}
              >
                {mockups[activeStep]}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Centered CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="flex justify-center mt-12"
        >
          <button
            onClick={() => navigate({ to: '/search' })}
            className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-xl gradient-primary text-white font-semibold text-base hover:shadow-lg hover:shadow-primary/25 transition-all duration-300"
          >
            Get Started
            <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
          </button>
        </motion.div>
      </div>
    </section>
  )
}
