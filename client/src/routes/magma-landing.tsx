import { Navbar } from '../components/landing/navbar'
import { Hero } from '../components/landing/hero'
import { Process } from '../components/landing/process'
import { Expertise } from '../components/landing/expertise'
import { FooterCTA } from '../components/landing/footer-cta'
import { BgAnimation } from '../components/landing/bg-animation'

export function MagmaLandingPage() {
  return (
    <div className="relative min-h-screen text-foreground">
      {/* Background photo */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <img
          src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80&fit=crop"
          alt=""
          className="w-full h-full object-cover"
          style={{ opacity: 0.2 }}
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-transparent to-background/80" />
      </div>

      <BgAnimation />
      <div className="relative" style={{ zIndex: 2 }}>
        <Navbar />
        <Hero />
        <Process />
        <Expertise />
        <FooterCTA />
      </div>
    </div>
  )
}
