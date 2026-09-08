import type { Activity } from '../../data/discoveryData'
import { Icon } from '../ui/Icon'

type SeasonPassCardProps = {
  activity: Activity
  saved: boolean
  onOpen: () => void
  onToggleSaved: () => void
}

const passTheme = (id: string) => {
  if (id.includes('iceland')) return 'aurora'
  if (id.includes('banff')) return 'gold'
  if (id.includes('shanghai')) return 'magic'
  if (id.includes('kyoto') || id.includes('arashiyama') || id.includes('gion')) return 'maple'
  if (id.includes('marrakech')) return 'terracotta'
  return 'ocean'
}

export function SeasonPassCard({ activity, saved, onOpen, onToggleSaved }: SeasonPassCardProps) {
  return (
    <article className={`season-pass-card season-pass-card--${passTheme(activity.id)}`}>
      <button className="season-pass-main" onClick={onOpen}>
        <img src={activity.image} alt="" />
        <span className="season-pass-gradient" />
        <span className="season-pass-vertical">V-MAX · SEASONAL PASS</span>
        <span className="season-pass-destination"><small>DESTINATION</small><strong>{activity.country}</strong><em>{activity.location}</em></span>
        <span className="season-pass-plane">✈</span>
        <span className="season-pass-details"><small>BEST WINDOW</small><strong>{activity.date}</strong><em>{activity.family}</em></span>
        <span className="season-pass-barcode" />
      </button>
      <button className={`season-pass-save ${saved ? 'saved' : ''}`} aria-label={saved ? `Remove ${activity.title} from saved` : `Save ${activity.title}`} onClick={onToggleSaved}><Icon name="bookmark" size={16} /></button>
    </article>
  )
}
