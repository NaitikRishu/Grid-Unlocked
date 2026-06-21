import { useEffect, useRef } from 'react'

export default function BackgroundCanvas() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    // Layer 1 - Aurora Blobs Configuration
    // Colors: deep violet #190426, obsidian magenta #2d001a, deep neon blue #031b2e
    const blobs = [
      { cx: width * 0.25, cy: height * 0.3, rx: width * 0.35, ry: height * 0.35, color: '#121212', phase: 0 },
      { cx: width * 0.75, cy: height * 0.25, rx: width * 0.4, ry: height * 0.4, color: '#1c1c1c', phase: Math.PI / 3 },
      { cx: width * 0.45, cy: height * 0.7, rx: width * 0.4, ry: height * 0.45, color: '#090909', phase: (Math.PI * 2) / 3 },
      { cx: width * 0.85, cy: height * 0.8, rx: width * 0.3, ry: height * 0.3, color: '#121212', phase: Math.PI },
      { cx: width * 0.1, cy: height * 0.85, rx: width * 0.35, ry: height * 0.35, color: '#1c1c1c', phase: (Math.PI * 4) / 3 }
    ]

    // Layer 2 - Constellation Particles
    // 120 particles, slow speed, radius 1-2px, opacity 0.3-0.7, bounce off edges
    const particles = []
    const particleCount = 120
    const connectionDistance = 100
    const speed = 0.15

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * speed * 2, // max ±0.15
        vy: (Math.random() - 0.5) * speed * 2, // max ±0.15
        r: Math.random() * 1 + 1, // 1px to 2px
        opacity: Math.random() * 0.4 + 0.3 // 0.3 to 0.7
      })
    }

    // Layer 3 - Scan Line
    // Sweeps top to bottom every 8 seconds (8 * 60 = 480 frames at 60fps)
    let scanLineY = 0

    const handleResize = () => {
      if (!canvas) return
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
      
      // Update blob positions on resize to keep them spread out
      blobs[0].cx = width * 0.25; blobs[0].cy = height * 0.3
      blobs[1].cx = width * 0.75; blobs[1].cy = height * 0.25
      blobs[2].cx = width * 0.45; blobs[2].cy = height * 0.7
      blobs[3].cx = width * 0.85; blobs[3].cy = height * 0.8
      blobs[4].cx = width * 0.1; blobs[4].cy = height * 0.85
    }
    window.addEventListener('resize', handleResize)

    const draw = (time) => {
      ctx.clearRect(0, 0, width, height)

      // --- Layer 1: Aurora Flow (Bezier Blobs) ---
      ctx.save()
      if (typeof ctx.filter !== 'undefined') {
        ctx.filter = 'blur(70px)' // Soften bezier paths into smooth auroras
      }
      ctx.globalAlpha = 0.35

      for (const blob of blobs) {
        ctx.fillStyle = blob.color
        ctx.beginPath()

        const t = time * 0.0003 + blob.phase
        // Shift control points and radius using Math.sin
        const scaleX = Math.sin(t) * 0.12 + 1.0
        const scaleY = Math.cos(t * 0.8) * 0.12 + 1.0
        const w = blob.rx * scaleX
        const h = blob.ry * scaleY

        // Drifting offset
        const dx = Math.sin(t * 0.5) * 50
        const dy = Math.cos(t * 0.6) * 50
        const cx = blob.cx + dx
        const cy = blob.cy + dy

        // Draw soft bezier shape
        ctx.moveTo(cx, cy - h)
        ctx.bezierCurveTo(cx + w * 0.55, cy - h, cx + w, cy - h * 0.55, cx + w, cy)
        ctx.bezierCurveTo(cx + w, cy + h * 0.55, cx + w * 0.55, cy + h, cx, cy + h)
        ctx.bezierCurveTo(cx - w * 0.55, cy + h, cx - w, cy + h * 0.55, cx - w, cy)
        ctx.bezierCurveTo(cx - w, cy - h * 0.55, cx - w * 0.55, cy - h, cx, cy - h)
        ctx.fill()
      }
      ctx.restore()

      // --- Layer 2: Constellation Grid ---
      ctx.save()
      for (let i = 0; i < particleCount; i++) {
        const p = particles[i]
        p.x += p.vx
        p.y += p.vy

        // Bounce check
        if (p.x < 0) { p.x = 0; p.vx *= -1 }
        if (p.x > width) { p.x = width; p.vx *= -1 }
        if (p.y < 0) { p.y = 0; p.vy *= -1 }
        if (p.y > height) { p.y = height; p.vy *= -1 }

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})` // Pure shining white star particles
        ctx.fill()
      }

      // Draw grid connections
      for (let i = 0; i < particleCount; i++) {
        for (let j = i + 1; j < particleCount; j++) {
          const p1 = particles[i]
          const p2 = particles[j]
          const dx = p1.x - p2.x
          const dy = p1.y - p2.y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < connectionDistance) {
            const opacity = 0.08 * (1 - dist / connectionDistance)
            ctx.beginPath()
            ctx.moveTo(p1.x, p1.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }
      ctx.restore()

      // --- Layer 3: Scan Line ---
      // Sweeps top to bottom every 8 seconds, resets
      ctx.save()
      const scanLineSpeed = height / (8 * 60) // 8 seconds duration
      scanLineY += scanLineSpeed
      if (scanLineY > height) {
        scanLineY = 0
      }

      const scanGradient = ctx.createLinearGradient(0, scanLineY - 2, 0, scanLineY + 2)
      scanGradient.addColorStop(0, 'rgba(255, 255, 255, 0)')
      scanGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)') // 2px tall glowing line
      scanGradient.addColorStop(1, 'rgba(255, 255, 255, 0)')

      ctx.fillStyle = scanGradient
      ctx.fillRect(0, scanLineY - 2, width, 4)
      ctx.restore()

      animationFrameId = requestAnimationFrame(draw)
    }

    // Start rendering loops
    animationFrameId = requestAnimationFrame(draw)

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  )
}
