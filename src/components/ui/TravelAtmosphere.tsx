type TravelAtmosphereProps = {
  variant?: 'explore' | 'planning' | 'ready'
}

export function TravelAtmosphere({ variant = 'explore' }: TravelAtmosphereProps) {
  return (
    <div className={`travel-atmosphere travel-atmosphere--${variant}`} aria-hidden="true">
      <span className="travel-window">
        <i className="travel-window__sky" />
        <i className="travel-window__cloud travel-window__cloud--one" />
        <i className="travel-window__cloud travel-window__cloud--two" />
        <i className="travel-window__shine" />
      </span>
      <span className="travel-route"><i>✈</i></span>
    </div>
  )
}
