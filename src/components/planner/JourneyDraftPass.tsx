type JourneyDraftPassProps = {
  city: string
  image: string
  dates: string
  travellers: number
  mobility: string
  dietary: string
  pace: string
  budget: number
  progress: number
  personalized: { mobility: boolean; dietary: boolean; pace: boolean; budget: boolean }
}

export function JourneyDraftPass({ city, image, dates, travellers, mobility, dietary, pace, budget, progress, personalized }: JourneyDraftPassProps) {
  return (
    <section className="journey-draft-pass" aria-label={`${city} journey pass draft`}>
      <img src={image} alt="" />
      <span className="journey-draft-pass__wash" />
      <div className="journey-draft-pass__top"><span>V-MAX JOURNEY PASS</span><em>{progress >= 8 ? 'YOUR DRAFT' : 'CHOOSE VALID DATES'}</em></div>
      <div className="journey-draft-pass__destination"><small>DESTINATION</small><h2>{city.split(',')[0]}</h2><p>{dates} · {travellers} travellers</p></div>
      <div className="journey-draft-pass__checks">
        <span className={personalized.mobility ? 'stamped' : ''}><small>MOBILITY</small><strong>{mobility}</strong></span>
        <span className={personalized.dietary ? 'stamped' : ''}><small>DIETARY</small><strong>{dietary}</strong></span>
        <span className={personalized.pace ? 'stamped' : ''}><small>PACE</small><strong>{pace}</strong></span>
        <span className={personalized.budget ? 'stamped' : ''}><small>BUDGET</small><strong>MYR {budget.toLocaleString()}</strong></span>
      </div>
      <i className="journey-draft-pass__barcode" />
    </section>
  )
}
