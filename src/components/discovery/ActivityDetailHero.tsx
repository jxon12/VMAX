import type { Activity } from '../../data/discoveryData'
import { Icon } from '../ui/Icon'
import { seasonalLabel } from '../../domain/trips'

type ActivityDetailHeroProps = {
  activity: Activity
  saved: boolean
  onBack: () => void
  onToggleSaved: () => void
}

export function ActivityDetailHero({ activity, saved, onBack, onToggleSaved }: ActivityDetailHeroProps) {
  return (
    <header className="activity-detail-hero">
      <img src={activity.image} alt={`${activity.title} in ${activity.location}`} />
      <span className="activity-detail-hero__light" />
      <span className="activity-detail-hero__shade" />

      <button className="activity-detail-glass-button activity-detail-back" aria-label="Back" onClick={onBack}><Icon name="arrow" size={19} /></button>
      <button className={`activity-detail-glass-button activity-detail-save ${saved ? 'saved' : ''}`} aria-label={saved ? 'Remove from saved' : 'Save activity'} aria-pressed={saved} onClick={onToggleSaved}><Icon name="bookmark" size={18} /></button>

      <div className="activity-detail-hero__copy">
        <small>{seasonalLabel(activity)}</small>
        <h1>{activity.title}</h1>
        <p><Icon name="pin" size={14} /> {activity.location}, {activity.country}</p>
      </div>
    </header>
  )
}
