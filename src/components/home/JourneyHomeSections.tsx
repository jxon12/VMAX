import { useState, type CSSProperties } from 'react'
import { Icon } from '../ui/Icon'
import { BottomSheet } from '../ui/BottomSheet'
import { SmartPreparation } from './SmartPreparation'
import { preparationFor } from '../../domain/preparation'
import { dateAt, formatDate } from '../../domain/trips'
import { journeyNow, nextJourneyStop, proposalFor, approvalState } from '../../domain/agents'
import { JourneyProposalCard } from '../journey/JourneyProposalCard'
import type { Trip } from '../../types/trips'

type Props = { trip: Trip; onJourney: (tab?: Trip['activeTab'], day?: number) => void; onUpdate: (update: (trip: Trip) => Trip) => void }

export function TripUpdates({ trip, onJourney, onUpdate }: Props) {
  const [review, setReview] = useState(false)
  const [arrivalGuide, setArrivalGuide] = useState(false)
  const proposal = proposalFor(trip, 'museum')
  const isDemo = !!proposal
  const resolved = proposal?.status === 'accepted'
  const edited = resolved && proposal && approvalState(trip,proposal).reasons.length>0
  const skipped = proposal?.status === 'declined'
  return <section className="story-section home-updates" aria-labelledby="trip-updates-title">
    <div className="section-heading"><h2 id="trip-updates-title">Trip updates</h2><span className="home-section-note">From V-MAX</span></div>
    <div className="home-update-rail">
      <button className="home-update-card home-notice-cover" onClick={() => isDemo ? setReview(true) : onJourney('plan')}>
        <img className="home-notice-bg" src={isDemo ? "/images/tokyo-museum-hours-notice.png" : trip.image} alt={isDemo ? "Tokyo National Museum visitor information reference" : trip.city}/>
        <span className="home-update-top"><span className="home-status-dot" />{edited ? 'Updated after approval' : resolved ? 'A change you confirmed' : skipped ? 'Your original plan kept' : isDemo ? 'Spotted before you go' : 'Your plan, at a glance'}<Icon name="arrow" size={17} /></span>
        <span className="home-update-caption lens-glass">
          <span className="home-update-main home-update-main-copy"><span><strong>{edited ? 'Your plan.\nA few changes.' : resolved ? 'One less thing.\nAlready sorted.' : skipped ? 'Your choice.\nYour journey.' : isDemo ? 'Closed Monday.\nWe caught it early.' : `Make room for\n${trip.city}.`}</strong><small>{edited ? 'Review the latest plan before travelling' : resolved ? `Moved to ${formatDate(dateAt(trip.startDate, proposal!.day - 1))} · ${proposal!.time}` : skipped ? 'Suggestion declined · review anytime' : isDemo ? 'Your original plan conflicts · alternative ready' : `${trip.days.length} days · see your shared itinerary`}</small></span></span>
          <span className="home-update-footer"><span>{resolved ? 'View change' : isDemo ? 'Review alternative' : 'See your plan'}</span>{isDemo && <small className="home-demo-tag">Demo scenario</small>}</span>
        </span>
      </button>
      {trip.destination === 'tokyo' && <button className="home-update-card home-update-group home-update-route" onClick={() => setArrivalGuide(true)}>
        <span className="home-arrival-cover"><img src="/images/haneda-guide-exit.png" alt="Haneda Airport Terminal 3 exit guide"/></span>
        <span className="home-update-top"><Icon name="plane" size={16} />Arrival guide<Icon name="arrow" size={17}/></span>
        <span className="home-update-caption lens-glass"><strong>Your first hour<br/>in Tokyo.</strong><span className="home-arrival-caption-copy">Photo-by-photo directions from the gate to your ride.</span><span className="home-update-footer"><span>Walk me through</span><small className="home-demo-tag">Haneda T3 · Demo</small></span></span>
      </button>}
    </div>
    {review && proposal && <BottomSheet label="Review trip update" className="home-detail-sheet" onDismiss={() => setReview(false)}>
      <header><h2>Trip update</h2><button className="round-button" aria-label="Close update" onClick={() => setReview(false)}><Icon name="close" /></button></header>
      <p className="home-detail-muted">A real visitor-information reference, with an illustrative trip and member responses. This is not a live closure alert.</p>
      <JourneyProposalCard trip={trip} proposal={proposal} onUpdate={onUpdate} onPlan={day => { setReview(false); onJourney('plan', day) }}/>
      <button className="home-secondary" onClick={() => { setReview(false); onJourney('group') }}>Discuss with the group <Icon name="users" size={16}/></button>
    </BottomSheet>}
    {arrivalGuide && <BottomSheet label="Tokyo airport arrival guide" className="home-detail-sheet home-arrival-sheet" onDismiss={() => setArrivalGuide(false)}>
      <header><div><small>ARRIVAL GUIDE · PROTOTYPE</small><h2>Your first hour,<br/>already mapped out.</h2></div><button className="round-button" aria-label="Close arrival guide" onClick={() => setArrivalGuide(false)}><Icon name="close" /></button></header>
      <p>Like a pickup app, V-MAX shows exactly what to look for next. When a flight and hotel are linked, this becomes terminal-specific instead of a demo route.</p>
      <div className="home-arrival-status"><Icon name="plane" size={18}/><span><small>TRIP START</small><strong>{formatDate(trip.startDate)} · Airport details pending</strong></span></div>
      <div className="home-guide-source"><span>DEMO ROUTE · HANEDA TERMINAL 3</span><a href="https://tokyo-haneda.com/site_resource/service/pdf/barrier-free_initiatives_hnd_airport_story_for_terminal3_en.pdf" target="_blank" rel="noreferrer">Official airport guide ↗</a></div>
      <ol className="home-arrival-steps">
        <li><div className="home-guide-photo"><img src="/images/haneda-guide-immigration.png" alt="Haneda Terminal 3 immigration walk-through gates"/><em>LOOK FOR · ROUTE A / B</em></div><div className="home-guide-step"><i>01</i><span><strong>Follow the route shown after the kiosk</strong><small>Keep passports and entry documents from Trip Wallet ready. Use the staffed assistance lane if your group needs it.</small><b>Next landmark · Immigration gate</b></span></div></li>
        <li><div className="home-guide-photo"><img src="/images/haneda-guide-baggage.png" alt="Haneda Terminal 3 baggage claim carousels"/><em>MATCH YOUR FLIGHT NUMBER</em></div><div className="home-guide-step"><i>02</i><span><strong>Find your baggage carousel</strong><small>Match the flight number on the display, then wait together away from the moving belt.</small><b>Estimated here · 15–30 min</b></span></div></li>
        <li><div className="home-guide-photo"><img src="/images/haneda-guide-exit.png" alt="Exit into Haneda Terminal 3 second-floor arrival lobby"/><em>EXIT · ARRIVAL LOBBY 2F</em></div><div className="home-guide-step"><i>03</i><span><strong>Regroup after Customs</strong><small>Meet in the public Arrival Lobby on level 2. V-MAX keeps one agreed meeting point visible to all {trip.travellers} travellers.</small><b>Step-free route · Lift preferred</b></span></div></li>
        <li><div className="home-guide-photo"><img src="/images/haneda-guide-transport.png" alt="Train, monorail, bus and taxi options from Haneda Terminal 3"/><em>CHOOSE TRAIN · BUS · TAXI</em></div><div className="home-guide-step"><i>04</i><span><strong>Continue to your confirmed transfer</strong><small>The official T3 guide shows rail gates in the 2F Arrival Lobby and bus or taxi access toward level 1. V-MAX compares the final route after your hotel is linked.</small><b>Destination · Your Tokyo stay</b></span></div></li>
      </ol>
      <p className="home-detail-muted">Photo guide preview only. Flight tracking, landing notifications and indoor location are not connected.</p>
      <button className="home-secondary" onClick={() => { setArrivalGuide(false); onJourney('map', 1) }}>Preview the first-day route <Icon name="arrow" size={17}/></button>
    </BottomSheet>}
  </section>
}

