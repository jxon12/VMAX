import type { Activity } from '../../data/discoveryData'
import { Icon } from '../ui/Icon'
import { Orb } from '../ui/Orb'
import { activityCost, money } from '../../domain/trips'
import type { ReactNode } from 'react'

export function ActivityDetailOverview({ activity, children }: { activity: Activity; children?: ReactNode }) {
  return (
    <div className="activity-detail-overview">
      <section className="activity-detail-facts" aria-label="Activity essentials">
        <div><Icon name="calendar" size={15} /><small>Best window</small><strong>{activity.date}</strong></div>
        <div><Icon name="sun" size={15} /><small>Typical · sample</small><strong>{activity.weather}</strong></div>
        <div><Icon name="wallet" size={15} /><small>Demo budget / pp</small><strong>{activityCost(activity) ? money(activityCost(activity)) : 'Free entry estimate'}</strong></div>
      </section>

      {children}

      <section className="activity-why-now">
        <h2>A moment worth going for.</h2>
        <p>{activity.whyNow}</p>
        <div className="activity-visit-notes">
          <span><Icon name="clock" size={17} /><i><small>Best time</small><strong>{activity.time}</strong></i></span>
          <span><Icon name="compass" size={17} /><i><small>From the city</small><strong>{activity.distance}</strong></i></span>
        </div>
      </section>

      <section className="activity-dna-card" aria-labelledby="activity-dna-title">
        <div className="activity-dna-card__heading">
          <span><Orb size="nav" className="activity-dna-orb" /></span>
          <div><small>FROM V-MAX</small><h2 id="activity-dna-title">A little peace of mind.</h2></div>
        </div>
        <div className="activity-dna-list">
          <div><span><Icon name="wheelchair" size={17} /></span><p><strong>{activity.accessibility}</strong><small>{activity.mobilityTags.slice(0, 2).join(' · ') || 'Route options checked'}</small></p></div>
          <div><span><Icon name="leaf" size={17} /></span><p><strong>{activity.dietary}</strong><small>{activity.dietaryTags.slice(0, 2).join(' · ') || 'Food notes checked'}</small></p></div>
          <div><span><Icon name="users" size={17} /></span><p><strong>{activity.family}</strong><small>{activity.audiences.join(' · ')}</small></p></div>
        </div>
      </section>

      <p className="fine-print activity-detail-demo-note">Prototype travel notes and sample costs—not verified accessibility, allergen safety, weather or ticket availability.</p>
    </div>
  )
}
