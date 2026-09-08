import { useState } from 'react'
import type { Activity } from '../../data/discoveryData'
import type { Trip, TripAddition } from '../../types/trips'
import { activityDuration, activityFitsTrip, activityTime, dateAt, dayIssues, formatDate, minutes, stopFromActivity } from '../../domain/trips'
import { BottomSheet } from '../ui/BottomSheet'
import { Icon } from '../ui/Icon'
type Props={activity:Activity;trip:Trip;addedTrip?:TripAddition;onDismiss:()=>void;onAdd:(addition:TripAddition)=>void;onRemove:()=>void}
export function AddToTripSheet({activity,trip,addedTrip,onDismiss,onAdd,onRemove}:Props){
  const [day,setDay]=useState(addedTrip?.day??trip.activeDay)
  const [time,setTime]=useState(addedTrip?.time??activityTime(activity));const [duration,setDuration]=useState(addedTrip?.duration??activityDuration(activity));const [ack,setAck]=useState(false)
  const stops=[...trip.days[day-1].stops.filter(s=>s.activityId!==activity.id),{...stopFromActivity(activity,time),duration}].sort((a,b)=>minutes(a.time)-minutes(b.time))
  const issues=dayIssues(stops,trip,day)
  const compatible=activityFitsTrip(activity,trip)
  const valid=compatible&&time&&duration>=10&&duration<=720&&minutes(time)+duration<=1440&&(!issues.length||ack)
  return <BottomSheet label="Schedule this activity" className="j-sheet" onDismiss={onDismiss}><header><h2>{addedTrip?'Edit your visit.':'A place in your journey.'}</h2><button aria-label="Close schedule" onClick={onDismiss}><Icon name="close"/></button></header><p className="j-muted">{activity.title} · {trip.city}</p>
    {!compatible?<p className="j-warning">This activity is in a different destination. Save it or start a separate trip instead.</p>:<form onSubmit={e=>{e.preventDefault();if(valid){onAdd({day,time,duration,destination:trip.destination});onDismiss()}}}><label className="field-label">Which day?<select value={day} onChange={e=>{setDay(Number(e.target.value));setAck(false)}}>{trip.days.map(d=><option key={d.number} value={d.number}>Day {d.number} · {formatDate(dateAt(trip.startDate,d.number-1))}</option>)}</select></label><div className="setup-date-grid"><label className="field-label">Start time<input type="time" required value={time} onInput={e=>{setTime(e.currentTarget.value);setAck(false)}} onChange={e=>{setTime(e.target.value);setAck(false)}}/></label><label className="field-label">Duration · min<input type="number" min="10" max="720" step="5" required value={duration||''} onChange={e=>{setDuration(Number(e.target.value));setAck(false)}}/></label></div>
      {issues.length>0&&<div className="j-warning"><strong>Review before adding</strong><ul>{issues.map(issue=><li key={issue}>{issue}</li>)}</ul><label className="j-check-row"><input type="checkbox" checked={ack} onChange={e=>setAck(e.target.checked)}/>Keep this as a draft; I’ll review these notes.</label></div>}
      <p className="fine-print">Only this {trip.city} trip changes. Travel times are sample estimates. Access, dietary needs and opening hours are not verified bookings.</p><button className="j-primary" disabled={!valid}>{addedTrip?'Update visit':'Add to Day '+day}<Icon name="check"/></button>
    </form>}
    {addedTrip&&<button className="j-text-danger" onClick={()=>{onRemove();onDismiss()}}>Remove from this trip</button>}
  </BottomSheet>
}
