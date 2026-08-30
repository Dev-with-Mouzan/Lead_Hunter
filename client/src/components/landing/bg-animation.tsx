import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  size: number
  speedX: number
  speedY: number
  opacity: number
  rotation: number
  rotationSpeed: number
  shapePhase: number
}

type Shape = 'circle' | 'square' | 'triangle' | 'hexagon'

const shapes: Shape[] = ['circle', 'square', 'triangle', 'hexagon']

function getShapeFromScroll(scrollProgress: number): { from: Shape; to: Shape; blend: number } {
  const segment = scrollProgress * shapes.length
  const index = Math.floor(segment)
  const blend = segment - index
  const from = shapes[Math.min(index, shapes.length - 1)]
  const to = shapes[Math.min(index + 1, shapes.length - 1)]
  return { from, to, blend }
}

function drawShape(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  shape: Shape,
  rotation: number,
  opacity: number
) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rotation)
  ctx.fillStyle = `rgba(232, 106, 51, ${opacity})`

  switch (shape) {
    case 'circle':
      ctx.beginPath()
      ctx.arc(0, 0, size, 0, Math.PI * 2)
      ctx.fill()
      break

    case 'square':
      ctx.fillRect(-size, -size, size * 2, size * 2)
      break

    case 'triangle':
      ctx.beginPath()
      ctx.moveTo(0, -size * 1.2)
      ctx.lineTo(-size, size * 0.8)
      ctx.lineTo(size, size * 0.8)
      ctx.closePath()
      ctx.fill()
      break

    case 'hexagon':
      ctx.beginPath()
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6
        const hx = Math.cos(angle) * size
        const hy = Math.sin(angle) * size
        if (i === 0) ctx.moveTo(hx, hy)
        else ctx.lineTo(hx, hy)
      }
      ctx.closePath()
      ctx.fill()
      break
  }

  ctx.restore()
}

export function BgAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const scrollRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animFrame: number
    let particles: Particle[] = []

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    const initParticles = () => {
      particles = Array.from({ length: 50 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 3 + 1,
        speedX: (Math.random() - 0.5) * 0.4,
        speedY: (Math.random() - 0.5) * 0.4,
        opacity: Math.random() * 0.4 + 0.08,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.02,
        shapePhase: Math.random() * shapes.length,
      }))
    }

    const handleScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight
      scrollRef.current = maxScroll > 0 ? window.scrollY / maxScroll : 0
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const scrollProgress = scrollRef.current
      const { from, to, blend } = getShapeFromScroll(scrollProgress)

      particles.forEach((p) => {
        p.x += p.speedX
        p.y += p.speedY
        p.rotation += p.rotationSpeed

        // Wrap around
        if (p.x < -10) p.x = canvas.width + 10
        if (p.x > canvas.width + 10) p.x = -10
        if (p.y < -10) p.y = canvas.height + 10
        if (p.y > canvas.height + 10) p.y = -10

        // Per-particle shape offset for variety
        const particleBlend = (blend + p.shapePhase / shapes.length) % 1

        // Draw both shapes with cross-fade for smooth morphing
        if (particleBlend < 0.5) {
          drawShape(ctx, p.x, p.y, p.size, from, p.rotation, p.opacity * (1 - particleBlend * 2))
        }
        if (particleBlend > 0.5) {
          drawShape(ctx, p.x, p.y, p.size, to, p.rotation, p.opacity * ((particleBlend - 0.5) * 2))
        }
        // At the midpoint, draw full opacity of the transitioning shape
        if (particleBlend >= 0.4 && particleBlend <= 0.6) {
          drawShape(ctx, p.x, p.y, p.size, to, p.rotation, p.opacity)
        }
      })

      // Draw connections between nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < 100) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(232, 106, 51, ${0.05 * (1 - dist / 100)})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }

      animFrame = requestAnimationFrame(draw)
    }

    resize()
    initParticles()
    draw()

    window.addEventListener('resize', () => {
      resize()
      initParticles()
    })
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      cancelAnimationFrame(animFrame)
      window.removeEventListener('resize', resize)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
      {/* Floating gradient orbs */}
      <div className="absolute top-[10%] left-[15%] w-[30vw] h-[30vw] rounded-full bg-primary/[0.04] blur-[100px] animate-float-slow" />
      <div className="absolute top-[50%] right-[10%] w-[25vw] h-[25vw] rounded-full bg-accent/[0.03] blur-[80px] animate-float-medium" />
      <div className="absolute bottom-[15%] left-[30%] w-[35vw] h-[35vw] rounded-full bg-primary/[0.03] blur-[120px] animate-float-fast" />

      {/* Moving gradient lines */}
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.015]">
        <div className="absolute top-1/4 -left-1/4 w-[150%] h-px bg-gradient-to-r from-transparent via-primary to-transparent animate-scan-line" />
        <div className="absolute top-2/3 -left-1/4 w-[150%] h-px bg-gradient-to-r from-transparent via-accent to-transparent animate-scan-line-delayed" />
      </div>

      {/* Particle canvas */}
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  )
}
