import { useEffect, useLayoutEffect, useState } from 'react'
import type { CSSProperties, MouseEvent, RefObject } from 'react'
import { flushSync } from 'react-dom'

type TransitionDocument = Document & {
  startViewTransition?: (update: () => void) => { finished: Promise<unknown> }
}

export function isRich(): boolean {
  return document.documentElement.dataset.motion === 'rich'
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function hasFinePointer(): boolean {
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches
}

export function stagger(i: number): CSSProperties {
  return { '--i': i } as CSSProperties
}

export function canViewTransition(): boolean {
  return (
    isRich() &&
    !prefersReducedMotion() &&
    typeof (document as TransitionDocument).startViewTransition === 'function'
  )
}

export function runViewTransition(update: () => void): Promise<unknown> {
  const doc = document as TransitionDocument
  const root = document.documentElement
  if (!doc.startViewTransition) {
    update()
    return Promise.resolve()
  }
  root.dataset.vt = '1'
  const transition = doc.startViewTransition(() => flushSync(update))
  return transition.finished.catch(() => undefined).finally(() => delete root.dataset.vt)
}

export function openWithTransition(
  e: MouseEvent<HTMLElement>,
  go: () => void,
  shared: HTMLElement | null
): void {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
  if (!shared || !canViewTransition()) return
  e.preventDefault()
  shared.style.setProperty('view-transition-name', 'poster-shared')
  runViewTransition(go).then(() => shared.style.removeProperty('view-transition-name'))
}

export function useInViewOnce<T extends Element>(ref: RefObject<T>): boolean {
  const [seen, setSeen] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || seen) return
    if (!isRich() || typeof IntersectionObserver === 'undefined') {
      setSeen(true)
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true)
          observer.disconnect()
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref, seen])

  return seen
}

export function useSlidingIndicator(
  containerRef: RefObject<HTMLElement>,
  activeSelector: string,
  watch: string
): { style: CSSProperties | null; ready: boolean } {
  const [style, setStyle] = useState<CSSProperties | null>(null)
  const [ready, setReady] = useState(false)

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return
    const measure = () => {
      const active = container.querySelector<HTMLElement>(activeSelector)
      if (!active) {
        setStyle((prev) => (prev ? { ...prev, opacity: 0 } : null))
        return
      }
      setStyle({
        width: active.offsetWidth,
        height: active.offsetHeight,
        transform: `translate(${active.offsetLeft}px, ${active.offsetTop}px)`,
        opacity: 1,
      })
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(container)
    return () => observer.disconnect()
  }, [containerRef, activeSelector, watch])

  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(id)
  }, [])

  return { style, ready }
}

export function useTilt(ref: RefObject<HTMLElement>, maxDeg = 3.5): void {
  useEffect(() => {
    const el = ref.current
    if (!el || !isRich() || prefersReducedMotion() || !hasFinePointer()) return

    let raf = 0
    let last = 0
    let targetX = 0
    let targetY = 0
    let currentX = 0
    let currentY = 0
    let hovering = false

    const frame = (now: number) => {
      const dt = last ? Math.min(now - last, 64) : 16
      last = now
      const k = 1 - Math.exp(-dt / 70)
      currentX += (targetX - currentX) * k
      currentY += (targetY - currentY) * k
      const rx = (-currentY * maxDeg).toFixed(2)
      const ry = (currentX * maxDeg).toFixed(2)
      el.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(${hovering ? -3 : 0}px)`
      const settled = Math.abs(currentX) < 0.002 && Math.abs(currentY) < 0.002
      if (hovering || !settled) {
        raf = requestAnimationFrame(frame)
      } else {
        el.style.transform = ''
        raf = 0
        last = 0
      }
    }

    const wake = () => {
      if (!raf) raf = requestAnimationFrame(frame)
    }

    const onEnter = () => {
      hovering = true
      wake()
    }

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect()
      const px = (e.clientX - rect.left) / rect.width
      const py = (e.clientY - rect.top) / rect.height
      targetX = px * 2 - 1
      targetY = py * 2 - 1
      el.style.setProperty('--gx', `${(px * 100).toFixed(1)}%`)
      el.style.setProperty('--gy', `${(py * 100).toFixed(1)}%`)
      wake()
    }

    const onLeave = () => {
      hovering = false
      targetX = 0
      targetY = 0
      wake()
    }

    el.addEventListener('pointerenter', onEnter)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerleave', onLeave)
    return () => {
      el.removeEventListener('pointerenter', onEnter)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
      cancelAnimationFrame(raf)
      el.style.transform = ''
    }
  }, [ref, maxDeg])
}
