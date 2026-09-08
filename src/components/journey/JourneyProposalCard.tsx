import { useState } from 'react'
import type { JourneyProposal, Trip } from '../../types/trips'
import { agentFor, approvalState, ensureProposal, reviewProposal } from '../../domain/agents'
import { dateAt, formatDate, money } from '../../domain/trips'
import { Icon } from '../ui/Icon'
import { Orb } from '../ui/Orb'
import '../../styles/agent-experience.css'

type Props = { trip: Trip; proposal: JourneyProposal; onUpdate: (update: (trip: Trip) => Trip) => void; onPlan?: (day: number) => void; compact?: boolean }

export function JourneyProposalCard({ trip, proposal, onUpdate, onPlan, compact = false }: Props) {
  const [notice, setNotice] = useState('')
  const state = approvalState(trip, proposal)
  const accepted = proposal.status === 'accepted'
  const edited = accepted && state.reasons.length > 0
  const current = trip.days.flatMap(day=>day.stops.map(stop=>({day:day.number,stop}))).find(item=>item.stop.proposalId===proposal.id)
  const displayDay = edited && current ? current.day : proposal.day
  const displayTime = edited && current ? current.stop.time : proposal.time
  const declined = proposal.status === 'declined'
  const ownApproved = proposal.approvedBy.includes('you')
  const act = (decision: 'accept' | 'decline' | 'undo') => {
    onUpdate(t => reviewProposal(t, proposal.id, decision))
    setNotice(decision === 'accept' && state.waiting.length ? 'Your approval is saved. The plan stays unchanged until everyone agrees.' : '')
  }
  return <section className={`agent-proposal ${accepted ? 'is-accepted' : declined ? 'is-declined' : ''} ${compact ? 'is-compact' : ''}`} aria-label={`${proposal.kind === 'reunion' ? 'Reunion' : 'Museum'} proposal`}>
    <header className="agent-proposal-label"><span className="agent-mini-orb"><Orb /></span><span>{edited ? 'Changed after approval' : accepted ? 'Saved to your journey' : declined ? 'Original plan kept' : 'For your review'}</span><Icon name={accepted ? 'check' : 'sparkles'} size={17}/></header>
    <h3>{edited ? current?.stop.title ?? 'This stop was removed from Plan.' : proposal.kind === 'reunion' ? accepted ? 'Back together for dinner.' : 'Different afternoons. Dinner together?' : accepted ? 'Your museum visit is moved.' : 'Keep the museum. Change the day.'}</h3>
    <p className="agent-proposal-description">{proposal.kind === 'reunion' ? 'A shared evening, with room for everyone’s own plans.' : 'The original Monday visit conflicts with the reference opening information.'}</p>
    <div className="agent-proposal-destination"><Icon name={proposal.kind === 'museum' ? 'calendar' : 'pin'} size={21}/><span><strong>{proposal.location}</strong><small>{formatDate(dateAt(trip.startDate, displayDay - 1))} · {displayTime} · {proposal.participantIds.length} travellers</small></span><b>{money(proposal.estimatedCost)}<small>pp · estimate</small></b></div>
    {!accepted && !declined && proposal.kind === 'reunion' && <div className="agent-time-options" aria-label="Reunion time">{['18:30', '19:00', '19:30'].map(time => <button key={time} aria-pressed={time === proposal.time} onClick={() => { setNotice(''); onUpdate(t => ensureProposal(t, 'reunion', time)) }}>{time}</button>)}</div>}
    <details className="agent-proposal-evidence"><summary>{accepted ? 'Decision details' : 'Why this works · permissions & timing'}</summary>
      <ul>{proposal.reasons.map(reason => <li key={reason}>{reason}</li>)}</ul>
      <div className="agent-approval-list">{proposal.participantIds.map(id => {
        const member = trip.members.find(m => m.id === id)
        const prefs = agentFor(trip, id)
        const manual = proposal.approvedBy.includes(id)
        const delegated = proposal.kind === 'reunion' && prefs.autoApproveReunion && prefs.shareAvailability && prefs.shareArea && prefs.shareBudget && !state.reasons.length
        return <div key={id}><i className="j-avatar" style={{ background: member?.color }}>{member?.name[0] || '?'}</i><span><strong>{member?.name ?? 'Traveller'}</strong><small>{accepted ? 'Approved for this decision' : manual ? 'Confirmed by member' : delegated ? 'Agent authorised within shared limits' : 'Member confirmation needed'}</small>{proposal.kind === 'reunion' && <small>{prefs.shareAvailability ? `Free from ${prefs.availableFrom || 'not set'}` : 'Availability private'} · {prefs.shareArea ? prefs.area || 'Area not set' : 'Area private'}</small>}</span></div>
      })}</div>
      {proposal.source && <p className="agent-source"><a href={proposal.source.url} target="_blank" rel="noreferrer">{proposal.source.label} ↗</a><small>{proposal.source.checkedAt}</small></p>}
    </details>
    {!declined && state.reasons.length > 0 && <ul className="agent-blockers" role="status">{state.reasons.map(reason => <li key={reason}>{reason}</li>)}</ul>}
    <div className="agent-proposal-actions">
      {accepted ? <><p className="agent-outcome"><Icon name="check" size={16}/> {edited ? 'The current plan differs from the original approval.' : 'Plan, Route and group record updated.'}</p>{onPlan && <button className="agent-primary" onClick={() => onPlan(displayDay)}>See the updated plan <Icon name="arrow" size={17}/></button>}<button className="agent-quiet" disabled={state.reasons.length > 0} onClick={() => act('undo')}>Undo this change</button></> : declined ? <><p className="agent-outcome">Nothing was moved or booked.</p><button className="agent-quiet" onClick={() => onUpdate(t => ({ ...t, proposals: t.proposals?.map(p => p.id === proposal.id ? { ...p, status: 'pending', approvedBy: [] } : p) }))}>Reconsider this suggestion</button></> : <>
        <button className="agent-primary" disabled={state.reasons.length > 0 || ownApproved} onClick={() => act('accept')}>{ownApproved ? 'Your approval is saved' : state.waiting.length ? 'Confirm my part' : 'Confirm this plan'}<Icon name="check" size={17}/></button>
        {state.waiting.length > 0 && <p className="agent-waiting">Waiting for {state.waiting.map(id => trip.members.find(m => m.id === id)?.name).join(', ')}. Nothing changes yet.</p>}
        {trip.id === 'tokyo-demo' && state.waiting.length > 0 && !state.reasons.length && <button className="agent-demo-response" onClick={() => { onUpdate(t => state.waiting.reduce((updated, id) => reviewProposal(updated, proposal.id, 'accept', id), t)); setNotice('Sample member approvals played locally. No one was contacted.') }}>Preview member approvals <span>DEMO</span></button>}
        <button className="agent-quiet" onClick={() => act('decline')}>Keep the current plan</button>
      </>}
    </div>
    {notice && <p className="agent-waiting" role="status">{notice}</p>}
    <footer>Prototype coordination · no reservation or payment</footer>
  </section>
}
