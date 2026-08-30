import { motion, useInView } from 'motion/react'
import { useRef } from 'react'
import { useNavigate } from '@tanstack/react-router'

const features = [
  {
    title: 'Google Places Search',
    description: 'Find businesses on Google that don\'t have a website. Perfect for web designers and agencies looking for clients.',
    gradient: 'from-orange-500 to-red-500',
    tag: 'Places',
  },
  {
    title: 'Web Search & Scrape',
    description: 'Search DuckDuckGo for businesses and automatically extract emails and phone numbers from their websites.',
    gradient: 'from-blue-500 to-cyan-500',
    tag: 'Web',
  },
  {
    title: 'Email Extraction',
    description: 'Automatically scrape email addresses from web pages using regex pattern matching.',
    gradient: 'from-purple-500 to-pink-500',
    tag: 'Extract',
  },
  {
    title: 'Phone Number Detection',
    description: 'Find and clean phone numbers from business websites, ready for outreach.',
    gradient: 'from-emerald-500 to-teal-500',
    tag: 'Detect',
  },
  {
    title: 'CSV Export',
    description: 'Download your leads as a CSV file for easy import into CRM systems and spreadsheets.',
    gradient: 'from-amber-500 to-orange-500',
    tag: 'Export',
  },
  {
    title: 'vCard Contacts',
    description: 'Export leads as vCard files (.vcf) to import directly into your phone or contact manager.',
    gradient: 'from-rose-500 to-red-500',
    tag: 'Contacts',
  },
]

export function Services() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const navigate = useNavigate()

  return (
    <section id="features" className="relative py-24 px-6 scroll-mt-20">
      {/* Background accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/[0.03] blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto" ref={ref}>
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
            Powerful Features
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-white leading-tight">
            Everything you need to{' '}
            <span className="gradient-text">find leads</span>
          </h2>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
            Two powerful search modes, automatic contact extraction, and easy export options
          </p>
        </motion.div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.07 }}
              className="group relative rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm overflow-hidden transition-all duration-500 hover:border-border-hover hover:bg-card/80 hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)]"
            >
              {/* Gradient accent bar */}
              <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${item.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

              {/* Hover glow */}
              <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500`} />

              <div className="relative z-10 p-6">
                {/* Tag */}
                <div className="flex items-center justify-between mb-5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-full border border-border/30">
                    {item.tag}
                  </span>
                </div>

                {/* Content */}
                <h3 className="text-base font-heading font-semibold text-white mb-2 group-hover:text-primary transition-colors duration-300">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center mt-14"
        >
          <button
            onClick={() => navigate({ to: '/search' })}
            className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-xl gradient-primary text-white font-semibold text-sm hover:shadow-lg hover:shadow-primary/25 transition-all duration-300"
          >
            Try it now
            <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
          </button>
        </motion.div>
      </div>
    </section>
  )
}
