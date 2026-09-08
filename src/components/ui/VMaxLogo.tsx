import { useId } from 'react'

export function VMaxLogo({ className }: { className?: string }) {
  const filterId = `vmax-logo-${useId().replace(/:/g, '')}`

  return (
    <svg
      className={className}
      viewBox="605 877 765 246"
      width="112"
      height="36"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <filter id={filterId} colorInterpolationFilters="sRGB">
          {/* Knock out the Canva export's #191919 background without changing the source artwork. */}
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 1
                    0 0 0 0 1
                    0 0 0 0 1
                    .369565 .369565 .369565 0 -.108696"
          />
        </filter>
      </defs>
      <image
        href="/images/vmax-logo-canva.png"
        width="2000"
        height="2000"
        filter={`url(#${filterId})`}
      />
    </svg>
  )
}
