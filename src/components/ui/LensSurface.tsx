import { useEffect, useState } from 'react'
import { LiquidGlass } from 'simple-liquid-glass'

/** Decorative optics only: accessible content remains outside the distortion layer. */
export function LensSurface({ radius = 26 }: { radius?: number }) {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-transparency: reduce)')
    const update = () => setReduced(preference.matches)
    update()
    preference.addEventListener('change', update)
    return () => preference.removeEventListener('change', update)
  }, [])
  return <LiquidGlass aria-hidden="true" className="lens-optics" mode="custom" lens="rim" radius={radius}
    scale={20} lensStrength={.4} frost={.015} blur={.35} glassColor="rgba(255,255,255,0.035)"
    borderColor="rgba(255,255,255,0.28)" saturation={115} dispersion={0} aberrationIntensity={0}
    quality="low" effectMode={reduced ? 'off' : 'auto'} liquid={false}
    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}/>
}
