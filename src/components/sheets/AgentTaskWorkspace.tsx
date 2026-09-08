import { useEffect, useRef, useState } from 'react'
import type { Trip } from '../../types/trips'
import { agentFor, approvalState } from '../../domain/agents'
import { dateRange, money } from '../../domain/trips'
import { FLIGHT_SHORTLIST_ID, sampleFlightOptions, saveSampleFlight, type AssistantAction } from '../../domain/assistant'
import { Icon } from '../ui/Icon'

type Props = { task: 'flights' | 'coordinate'; trip?: Trip; departureAirport?: string; onBack: () => void; onOpen: (action: AssistantAction) => void; onUpdate?: (update: (trip: Trip) => Trip) => void; onNewTrip: () => void }

export function AgentTaskWorkspace({ task, trip, departureAirport, onBack, onOpen, onUpdate, onNewTrip }: Props) {
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => { heading.current?.focus() }, [])
  const [origin, setOrigin] = useState(departureAirport ?? '')
  const [bag, setBag] = useState(true)
  const [direct, setDirect] = useState(true)
  const [selected, setSelected] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const flights = trip ? sampleFlightOptions(trip, origin, bag, direct) : []
  const flight = flights.find(f => f.id === selected)
  const reunion = trip?.proposals?.find(p => p.kind === 'reunion')
  const approval = trip && reunion ? approvalState(trip, reunion) : undefined
  const changeOptions = (update: () => void) => { update(); setSelected(''); setConfirmed(false) }
  return <section className="agent-tool-workspace" aria-label={task === 'flights' ? 'Flight comparison workspace' : 'Agent coordination workspace'}>
    <button className="agent-workspace-back" onClick={onBack}><span className="home-back-arrow"><Icon name="arrow" size={16}/></span> All V-MAX tools</button>
    <p className="agent-tool-eyebrow">{task === 'flights' ? 'FIND → COMPARE → KEEP' : 'CHECK → COORDINATE → CONFIRM'}</p>
    <h2 ref={heading} tabIndex={-1}>{task === 'flights' ? 'The whole fare.\nNot just the headline.' : 'Their afternoon.\nOur evening.'}</h2>
    {!trip ? <><p>Choose a journey first, so I use the right dates, destination and travellers.</p><button className="agent-tool-primary" onClick={onNewTrip}>Plan an escape <Icon name="arrow" size={17}/></button></> : <>
      <div className="agent-tool-context"><Icon name={task === 'flights' ? 'plane' : 'users'} size={20}/><span><strong>{trip.city} · {trip.travellers} travellers</strong><small>{dateRange(trip)} · your saved journey</small></span></div>
      {task === 'flights' ? <>
        <p className="agent-tool-disclosure">Comparison demo · fictional fares, not a live search or a booking. The dates and group size come from your journey.</p>
        {trip.destination !== 'tokyo' ? <div className="agent-tool-empty"><strong>This demo covers Kuala Lumpur → Tokyo.</strong><p>I won’t apply Tokyo fares to {trip.city}. Live route search is a planned integration.</p><button onClick={() => onOpen('plan')}>View this journey instead <Icon name="arrow" size={16}/></button></div> : <>
          {origin !== 'KUL' ? <div className="agent-tool-empty"><strong>{origin ? `Your departure is ${origin}.` : 'Where are you flying from?'}</strong><p>The sample route starts at KUL. Use it for this comparison only; your Profile will not change.</p><button onClick={() => changeOptions(() => setOrigin('KUL'))}>Use KUL for this demo <Icon name="arrow" size={16}/></button></div> : <>
            <div className="agent-flight-route"><strong>KUL</strong><span><Icon name="plane" size={20}/><small>ROUND TRIP</small></span><strong>Tokyo<small>HND / NRT</small></strong></div>
            <div className="agent-flight-filters"><label><input type="checkbox" checked={direct} onChange={e => changeOptions(() => setDirect(e.target.checked))}/> Direct only</label><label><input type="checkbox" checked={bag} onChange={e => changeOptions(() => setBag(e.target.checked))}/> Checked bag</label></div>
            <p className="agent-price-legend">MYR · round-trip example taxes included · sorted by total</p>
            <div className="agent-flight-options">{flights.map((f, i) => <button key={f.id} aria-pressed={selected === f.id} onClick={() => { setSelected(f.id); setConfirmed(false) }} className={selected === f.id ? 'selected' : ''}>
              <span className="agent-flight-label"><strong>{f.label}</strong>{i === 0 && <small>LOWEST TOTAL</small>}</span>
              <span className="agent-flight-meta">{f.duration} each way · {f.airport} · sample itinerary</span>
              <span className="agent-flight-price"><strong>{money(f.perPerson)}<small>/ person</small></strong><span>{money(f.total)}<small>for your group</small></span></span>
              <span className="agent-flight-note">{f.note}</span>
            </button>)}</div>
            {flight && <div className="agent-flight-review" aria-live="polite"><strong>{confirmed ? 'Kept in your Trip wallet.' : 'Keep this option, not a booking.'}</strong><p>{confirmed ? 'Saved as an unbooked comparison note. Your existing tickets, itinerary and expenses are unchanged.' : `${money(flight.total)} for ${trip.travellers} travellers. I’ll save the comparison as a note. This will not book a flight or add an expense.`}</p>{!confirmed ? <button className="agent-tool-primary" disabled={!onUpdate} onClick={() => { onUpdate?.(t => saveSampleFlight(t, flight.id, origin, bag, direct)); setConfirmed(true) }}>Confirm & keep shortlist <Icon name="check" size={17}/></button> : <button className="agent-tool-primary" onClick={() => onOpen('documents')}>Open Trip wallet <Icon name="arrow" size={17}/></button>}</div>}
            {!flight && trip.documents.some(d => d.id === FLIGHT_SHORTLIST_ID) && <button className="agent-tool-link" onClick={() => onOpen('documents')}>Open your saved comparison <Icon name="arrow" size={16}/></button>}
          </>}
          <details className="agent-source-details"><summary>Where real fares will come from</summary><p>These sample prices are not supplied by an airline. Open an official website to search current fares, baggage rules and availability yourself. No trip or personal details are sent by these links.</p><a href="https://www.ana.co.jp/en/my/" target="_blank" rel="noreferrer">ANA official website ↗</a><a href="https://www.malaysiaairlines.com/my/en/home.html" target="_blank" rel="noreferrer">Malaysia Airlines official website ↗</a><p>Production flow: live search → recheck the selected fare → your explicit booking confirmation. Not connected in this prototype.</p></details>
        </>}
      </> : <>
        <p className="agent-tool-disclosure">Local Agent demo · no one is being contacted. Each reply below uses only that member’s shared fields.</p>
        <div className="agent-coordination-people">{trip.members.map(member => {
          const shared = agentFor(trip, member.id)
          return <article key={member.id}><span className="agent-member-symbol" style={{ background: member.color }}>{member.name[0]}<i/></span><div><strong>{member.id === 'you' ? 'Your Agent' : `${member.name}’s Agent`}</strong><p>{shared.shareAvailability && shared.availableFrom ? `Free from ${shared.availableFrom}` : 'Availability not shared'} · {shared.shareArea && shared.area ? shared.area : 'Area not shared'}</p><small>{shared.autoApproveReunion && shared.shareAvailability && shared.shareArea && shared.shareBudget ? 'Can approve within shared limits' : 'Member confirmation required'}</small></div></article>
        })}</div>
        <div className="agent-coordination-outcome"><span><Icon name="users" size={18}/> SPLIT & SYNC</span><h3>{reunion ? reunion.status === 'accepted' ? 'Your shared evening is in Plan.' : `Reunite at ${reunion.time}?` : 'Keep each person in control.'}</h3><p>{reunion ? 'I compare the shared time, area and meal budget, then prepare one group decision. Private calendars stay private.' : 'Use @ in your group to ask a member’s Agent. Automatic reunion proposals are limited to the Tokyo demo.'}</p>{approval && approval.reasons.length > 0 && <p className="agent-tool-warning">{approval.reasons.length} constraint{approval.reasons.length > 1 ? 's' : ''} need attention. Review before changing the plan.</p>}<button className="agent-tool-primary" onClick={() => onOpen(reunion ? 'reunion' : 'group')}>{reunion ? 'Review the shared decision' : 'Open group & @ an Agent'} <Icon name="arrow" size={17}/></button></div>
        <button className="agent-tool-link" onClick={() => onOpen('group')}>Continue in the group chat <Icon name="arrow" size={16}/></button>
        <p className="agent-tool-footnote">Only required approvals update the shared Plan and Route. An Agent cannot reveal an unshared meeting location or make a payment.</p>
      </>}
    </>}
  </section>
}
