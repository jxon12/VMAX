import type { CSSProperties } from 'react'
import type { OrbFlight } from '../../hooks/useOrbTransition'
import { Orb } from './Orb'

export function OrbTransition({ flight }: { flight: OrbFlight | null }) {
  if (!flight) return null

  const style = {
    left: `${flight.fromX}px`,
    top: `${flight.fromY}px`,
    width: `${flight.fromSize}px`,
    height: `${flight.fromSize}px`,
    '--orb-dx': `${flight.toX - flight.fromX}px`,
    '--orb-dy': `${flight.toY - flight.fromY}px`,
    '--orb-scale': flight.toSize / flight.fromSize,
  } as CSSProperties

  return (
    <div className={`orb-flight ${flight.animate ? 'orb-flight--moving' : ''}`} style={style}>
      <Orb size="fill" />
    </div>
  )
}
