import { useEffect, useRef } from 'react'

function LoginParticleBackground({
  className = 'login-particle-background',
  particleColor = '#fbb21b',
  glowColor = '#30356f',
  spacing = 24,
  interactionRadius = 190,
}) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined

    const context = canvas.getContext('2d')
    let width = 0
    let height = 0
    let animationId = 0
    let lastFrameTime = 0
    let isVisible = true
    let dots = []
    const pointer = { x: -1000, y: -1000, currentX: -1000, currentY: -1000, active: false }
    const particleHex = particleColor.replace('#', '')
    const particleRgb = [
      parseInt(particleHex.slice(0, 2), 16),
      parseInt(particleHex.slice(2, 4), 16),
      parseInt(particleHex.slice(4, 6), 16),
    ]
    const glowHex = glowColor.replace('#', '')
    const glowRgb = [
      parseInt(glowHex.slice(0, 2), 16),
      parseInt(glowHex.slice(2, 4), 16),
      parseInt(glowHex.slice(4, 6), 16),
    ]

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5)
      width = rect.width
      height = rect.height
      canvas.width = Math.round(width * ratio)
      canvas.height = Math.round(height * ratio)
      context.setTransform(ratio, 0, 0, ratio, 0, 0)

      dots = []
      for (let y = Math.round(spacing / 2); y < height; y += spacing) {
        for (let x = Math.round(spacing / 2); x < width; x += spacing) {
          dots.push({
            x,
            y,
            base: Math.random() * 0.3 + 0.7,
          })
        }
      }
      if (width && height) draw?.()
    }

    const movePointer = (event) => {
      const rect = canvas.getBoundingClientRect()
      pointer.x = event.clientX - rect.left
      pointer.y = event.clientY - rect.top
      if (pointer.currentX < -900) {
        pointer.currentX = pointer.x
        pointer.currentY = pointer.y
      }
      pointer.active = true
      startAnimation()
    }

    const leavePointer = () => {
      pointer.active = false
      startAnimation()
    }

    const draw = () => {
      context.clearRect(0, 0, width, height)
      pointer.currentX += (pointer.x - pointer.currentX) * 0.62
      pointer.currentY += (pointer.y - pointer.currentY) * 0.62

      dots.forEach((dot) => {
        let alpha = 0.16
        let size = 0.8
        let drawX = dot.x
        let drawY = dot.y

        if (pointer.active) {
          const dx = dot.x - pointer.currentX
          const dy = dot.y - pointer.currentY
          const distance = Math.sqrt(dx * dx + dy * dy)
          if (distance < interactionRadius) {
            const strength = 1 - distance / interactionRadius
            alpha += strength * 0.72
            size += strength * 2.35
            drawX -= (dx / Math.max(distance, 1)) * strength * 10
            drawY -= (dy / Math.max(distance, 1)) * strength * 10
            context.beginPath()
            context.strokeStyle = `rgba(${particleRgb[0]},${particleRgb[1]},${particleRgb[2]},${strength * 0.14})`
            context.lineWidth = 0.55
            context.moveTo(pointer.currentX, pointer.currentY)
            context.lineTo(drawX, drawY)
            context.stroke()
          }
        }

        context.beginPath()
        context.fillStyle = `rgba(${particleRgb[0]},${particleRgb[1]},${particleRgb[2]},${Math.min(alpha * dot.base, 0.88)})`
        context.arc(drawX, drawY, size, 0, Math.PI * 2)
        context.fill()
      })

      if (pointer.active) {
        const glow = context.createRadialGradient(pointer.currentX, pointer.currentY, 0, pointer.currentX, pointer.currentY, interactionRadius)
        glow.addColorStop(0, `rgba(${glowRgb[0]},${glowRgb[1]},${glowRgb[2]},0.13)`)
        glow.addColorStop(0.35, `rgba(${glowRgb[0]},${glowRgb[1]},${glowRgb[2]},0.045)`)
        glow.addColorStop(1, `rgba(${glowRgb[0]},${glowRgb[1]},${glowRgb[2]},0)`)
        context.fillStyle = glow
        context.fillRect(pointer.currentX - interactionRadius, pointer.currentY - interactionRadius, interactionRadius * 2, interactionRadius * 2)
      }

      const settledX = Math.abs(pointer.x - pointer.currentX) < 0.5
      const settledY = Math.abs(pointer.y - pointer.currentY) < 0.5
      if (pointer.active && isVisible && (!settledX || !settledY)) {
        animationId = window.requestAnimationFrame(animate)
      } else if (pointer.active && isVisible) {
        animationId = window.requestAnimationFrame(animate)
      } else {
        animationId = 0
      }
    }

    const animate = (time = 0) => {
      if (!isVisible) {
        animationId = 0
        return
      }
      if (time - lastFrameTime >= 32) {
        lastFrameTime = time
        draw()
      } else {
        animationId = window.requestAnimationFrame(animate)
      }
    }

    const startAnimation = () => {
      if (!animationId && isVisible) {
        animationId = window.requestAnimationFrame(animate)
      }
    }

    resize()
    window.addEventListener('resize', resize)
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting
      if (isVisible) {
        draw()
        if (pointer.active) startAnimation()
      } else if (animationId) {
        window.cancelAnimationFrame(animationId)
        animationId = 0
      }
    }, { rootMargin: '150px 0px' })
    visibilityObserver.observe(canvas)
    const surface = canvas.parentElement
    surface?.addEventListener('pointermove', movePointer, { passive: true })
    surface?.addEventListener('pointerleave', leavePointer, { passive: true })
    draw()

    return () => {
      window.removeEventListener('resize', resize)
      surface?.removeEventListener('pointermove', movePointer)
      surface?.removeEventListener('pointerleave', leavePointer)
      visibilityObserver.disconnect()
      window.cancelAnimationFrame(animationId)
    }
  }, [glowColor, interactionRadius, particleColor, spacing])

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />
}

export default LoginParticleBackground
