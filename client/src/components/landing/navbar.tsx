import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useNavigate, useMatches } from '@tanstack/react-router'
import { Menu, X } from 'lucide-react'

const routeTabs = [
  { label: 'Home', path: '/' },
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Search', path: '/search' },
  { label: 'History', path: '/history' },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = useNavigate()
  const matches = useMatches()

  const currentPath = matches[matches.length - 1]?.pathname || '/'

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const isActive = (path: string) => {
    if (path === '/') return currentPath === '/'
    return currentPath.startsWith(path)
  }

  return (
    <>
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-background/80 backdrop-blur-xl shadow-[0_4px_20px_rgba(232,106,51,0.08)] border-b border-primary/10'
            : 'bg-transparent shadow-[0_4px_12px_rgba(232,106,51,0.05)]'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-1.5">
            <img src="/logo.png" alt="LeadHunter" className="h-10 w-auto shrink-0" />
            <span className="font-heading font-bold text-xl tracking-tight text-white">
              LeadHunter
            </span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {routeTabs.map((tab) => (
              <button
                key={tab.path}
                onClick={() => navigate({ to: tab.path })}
                className={`text-sm font-medium px-4 py-2 rounded-lg transition-all duration-300 ${
                  isActive(tab.path)
                    ? 'text-white bg-white/10'
                    : 'text-muted-foreground hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={() => navigate({ to: '/search' })}
              className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-primary text-white text-sm font-semibold hover:shadow-lg hover:shadow-primary/25 transition-all duration-300"
            >
              Find Leads
              <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
            </button>
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-white hover:bg-muted/50 transition-all"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed inset-0 z-40 bg-background/95 backdrop-blur-xl pt-24 px-6"
          >
            <div className="flex flex-col gap-2">
              {routeTabs.map((tab, i) => (
                <motion.button
                  key={tab.path}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  onClick={() => { setMobileOpen(false); navigate({ to: tab.path }) }}
                  className={`text-left py-3 px-4 rounded-lg text-lg font-heading font-semibold transition-colors ${
                    isActive(tab.path)
                      ? 'text-white bg-white/10'
                      : 'text-muted-foreground hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab.label}
                </motion.button>
              ))}
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: routeTabs.length * 0.08 }}
                onClick={() => { setMobileOpen(false); navigate({ to: '/search' }) }}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl gradient-primary text-white text-lg font-semibold w-fit mt-4"
              >
                Find Leads
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
