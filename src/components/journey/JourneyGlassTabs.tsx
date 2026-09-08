import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import { LiquidGlass } from 'simple-liquid-glass'
import type { Trip } from '../../types/trips'

const sections = [
  ['overview', 'Overview'], ['plan', 'Plan'], ['map', 'Route'], ['group', 'Group'], ['budget', 'Budget'],
] as const

/** A single optical surface; labels stay outside the filter and remain sharp. */
export function JourneyGlassTabs({ active, unread, onChange }: {
  active: Trip['activeTab']; unread: boolean; onChange: (tab: Trip['activeTab']) => void
}) {
  const nav = useRef<HTMLElement>(null)
  const gesture = useRef<{ x: number; y: number; pointerId: number; dragging: boolean } | null>(null)
  const suppressClick = useRef(false)
  const [dragPosition, setDragPosition] = useState<number | null>(null)
  const [reduceTransparency, setReduceTransparency] = useState(false)
  const selected = Math.max(0, sections.findIndex(([key]) => key === active))

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-transparency: reduce)')
    const update = () => setReduceTransparency(preference.matches)
    update(); preference.addEventListener('change', update)
    return () => preference.removeEventListener('change', update)
  }, [])

  const positionAt = (clientX: number) => {
    const rect = nav.current!.getBoundingClientRect()
    const segmentWidth = (rect.width - 8) / sections.length
    return Math.max(0, Math.min(4, (clientX - rect.left - 4) / segmentWidth - .5))
  }
  const finish = (event: PointerEvent<HTMLElement>, cancelled = false) => {
    if (!gesture.current || event.pointerId !== gesture.current.pointerId) return
    if (gesture.current.dragging && !cancelled) {
      suppressClick.current = true
      onChange(sections[Math.round(positionAt(event.clientX))][0])
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    gesture.current = null; setDragPosition(null)
  }

  return <nav ref={nav} className={`j-tabs jl-tabs ${dragPosition !== null ? 'is-dragging' : ''}`} aria-label="Journey sections"
    style={{ '--jl-selected': dragPosition ?? selected } as CSSProperties}
    onPointerDown={event => {
      if (!event.isPrimary || event.button !== 0) return
      suppressClick.current = false
      gesture.current = { x: event.clientX, y: event.clientY, pointerId: event.pointerId, dragging: false }
    }}
    onPointerMove={event => {
      const start = gesture.current
      if (!start || event.pointerId !== start.pointerId) return
      if (!start.dragging) {
        const dx = Math.abs(event.clientX - start.x), dy = Math.abs(event.clientY - start.y)
        if (Math.max(dx, dy) <= 8) return
        if (dy > dx) { gesture.current = null; return }
        start.dragging = true; event.currentTarget.setPointerCapture(event.pointerId)
      }
      if (start.dragging) setDragPosition(positionAt(event.clientX))
    }}
    onPointerUp={event => finish(event)} onPointerCancel={event => finish(event, true)}
    onPointerLeave={event => { if (gesture.current?.pointerId === event.pointerId && !gesture.current.dragging) gesture.current = null }}
    onLostPointerCapture={event => { if (gesture.current?.pointerId === event.pointerId) { gesture.current = null; setDragPosition(null) } }}
    onClickCapture={event => { if (suppressClick.current && event.detail > 0) { event.preventDefault(); event.stopPropagation(); suppressClick.current = false } }}
    onKeyDown={event => {
      suppressClick.current = false
      const focused = sections.findIndex(([key]) => (event.target as HTMLElement).dataset.section === key)
      if (focused < 0 || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
      event.preventDefault()
      const index = event.key === 'Home' ? 0 : event.key === 'End' ? 4 : (focused + (event.key === 'ArrowRight' ? 1 : -1) + 5) % 5
      nav.current?.querySelector<HTMLButtonElement>(`[data-section="${sections[index][0]}"]`)?.focus()
      onChange(sections[index][0])
    }}>
    <LiquidGlass aria-hidden="true" className="jl-optical-surface" mode="custom" lens="rim" radius={28}
      scale={60} lensStrength={.8} frost={.015} blur={.35} glassColor="rgba(255,255,255,0.035)"
      borderColor="rgba(255,255,255,0.28)" saturation={115} dispersion={0} aberrationIntensity={0}
      quality="low" effectMode={reduceTransparency ? 'off' : 'auto'} liquid={false}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}/>
    <span className="jl-selection" aria-hidden="true"/>
    {sections.map(([key, label]) => <button key={key} data-section={key} aria-current={key === active ? 'page' : undefined}
      className={key === active ? 'selected' : ''} onClick={() => onChange(key)}>
      {label}{key === 'group' && unread && <i/>}
    </button>)}
  </nav>
}
