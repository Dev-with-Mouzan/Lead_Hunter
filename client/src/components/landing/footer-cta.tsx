import { motion, useInView } from 'motion/react'
import { useRef } from 'react'
import { useNavigate } from '@tanstack/react-router'

export function FooterCTA() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const navigate = useNavigate()

  return (
    <section id="start" className="relative py-24 px-6 scroll-mt-20 overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1553877522-43269d4ea984?w=1400&q=80&fit=crop"
          alt=""
          className="w-full h-full object-cover opacity-[0.07]"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/90 to-background" />
      </div>

      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50vw] h-[50vw] rounded-full bg-primary/5 blur-[150px] pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto text-center" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-white leading-tight mb-6">
            Ready to find{' '}
            <span className="gradient-text">leads?</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-4">
            Start searching for businesses that need your services.
            Export as CSV or vCard and start your outreach today.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => navigate({ to: '/search' })}
              className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl gradient-primary text-white font-semibold text-lg hover:shadow-lg hover:shadow-primary/25 transition-all duration-300"
            >
              Start Finding Leads
              <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
