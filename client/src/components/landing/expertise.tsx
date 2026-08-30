import { motion, useInView } from 'motion/react'
import { useRef } from 'react'
import { useNavigate } from '@tanstack/react-router'

const searchModes = [
  {
    title: 'Google Places',
    subtitle: 'Businesses without websites',
    description: 'Find local businesses listed on Google that don\'t have a website. Perfect for web designers, agencies, and freelancers looking for clients who need web presence.',
    useCases: [
      'Web designers seeking clients',
      'Agencies doing outreach',
      'Freelancers building portfolio',
    ],
    gradient: 'from-orange-500 to-red-500',
    fields: ['Business Name', 'Phone', 'Address'],
    image: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&q=80&fit=crop',
    imageAlt: 'Map with business locations',
  },
  {
    title: 'Web Search',
    subtitle: 'Scrape contact info from URLs',
    description: 'Search DuckDuckGo for businesses and automatically extract emails and phone numbers from their websites. Great for sales teams and lead generation.',
    useCases: [
      'Sales team prospecting',
      'Lead generation campaigns',
      'Market research',
    ],
    gradient: 'from-blue-500 to-cyan-500',
    fields: ['URL', 'Emails', 'Phones'],
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80&fit=crop',
    imageAlt: 'Data analytics on screen',
  },
]

export function Expertise() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const navigate = useNavigate()

  return (
    <section id="modes" className="relative py-24 px-6 scroll-mt-20">
      <div className="max-w-7xl mx-auto" ref={ref}>
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="text-sm font-semibold text-primary uppercase tracking-widest mb-4 block">
            Search Modes
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-white leading-tight">
            Two ways to{' '}
            <span className="gradient-text">find leads</span>
          </h2>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
            Choose the right mode for your lead generation strategy
          </p>
        </motion.div>

        {/* Mode Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {searchModes.map((mode, i) => (
            <motion.div
              key={mode.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="group relative rounded-2xl border border-border/50 bg-card overflow-hidden hover:border-primary/30 transition-all duration-500"
            >
              {/* Top gradient line */}
              <div className={`h-[3px] bg-gradient-to-r ${mode.gradient}`} />

              {/* Image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={mode.image}
                  alt={mode.imageAlt}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
              </div>

              <div className="p-7 -mt-8 relative z-10">
                <div className="mb-5">
                  <h3 className="text-xl font-heading font-bold text-white">
                    {mode.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">{mode.subtitle}</p>
                </div>

                <p className="text-muted-foreground leading-relaxed mb-5">
                  {mode.description}
                </p>

                {/* Fields */}
                <div className="mb-5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Returns
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {mode.fields.map(field => (
                      <span
                        key={field}
                        className="px-3 py-1.5 rounded-lg bg-muted text-xs font-medium text-foreground"
                      >
                        {field}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Use Cases */}
                <div className="mb-5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Best for
                  </p>
                  <div className="space-y-2">
                    {mode.useCases.map(useCase => (
                      <div key={useCase} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        {useCase}
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => navigate({ to: '/search' })}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-border hover:border-primary/30 hover:bg-primary/5 text-muted-foreground hover:text-white font-semibold text-sm transition-all duration-300"
                >
                  Try {mode.title}
                  <span>&rarr;</span>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
