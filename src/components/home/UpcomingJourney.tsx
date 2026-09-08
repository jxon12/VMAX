import { Icon } from '../ui/Icon'
import type { Trip } from '../../types/trips'
import { dateRange } from '../../domain/trips'
export function UpcomingJourney({trip,onOpen,onAll}:{trip?:Trip;onOpen:()=>void;onAll:()=>void}){
  return <section className="journey-section" aria-labelledby="journey-heading"><div className="section-heading journey-heading-row"><h2 id="journey-heading">Upcoming journey</h2><button className="j-text-button" onClick={onAll}>All trips</button></div>{trip?<button className="journey-card" onClick={onOpen}><img src={trip.destination==='tokyo'?'/images/tokyo-night.png':trip.image} alt=""/><span className="journey-shade"/><span className="journey-copy"><strong>{trip.city}</strong><small>{dateRange(trip)}</small><span className="journey-meta"><span>{trip.days.length} days</span><span><Icon name="users" size={14}/> {trip.travellers}</span></span></span><span className="journey-arrow"><Icon name="arrow" size={18}/></span></button>:<button className="j-primary" onClick={onAll}>Plan your first journey</button>}</section>
}
