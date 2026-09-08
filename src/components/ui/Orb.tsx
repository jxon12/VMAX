import { forwardRef } from 'react'
import '../../styles/orb.css'

export type OrbSize = 'nav' | 'assistant' | 'fill'

type OrbProps = {
  size?: OrbSize
  hidden?: boolean
  ghost?: boolean
  className?: string
}

export const Orb = forwardRef<HTMLSpanElement, OrbProps>(function Orb(
  { size = 'nav', hidden = false, ghost = false, className = '' },
  ref,
) {
  const classes = [
    'orb',
    `orb--${size}`,
    hidden ? 'orb--hidden' : '',
    ghost ? 'orb--ghost' : '',
    className,
  ].filter(Boolean).join(' ')

  return (
    <span ref={ref} className={classes} aria-hidden="true">
      <span className="orb__flow orb__flow--one" />
      <span className="orb__flow orb__flow--two" />
      <span className="orb__glint" />
    </span>
  )
})
