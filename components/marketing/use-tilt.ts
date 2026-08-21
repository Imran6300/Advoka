'use client'

import { useEffect, useRef } from 'react'

/**
 * Very subtle cursor-based tilt for a single hero-level visual.
 * Disabled automatically for touch input and prefers-reduced-motion.
 * Intentionally restrained: a few degrees of rotation, nothing gimmicky.
 */
export function useTilt<T extends HTMLElement>(maxDeg = 3) {
  const ref = useRef<T | null>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches
    if (reduceMotion || isTouch) return

    let frame = 0

    const onMove = (e: PointerEvent) => {
      const rect = node.getBoundingClientRect()
      const px = (e.clientX - rect.left) / rect.width
      const py = (e.clientY - rect.top) / rect.height
      const ry = (px - 0.5) * maxDeg * 2
      const rx = (0.5 - py) * maxDeg * 2

      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        node.style.setProperty('--rx', `${rx.toFixed(2)}deg`)
        node.style.setProperty('--ry', `${ry.toFixed(2)}deg`)
      })
    }

    const onLeave = () => {
      cancelAnimationFrame(frame)
      node.style.setProperty('--rx', '0deg')
      node.style.setProperty('--ry', '0deg')
    }

    node.addEventListener('pointermove', onMove)
    node.addEventListener('pointerleave', onLeave)
    return () => {
      node.removeEventListener('pointermove', onMove)
      node.removeEventListener('pointerleave', onLeave)
      cancelAnimationFrame(frame)
    }
  }, [maxDeg])

  return ref
}
