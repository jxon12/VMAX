import { Icon } from '../ui/Icon'

type JourneyReadyCardsProps = {
  arrivalCode: string
  onOpenDocuments: () => void
  onOpenChecklist: () => void
}

export function JourneyReadyCards({ arrivalCode, onOpenDocuments, onOpenChecklist }: JourneyReadyCardsProps) {
  return (
    <section className="journey-ready" aria-labelledby="journey-ready-title">
      <div className="journey-ready__heading">
        <div><small>TRAVEL READY</small><h2 id="journey-ready-title">Before you go</h2></div>
        <span>2 things to check</span>
      </div>

      <div className="journey-ready__grid">
        <button className="journey-ready-card journey-ready-card--pass" onClick={onOpenDocuments}>
          <span className="journey-ready-card__icon"><Icon name="document" size={16} /></span>
          <small>DOCUMENTS</small>
          <strong>Boarding pass</strong>
          <span className="journey-ready-card__route"><b>KUL</b><i>→</i><b>{arrivalCode}</b></span>
          <em>Ready to view</em>
          <span className="journey-ready-card__barcode" />
        </button>

        <button className="journey-ready-card journey-ready-card--checklist" onClick={onOpenChecklist}>
          <span className="journey-ready-card__icon"><Icon name="check" size={17} /></span>
          <small>TRIP CHECKLIST</small>
          <strong>7 of 9 ready</strong>
          <span className="journey-ready-card__items">Passport · bags · eSIM</span>
          <span className="journey-ready-card__progress"><i /></span>
          <em>2 things left</em>
        </button>
      </div>
    </section>
  )
}
