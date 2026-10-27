import { useEffect, useRef } from 'react'
import { hasFinePointer, isRich, prefersReducedMotion } from '../lib/motion'

export default function Spotlight() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || !isRich() || prefersReducedMotion() || !hasFinePointer()) return

    let raf = 0
    let last = 0
    let targetX = window.innerWidth / 2
    let targetY = window.innerHeight / 3
    let x = targetX
    let y = targetY

    const frame = (now: number) => {
      const dt = last ? Math.min(now - last, 64) : 16
      last = now
      const k = 1 - Math.exp(-dt / 110)
      x += (targetX - x) * k
      y += (targetY - y) * k
      el.style.setProperty('--sx', `${x.toFixed(1)}px`)
      el.style.setProperty('--sy', `${y.toFixed(1)}px`)
      const settled = Math.abs(targetX - x) < 0.5 && Math.abs(targetY - y) < 0.5
      if (settled) last = 0
      raf = settled ? 0 : requestAnimationFrame(frame)
    }

    const onMove = (e: PointerEvent) => {
      targetX = e.clientX
      targetY = e.clientY
      el.dataset.on = '1'
      if (!raf) raf = requestAnimationFrame(frame)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [])

  return <div ref={ref} className="spotlight" aria-hidden="true" />
}
