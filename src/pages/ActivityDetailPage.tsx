import { useState, type CSSProperties } from 'react'
import { PageScaffold } from '../components/layout/PageScaffold'
import { ActivityDetailHero } from '../components/discovery/ActivityDetailHero'
import { ActivityDetailOverview } from '../components/discovery/ActivityDetailOverview'
import { AddToTripSheet } from '../components/sheets/AddToTripSheet'
import { Icon } from '../components/ui/Icon'
import type { Activity } from '../data/discoveryData'
import type { Trip, TripAddition } from '../types/trips'
import '../styles/pages.css'
import '../styles/journey-workspace.css'
import '../styles/discovery-lens.css'

type Props = { activity: Activity; trip?: Trip; saved: boolean; onBack: () => void; onToggleSaved: () => void; onAddToTrip: (addition: TripAddition) => void; onRemoveFromTrip: () => void; onPlanTrip: () => void }

export function ActivityDetailPage({ activity, trip, saved, onBack, onToggleSaved, onAddToTrip, onRemoveFromTrip, onPlanTrip }: Props) {
  const [open, setOpen] = useState(false)
  const addedDay = trip?.days.find(day => day.stops.some(stop => stop.activityId === activity.id))
  const added = addedDay?.stops.find(stop => stop.activityId === activity.id)

  return <PageScaffold className="detail-lens-shell" label={activity.title} notice="" activeNav="discover" onNavigate={onBack} onAssistantPlan={onPlanTrip}>
    <article className="detail-page">
      <ActivityDetailHero activity={activity} saved={saved} onBack={onBack} onToggleSaved={onToggleSaved} />
      <div className="activity-detail-sheet" style={{ '--activity-detail-image': `url("${activity.image}")` } as CSSProperties}>
        <ActivityDetailOverview activity={activity}>
          <div className="activity-detail-actions">
            <button className="activity-detail-primary" onClick={trip ? () => setOpen(true) : onPlanTrip}>
              {trip ? (addedDay ? `Edit · Day ${addedDay.number}` : 'Add to this trip') : 'Plan a trip here'}<Icon name="arrow" />
            </button>
          </div>
        </ActivityDetailOverview>
        {trip && <p className="fine-print">Your group requests: {[...trip.mobility, ...trip.dietary].join(' · ') || 'No specific requests'}. Check each venue before travel.</p>}
      </div>
    </article>
    {trip && open && <AddToTripSheet activity={activity} trip={trip} addedTrip={addedDay && added ? { day: addedDay.number, time: added.time, duration: added.duration, destination: trip.destination } : undefined} onDismiss={() => setOpen(false)} onAdd={onAddToTrip} onRemove={onRemoveFromTrip} />}
  </PageScaffold>
}