export function NextUp({ trip, onJourney, onUpdate }: Props) {
  const [checklist, setChecklist] = useState(false)
  const now = journeyNow(trip)
  const before = now.phase === 'before'
  const next = nextJourneyStop(trip)
  const stop = next?.stop
  const firstDay = next ? {number: next.day} : undefined
  const date = dateAt(trip.startDate, (next?.day ?? now.day) - 1)
  const preparation = preparationFor(trip)
  const remaining = preparation.filter(c => !c.done).length
  return <section className="home-next" aria-labelledby="next-up-title">
    <div className="section-heading"><h2 id="next-up-title">Next up</h2><button className="home-text-button" onClick={() => onJourney('plan', firstDay?.number)}>Full plan <Icon name="arrow" size={14}/></button></div>
    <div className="home-next-group">
      <button className="home-next-stop" onClick={() => onJourney('plan', firstDay?.number)}>
        <span className="home-next-image"><img src={stop?.image || trip.image} alt=""/><span className="home-next-image-icon"><Icon name={stop?.kind==='arrival' ? 'plane' : 'pin'} size={15}/></span></span>
        <span className="home-next-copy"><small>{date === now.date ? 'Today' : date === dateAt(now.date, 1) ? 'Tomorrow' : formatDate(date)}{stop ? ` · ${stop.time}` : ''}</small><strong>{before ? `${trip.city}, here you come.` : stop?.title ?? 'Your day is wide open.'}</strong><span>{before ? stop?.title ?? 'Your departure day' : stop ? `${stop.duration} min · ${stop.participantIds?.length??trip.travellers} travellers` : 'Open the route and day plan'}</span></span><Icon name="arrow" size={17}/>
      </button>
      <button className="home-next-prep" onClick={() => setChecklist(true)}><span className="home-prep-progress" style={{ '--progress': `${100 * (preparation.length - remaining) / Math.max(1, preparation.length)}%` } as CSSProperties}><Icon name={remaining ? 'sparkles' : 'check'} size={16}/></span><span><strong>{remaining ? 'A little less to think about.' : 'Your preparation is confirmed.'}</strong><small>{remaining ? `Based on your trip · ${remaining} things to confirm` : 'All suggestions confirmed by you'}</small></span><Icon name="arrow" size={17}/></button>
    </div>
    {checklist && <SmartPreparation trip={trip} onClose={() => setChecklist(false)} onUpdate={onUpdate}/>}
  </section>
}
