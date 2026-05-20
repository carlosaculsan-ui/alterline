import { useEffect, useRef } from 'react'

export default function CursorTrail() {
  const canvasRef = useRef(null)
  const enabledRef = useRef(localStorage.getItem('alterline-cursor-trail') === '1')

  useEffect(() => {
    function onToggle() {
      enabledRef.current = localStorage.getItem('alterline-cursor-trail') === '1'
    }
    window.addEventListener('alterline-trail-toggle', onToggle)
    return () => window.removeEventListener('alterline-trail-toggle', onToggle)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const particles = []
    let rafId

    function resize() {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    let lastX = -1000, lastY = -1000

    function onMove(e) {
      if (!enabledRef.current) return
      const { clientX: x, clientY: y } = e
      if (Math.hypot(x - lastX, y - lastY) < 8) return
      lastX = x
      lastY = y
      const count = Math.floor(Math.random() * 2) + 1
      for (let i = 0; i < count; i++) {
        particles.push({
          x: x + (Math.random() - 0.5) * 4,
          y: y + (Math.random() - 0.5) * 4,
          r: Math.random() * 2.5 + 1.5,
          life: 1,
          vx: (Math.random() - 0.5) * 0.6,
          vy: -(Math.random() * 0.6 + 0.2),
          decay: 0.022 + Math.random() * 0.018,
        })
      }
    }
    document.addEventListener('mousemove', onMove)

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.life -= p.decay
        if (p.life <= 0) { particles.splice(i, 1); continue }
        p.x += p.vx
        p.y += p.vy
        ctx.globalAlpha = p.life * 0.65
        ctx.fillStyle = '#6366f1'
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
      rafId = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      document.removeEventListener('mousemove', onMove)
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(rafId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 999998 }}
    />
  )
}
