import type { Activity } from '../../data/discoveryData'
import { Icon } from '../ui/Icon'
import { seasonalLabel } from '../../domain/trips'

type ActivityCardProps = {
  activity: Activity
  saved: boolean
  onOpen: () => void
  onToggleSaved: () => void
  layout?: 'portrait' | 'landscape' | 'ticket'
}

export function ActivityCard({ activity, saved, onOpen, onToggleSaved, layout = 'landscape' }: ActivityCardProps) {
  return (
    <article className={`activity-card activity-card--${layout}`}>
      <button className="activity-card-main" onClick={onOpen} aria-label={`View ${activity.title}`}>
        <img src={activity.image} alt="" />
        <span className="activity-card-shade" />
        <span className="activity-card-season">{seasonalLabel(activity)}</span>
        <span className="activity-card-copy">
          <strong>{activity.title}</strong>
          <span><Icon name="pin" size={13} /> {activity.location}, {activity.country}</span>
          <em>{activity.summary}</em>
        </span>
        {layout === 'ticket' && <span className="activity-ticket-window"><span><small>Best window</small><strong>{activity.date}</strong></span><Icon name="arrow" size={18} /></span>}
        {layout === 'landscape' && <span className="activity-distance">{activity.distance}</span>}
      </button>
      <button
        className={`card-save ${saved ? 'saved' : ''}`}
        aria-label={saved ? `Remove ${activity.title} from saved` : `Save ${activity.title}`}
        aria-pressed={saved}
        onClick={onToggleSaved}
      >
        <Icon name="bookmark" size={18} />
      </button>
    </article>
  )
}
