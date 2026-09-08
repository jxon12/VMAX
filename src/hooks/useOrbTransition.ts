import { useCallback, useLayoutEffect, useRef, useState } from 'react'

export type OrbPhase = 'idle' | 'opening' | 'open' | 'closing'

export type OrbFlight = {
  fromX: number
  fromY: number
  toX: number
  toY: number
  fromSize: number
  toSize: number
  animate: boolean
}

const OPEN_DURATION = 720
const CLOSE_DURATION = 720

export function useOrbTransition() {
  const [phase, setPhase] = useState<OrbPhase>('idle')
  const [flight, setFlight] = useState<OrbFlight | null>(null)
  const navOrbRef = useRef<HTMLSpanElement>(null)
  const assistantOrbRef = useRef<HTMLSpanElement>(null)

  const open = useCallback(() => {
    setPhase((current) => current === 'idle' ? 'opening' : current)
  }, [])

  const close = useCallback(() => {
    setPhase((current) => current === 'open' || current === 'opening' ? 'closing' : current)
  }, [])

  useLayoutEffect(() => {
    if (phase !== 'opening' && phase !== 'closing') return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setFlight(null)
      setPhase(phase === 'opening' ? 'open' : 'idle')
      return
    }

    const source = phase === 'opening' ? navOrbRef.current : assistantOrbRef.current
    const target = phase === 'opening' ? assistantOrbRef.current : navOrbRef.current

    if (!source || !target) {
      setFlight(null)
      setPhase(phase === 'opening' ? 'open' : 'idle')
      return
    }

    const from = source.getBoundingClientRect()
    const to = target.getBoundingClientRect()
    const nextFlight: OrbFlight = {
      fromX: from.left,
      fromY: from.top,
      toX: to.left,
      toY: to.top,
      fromSize: from.width,
      toSize: to.width,
      animate: false,
    }

    setFlight(nextFlight)

    let secondFrame = 0
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        setFlight({ ...nextFlight, animate: true })
      })
    })

    const timer = window.setTimeout(() => {
      setFlight(null)
      setPhase(phase === 'opening' ? 'open' : 'idle')
    }, phase === 'opening' ? OPEN_DURATION : CLOSE_DURATION)

    return () => {
      window.cancelAnimationFrame(firstFrame)
      window.cancelAnimationFrame(secondFrame)
      window.clearTimeout(timer)
    }
  }, [phase])

  return {
    phase,
    flight,
    navOrbRef,
    assistantOrbRef,
    open,
    close,
    assistantMounted: phase !== 'idle',
    navOrbHidden: phase !== 'idle',
    assistantOrbGhost: phase !== 'open',
  }
}
