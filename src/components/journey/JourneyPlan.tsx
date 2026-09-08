import { useState } from 'react'
import type { Stop, Trip } from '../../types/trips'
import { dateAt, dayIssues, makeStop, minutes, money, reorderDay, routeLeg, timeOf } from '../../domain/trips'
import { BottomSheet } from '../ui/BottomSheet'
import { Icon } from '../ui/Icon'
import { Orb } from '../ui/Orb'
import { agentFor, approvalState } from '../../domain/agents'
import { JourneyProposalCard } from './JourneyProposalCard'
import '../../styles/agent-experience.css'
import '../../styles/journey-plan-glass.css'

type Props = { trip: Trip; onUpdate: (update: (trip: Trip) => Trip) => void; onAdd: () => void; onSoften: () => void }
const durationLabel = (duration: number) => `${Math.floor(duration / 60) ? `${Math.floor(duration / 60)}h` : ''}${duration % 60 ? `${duration >= 60 ? ' ' : ''}${duration % 60}m` : ''}` || '0m'
const kindLabels: Record<Stop['kind'], string> = { activity: 'Explore', meal: 'Eat & enjoy', rest: 'Take a moment', arrival: 'Arrive' }

export function JourneyPlan({ trip, onUpdate, onAdd, onSoften }: Props) {
  const day = trip.days[trip.activeDay - 1]
  const [editing, setEditing] = useState<Stop | null>(null)
  const [dragged, setDragged] = useState<number | null>(null)
  const [reordering, setReordering] = useState(false)
  const [orderNotice, setOrderNotice] = useState('')
  const [reviewId, setReviewId] = useState<string | null>(null)
  const review = trip.proposals?.find(proposal => proposal.id === reviewId)
  const proposals = trip.proposals?.filter(proposal => {
    const currentDay = trip.days.find(candidate => candidate.stops.some(stop => stop.proposalId === proposal.id))
    return (currentDay?.number ?? proposal.day) === day.number || (proposal.kind === 'museum' && day.number === 1 && proposal.status !== 'accepted')
  }) ?? []
  const issues = dayIssues(day.stops, trip, day.number)
  const hasReunion = proposals.some(proposal => proposal.kind === 'reunion')
  const hasSplitPlans = day.stops.some(stop => stop.participantIds && stop.participantIds.length > 0 && stop.participantIds.length < trip.members.length)
  const plannedMinutes = day.stops.reduce((total, stop) => total + stop.duration, 0)
  const completed = day.stops.filter(stop => stop.done).length
  const weekday = new Date(`${dateAt(trip.startDate, day.number - 1)}T00:00:00Z`).toLocaleDateString('en-GB', { weekday: 'long', timeZone: 'UTC' })
  const move = (from: number, to: number) => {
    if (from !== to && reorderDay(trip, day.number, from, to) === trip) {
      setOrderNotice('There isn’t enough room before midnight. Shorten a stop before moving it.')
      return
    }
    setOrderNotice('')
    onUpdate(current => reorderDay(current, day.number, from, to))
  }
  const save = () => {
    if (!editing) return
    onUpdate(current => ({ ...current, days: current.days.map(candidate => candidate.number === day.number ? { ...candidate, stops: [...candidate.stops.filter(stop => stop.id !== editing.id), { ...editing, title: editing.title.trim() }].sort((a, b) => minutes(a.time) - minutes(b.time)) } : candidate) }))
    setEditing(null)
  }
  const markDone = (stop: Stop) => onUpdate(current => ({ ...current, days: current.days.map(candidate => candidate.number === day.number ? { ...candidate, stops: candidate.stops.map(item => item.id === stop.id ? { ...item, done: !item.done } : item) } : candidate) }))

  return <section className="j-panel jg-plan" aria-label={`Day ${day.number} itinerary`}>
    <header className="jg-plan-heading">
      <div><h2>{weekday}</h2><p>{day.stops.length} stop{day.stops.length === 1 ? '' : 's'}<span>·</span>{durationLabel(plannedMinutes)} planned{completed > 0 && <><span>·</span>{completed} done</>}</p></div>
      <button className="jg-plan-assist" onClick={onSoften} aria-label="Review a gentler day"><Icon name="sparkles" size={17}/><span>A little lighter</span></button>
    </header>

    {proposals.length > 0 && <div className="jg-plan-decisions" aria-label="Suggestions for this day">{proposals.map(proposal => {
      const edited = proposal.status === 'accepted' && approvalState(trip, proposal).reasons.length > 0
      const title = proposal.status === 'accepted' ? edited ? 'Your plan has changed' : proposal.kind === 'reunion' ? 'Dinner, together' : 'Museum visit rescheduled' : proposal.status === 'declined' ? 'Your original plan stays' : proposal.kind === 'reunion' ? 'A plan to meet for dinner' : 'A better day for the museum'
      const subtitle = proposal.status === 'accepted' ? edited ? 'Review the changes since approval' : `${proposal.time} · ${proposal.participantIds.length} travellers confirmed` : proposal.status === 'declined' ? 'View or reconsider the suggestion' : 'V-MAX has a suggestion to review'
      return <button key={proposal.id} className={`jg-plan-decision ${proposal.status === 'pending' ? 'needs-review' : ''}`} onClick={() => setReviewId(proposal.id)} aria-haspopup="dialog"><span className="jg-plan-orb"><Orb/></span><span><strong>{title}</strong><small>{subtitle}</small></span><Icon name={proposal.status === 'accepted' && !edited ? 'check' : 'arrow'} size={18}/></button>
    })}</div>}

    {trip.members.length > 0 && (hasReunion || hasSplitPlans) && <details className="jg-plan-people">
      <summary><span className="jg-plan-avatar-stack" aria-hidden="true">{trip.members.slice(0, 4).map(member => <i key={member.id} style={{ background: member.color }}>{member.name[0]}</i>)}</span><span>{trip.members.length === 1 ? 'Your Agent' : 'Together & apart'}<small>{trip.members.length} traveller{trip.members.length === 1 ? '' : 's'} · {hasReunion ? 'shared availability' : 'separate plans'}</small></span><Icon name="chevron" size={16}/></summary>
      <div className="jg-plan-availability">{trip.members.map(member => {
        const preferences = agentFor(trip, member.id)
        return <div key={member.id}><i style={{ background: member.color }}>{member.name[0]}</i><span><strong>{member.name}</strong><small>{preferences.shareArea ? preferences.area || 'Area not set' : 'Area private'} · {preferences.shareAvailability ? hasReunion ? `Free from ${preferences.availableFrom || 'not set'}` : 'Availability shared' : 'Availability private'}</small></span></div>
      })}<p>Each Agent only shares what its traveller allows.</p></div>
    </details>}

    <div className="jg-plan-timeline-heading"><h3>Your itinerary</h3>{day.stops.length > 1 && <button aria-pressed={reordering} onClick={() => { setReordering(!reordering); setDragged(null) }}>{reordering ? <><Icon name="check" size={15}/>Done</> : <><Icon name="filter" size={15}/>Reorder</>}</button>}</div>
    {reordering && <p className="jg-plan-reorder-help">Use the arrows or drag a stop. Travel time adjusts with it.</p>}
    {orderNotice && <p className="j-warning" role="status">{orderNotice}</p>}
    {issues.length > 0 && <details className="jg-plan-notes"><summary><Icon name="clock" size={16}/>{issues.length} timing note{issues.length === 1 ? '' : 's'}<Icon name="chevron" size={15}/></summary><ul>{issues.map(issue => <li key={issue}>{issue}</li>)}</ul></details>}
    {day.stops.length === 0 && <div className="jg-plan-empty"><Icon name="sun" size={30}/><h3>A little room for possibility.</h3><p>Add a place, a meal or time to simply wander.</p></div>}

    <ol className="jg-plan-timeline">{day.stops.map((stop, index) => {
      const next = day.stops[index + 1]
      const connection = next ? routeLeg(stop, next, trip) : null
      const proposal = trip.proposals?.find(candidate => candidate.id === stop.proposalId)
      const edited = proposal ? approvalState(trip, proposal).reasons.length > 0 : false
      return <li key={stop.id} className={dragged === index ? 'is-dragging' : ''} draggable={reordering} onDragStart={event => { event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', stop.id); setDragged(index) }} onDragOver={event => { if (reordering) event.preventDefault() }} onDrop={event => { event.preventDefault(); if (reordering && dragged !== null) move(dragged, index); setDragged(null) }} onDragEnd={() => setDragged(null)}>
        <div className="jg-plan-time"><time>{stop.time}</time><button className={stop.done ? 'is-done' : ''} aria-label={`${stop.done ? 'Mark incomplete' : 'Mark complete'}: ${stop.title}`} aria-pressed={stop.done} onClick={() => markDone(stop)}><span>{stop.done ? <Icon name="check" size={13}/> : index + 1}</span></button></div>
        <div className={`jg-plan-stop ${stop.kind} ${stop.done ? 'is-done' : ''}`}>
          <button className="jg-plan-stop-main" onClick={() => setEditing({ ...stop })} aria-label={`Edit ${stop.title}`} aria-haspopup="dialog">
            {stop.image ? <img src={stop.image} alt=""/> : <span className="jg-plan-stop-icon"><Icon name={stop.kind === 'rest' ? 'sun' : stop.kind === 'meal' ? 'leaf' : stop.kind === 'arrival' ? 'plane' : 'pin'} size={21}/></span>}
            <span className="jg-plan-stop-copy"><small className="jg-plan-kind">{kindLabels[stop.kind]}</small><strong>{stop.title}</strong><small>{durationLabel(stop.duration)}{stop.cost > 0 ? ` · ${money(stop.cost)} pp` : stop.kind === 'rest' ? ' · No rush' : ''}</small>{stop.participantIds && <small className={`jg-plan-participants ${edited ? 'is-edited' : ''}`}><Icon name={stop.proposalId && !edited ? 'check' : 'users'} size={12}/>{stop.participantIds.length} traveller{stop.participantIds.length === 1 ? '' : 's'}{stop.proposalId ? edited ? ' · edited after approval' : ' · confirmed together' : ''}</small>}</span>
          </button>
          {reordering && <div className="jg-plan-order"><button disabled={index === 0} aria-label={`Move up: ${stop.title}`} onClick={() => move(index, index - 1)}><Icon name="chevron" size={18}/></button><span>Move stop</span><button disabled={index === day.stops.length - 1} aria-label={`Move down: ${stop.title}`} onClick={() => move(index, index + 1)}><Icon name="chevron" size={18}/></button></div>}
        </div>
        {connection && <p className="jg-plan-connection"><span/>{connection.duration} min est. · {connection.mode}</p>}
      </li>
    })}</ol>
    <div className="jg-plan-add"><button className="jg-plan-add-primary" onClick={onAdd}><Icon name="compass" size={18}/>Find an activity</button><button onClick={() => setEditing(makeStop('', '10:00', 'rest', 30))}><span aria-hidden="true">＋</span>Custom stop</button></div>
    <p className="jg-plan-footnote">A flexible draft. Costs and travel times are estimates.</p>

    {review && <BottomSheet label="Review itinerary suggestion" className="j-sheet jg-plan-sheet" onDismiss={() => setReviewId(null)}><header><h2>One small decision.</h2><button aria-label="Close itinerary suggestion" onClick={() => setReviewId(null)}><Icon name="close"/></button></header><JourneyProposalCard trip={trip} proposal={review} onUpdate={onUpdate} onPlan={number => { onUpdate(current => ({ ...current, activeDay: number })); setReviewId(null) }}/></BottomSheet>}
    {editing && <BottomSheet label="Edit itinerary stop" className="j-sheet jg-plan-sheet" onDismiss={() => setEditing(null)}><header><h2>{day.stops.some(stop => stop.id === editing.id) ? 'Edit this stop' : 'A new moment'}</h2><button aria-label="Close stop editor" onClick={() => setEditing(null)}><Icon name="close"/></button></header><form onSubmit={event => { event.preventDefault(); save() }}><label className="field-label">Name<input required maxLength={100} value={editing.title} onChange={event => setEditing({ ...editing, title: event.target.value })}/></label><div className="setup-date-grid"><label className="field-label">Start time<input required type="time" value={editing.time} onInput={event => setEditing({ ...editing, time: event.currentTarget.value })} onChange={event => setEditing({ ...editing, time: event.target.value })}/></label><label className="field-label">Duration · minutes<input type="number" required min="10" max="720" step="5" value={editing.duration || ''} onChange={event => setEditing({ ...editing, duration: Number(event.target.value) })}/></label></div><label className="field-label">Type<select value={editing.kind} onChange={event => setEditing({ ...editing, kind: event.target.value as Stop['kind'] })}>{['activity', 'meal', 'rest', 'arrival'].map(kind => <option key={kind}>{kind}</option>)}</select></label><label className="field-label">Estimated cost · MYR per person<input type="number" min="0" max="100000" step="0.01" value={editing.cost} onChange={event => setEditing({ ...editing, cost: Number(event.target.value) })}/></label><p className="fine-print">Ends at {timeOf(minutes(editing.time) + editing.duration)}. Separate from paid expenses.</p>{minutes(editing.time) + editing.duration > 1440 && <p className="j-warning">This stop runs past midnight. Move it earlier or shorten the visit.</p>}<button className="j-primary" disabled={!editing.title.trim() || editing.duration < 10 || minutes(editing.time) + editing.duration > 1440}>Save stop</button></form>{day.stops.some(stop => stop.id === editing.id) && <button className="j-text-danger" onClick={() => { onUpdate(current => ({ ...current, days: current.days.map(candidate => candidate.number === day.number ? { ...candidate, stops: candidate.stops.filter(stop => stop.id !== editing.id) } : candidate) })); setEditing(null) }}>Remove from this day</button>}</BottomSheet>}
  </section>
}
