import { motion } from 'motion/react'
import { useNavigate } from '@tanstack/react-router'

export function Hero() {
  const navigate = useNavigate()

  return (
    <section className="relative min-h-[92vh] flex flex-col items-center justify-center overflow-hidden px-6 pt-20">
      {/* Ambient Glows */}
      <div className="absolute top-[-20%] left-[10%] w-[50vw] h-[50vw] rounded-full bg-primary/5 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[5%] w-[40vw] h-[40vw] rounded-full bg-accent/3 blur-[120px] pointer-events-none" />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '80px 80px',
        }}
      />

      <div className="relative z-10 text-center max-w-5xl mx-auto">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8"
        >
          Lead Intelligence Platform
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="text-5xl md:text-7xl lg:text-8xl font-heading font-bold leading-[0.95] tracking-tight text-white"
        >
          Find leads that
          <br />
          <span className="gradient-text">need your services</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
        >
          Discover businesses on Google without websites or scrape contact info from the web.
          Perfect for agencies, freelancers, and sales teams.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <button
            onClick={() => navigate({ to: '/search' })}
            className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-xl gradient-primary text-white font-semibold text-base hover:shadow-lg hover:shadow-primary/25 transition-all duration-300"
          >
            Start Finding Leads
            <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
          </button>
          <button
            onClick={() => navigate({ to: '/dashboard' })}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl border border-border hover:border-primary/30 hover:bg-primary/5 text-muted-foreground hover:text-white font-semibold text-base transition-all duration-300"
          >
            View Dashboard
          </button>
        </motion.div>

        {/* Feature Pills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.1 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-4"
        >
          {['Google Places', 'Web Scraping', 'Email Extraction', 'Phone Numbers'].map((label, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.2 + i * 0.1 }}
              className="px-4 py-2 rounded-full bg-card/50 border border-border/50 text-sm text-muted-foreground"
            >
              {label}
            </motion.div>
          ))}
        </motion.div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.4 }}
          className="mt-14 flex items-center justify-center gap-10 text-center"
        >
          <div>
            <p className="text-2xl font-bold text-white">2</p>
            <p className="text-xs text-muted-foreground">Search Modes</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div>
            <p className="text-2xl font-bold text-white">CSV</p>
            <p className="text-xs text-muted-foreground">Export</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div>
            <p className="text-2xl font-bold text-white">vCard</p>
            <p className="text-xs text-muted-foreground">Contacts</p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
