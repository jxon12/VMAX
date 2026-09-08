import { useEffect, useRef } from 'react'
import type { Trip } from '../../types/trips'
import { dateAt, formatDate, money, tripBudget, tripSpent } from '../../domain/trips'
import { journeyNow, nextJourneyStop, approvalState } from '../../domain/agents'
import { travelDocuments } from '../../domain/documents'
import { Icon } from '../ui/Icon'
import '../../styles/journey-overview-glass.css'

type Props = {
  trip: Trip
  onPlan: (day?: number) => void
  onSync: (day?: number) => void
  onDocs: () => void
  onChecklist: () => void
  onGroup: () => void
  onBudget: () => void
  onSettings: () => void
}

export function JourneyOverview({ trip, onPlan, onSync, onDocs, onChecklist, onGroup, onBudget, onSettings }: Props) {
  const heroRef = useRef<HTMLDivElement>(null)
  const now = journeyNow(trip)
  const next = nextJourneyStop(trip)
  const daysAway = Math.max(0, Math.round((Date.parse(trip.startDate) - Date.parse(now.date)) / 86400000))
  const pending = (trip.proposals ?? []).filter(proposal => proposal.status === 'pending' && (now.phase === 'during' || proposal.kind === 'museum'))
  const decision = now.phase === 'during' ? pending.find(proposal => proposal.kind === 'reunion') ?? pending[0] : pending[0]
  const confirmed = (trip.proposals ?? []).filter(proposal => proposal.status === 'accepted')
  const latest = confirmed.at(-1)
  const latestEdited = latest ? approvalState(trip, latest).reasons.length > 0 : false
  const latestStop = latest ? trip.days.flatMap(day => day.stops.map(stop => ({ day: day.number, stop }))).find(item => item.stop.proposalId === latest.id) : undefined
  const ready = trip.checklist.filter(item => item.done).length
  const documents = travelDocuments(trip)
  const completedDocs = documents.filter(document => document.ready).length
  const budgetLeft = tripBudget(trip) - tripSpent(trip)
  const unread = trip.messages.slice(trip.readMessages).filter(message => message.sender !== 'you').length
  const last = trip.messages[trip.messages.length - 1]
  const member = trip.members.find(person => person.id === last?.sender.replace('agent:', ''))
  const sender = last?.sender.startsWith('agent:')
    ? member?.id === 'you' ? 'Your Agent' : `${member?.name ?? 'V-MAX'}’s Agent`
    : last?.sender === 'you' ? 'You' : member?.name ?? 'V-MAX'
  const past = now.date > trip.endDate
  const nextDate = next ? dateAt(trip.startDate, next.day - 1) : undefined
  const nextDayLabel = nextDate === now.date ? 'Today' : nextDate ? formatDate(nextDate) : undefined
  const latestDay = latestStop?.day ?? latest?.day
  const hasFuji = trip.days.some(day => day.stops.some(stop => /fuji|kawaguchi|oishi/i.test(stop.title)))
  const hasTokyo = /tokyo/i.test(trip.city) || trip.days.some(day => day.stops.some(stop => /tokyo/i.test(stop.title)))
  const destination = hasFuji ? hasTokyo ? 'Tokyo.' : 'Fuji.' : `${trip.city.split(',')[0].trim()}.`
  const destinationAfter = hasFuji && hasTokyo ? 'Then Fuji.' : past ? 'Until next time.' : 'At your pace.'

  useEffect(() => {
    const hero = heroRef.current
    if (!hero) return
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0
    let pointerX = 0
    let pointerY = 0
    const paint = () => {
      frame = 0
      if (preference.matches) return
      const rect = hero.getBoundingClientRect()
      const scrollShift = Math.min(22, Math.max(0, -rect.top) * .045)
      hero.style.setProperty('--jg-cover-x', `${pointerX}px`)
      hero.style.setProperty('--jg-cover-y', `${pointerY + scrollShift}px`)
    }
    const schedule = () => { if (!frame && !preference.matches) frame = window.requestAnimationFrame(paint) }
    const move = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' || preference.matches) return
      const rect = hero.getBoundingClientRect()
      pointerX = ((event.clientX - rect.left) / rect.width - .5) * 7
      pointerY = ((event.clientY - rect.top) / rect.height - .5) * 4
      schedule()
    }
    const resetPointer = () => { pointerX = 0; pointerY = 0; schedule() }
    const resetMotion = () => {
      if (frame) window.cancelAnimationFrame(frame)
      frame = 0
      pointerX = 0
      pointerY = 0
      hero.style.removeProperty('--jg-cover-x')
      hero.style.removeProperty('--jg-cover-y')
      schedule()
    }
    hero.addEventListener('pointermove', move, { passive: true })
    hero.addEventListener('pointerleave', resetPointer, { passive: true })
    window.addEventListener('scroll', schedule, { passive: true, capture: true })
    preference.addEventListener('change', resetMotion)
    schedule()
    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      hero.removeEventListener('pointermove', move)
      hero.removeEventListener('pointerleave', resetPointer)
      window.removeEventListener('scroll', schedule, true)
      preference.removeEventListener('change', resetMotion)
    }
  }, [trip.id])

  return <section className="jg-ov jg-ov-immersive" aria-label="Journey overview">
    <div className={`jg-ov-hero ${hasFuji ? 'has-fuji' : ''}`} ref={heroRef}>
      <img src={hasFuji ? '/images/fuji-lake-autumn-portrait.jpg' : trip.image} alt={hasFuji ? 'Mount Fuji beyond Lake Kawaguchi, framed by autumn leaves' : `A moment in ${trip.city}`} className="jg-ov-photo" />
      <div className="jg-ov-photo-shade" />
      <div className="jg-ov-hero-top">
        <span className="jg-ov-status jl-clear"><Icon name={past ? 'check' : now.phase === 'before' ? 'plane' : 'sun'} size={14} />{past ? 'Journey complete' : now.phase === 'before' ? `${daysAway} ${daysAway === 1 ? 'day' : 'days'} to go` : `Day ${now.day} · ${formatDate(now.date)}`}</span>
      </div>
      <div className="jg-ov-hero-copy">
        <h1 className={destination.length > 16 ? 'is-long' : undefined}>{destination}<span>{destinationAfter}</span></h1>
        <p>{formatDate(trip.startDate)} – {formatDate(trip.endDate)}<i />{trip.travellers} travellers</p>
      </div>
      <button className="jg-ov-next jl-clear" onClick={() => onPlan(next?.day ?? now.day)}>
        <span className="jg-ov-next-icon"><Icon name={next?.stop.kind === 'arrival' ? 'plane' : 'pin'} size={20} /></span>
        <span className="jg-ov-next-copy">
          <small>{next ? `Next · ${nextDayLabel} · ${next.stop.time}` : 'Your itinerary'}</small>
          <strong>{next?.stop.title ?? 'A little room to explore'}</strong>
          {next && <span>{next.stop.duration} min · {next.stop.participantIds?.length ?? trip.travellers} travellers</span>}
        </span>
        <span className="jg-ov-next-arrow"><Icon name="arrow" size={18} /></span>
      </button>
    </div>

    {decision ? <button className="jg-ov-review" onClick={() => onSync(decision.day)}>
      <span className="jg-ov-orb" aria-hidden="true" />
      <span className="jg-ov-review-copy">
        <span className="jg-ov-review-label">V-MAX has a suggestion{pending.length > 1 && <b>{pending.length} to review</b>}</span>
        <strong>{decision.kind === 'museum' ? 'A different day for the museum?' : `Dinner together at ${decision.time}?`}</strong>
        <span>{decision.kind === 'museum' ? `Closed Monday. Review the ${formatDate(dateAt(trip.startDate, decision.day - 1))} alternative.` : 'Different afternoons. One shared evening. You decide.'}</span>
      </span>
      <span className="jg-ov-review-arrow"><Icon name="arrow" size={18} /></span>
    </button> : <div className="jg-ov-calm"><span><Icon name="check" size={17} /></span><p>You’re up to date.<small>Nothing awaiting your decision.</small></p></div>}

    <div className="jg-ov-section-heading"><h2>Within reach.</h2><button onClick={onSettings} aria-label="Trip preferences"><Icon name="filter" size={18} /></button></div>
    <div className="jg-ov-essentials">
      <button onClick={onDocs}><span className="jg-ov-essential-icon"><Icon name="document" size={24} /></span><strong>Documents</strong><small>{completedDocs} of {documents.length} ready</small></button>
      <button onClick={onChecklist}><span className="jg-ov-essential-icon"><Icon name="check" size={24} /></span><strong>Checklist</strong><small>{ready} of {trip.checklist.length} done</small></button>
      <button onClick={onBudget}><span className="jg-ov-essential-icon"><Icon name="wallet" size={24} /></span><strong>Budget</strong><small>{money(Math.abs(budgetLeft))}<span>{budgetLeft < 0 ? 'over budget' : 'available'}</span></small></button>
    </div>

    <button className="jg-ov-group" onClick={onGroup}>
      <span className="jg-ov-avatars" aria-hidden="true">{trip.members.slice(0, 3).map(person => <i key={person.id} style={{ background: person.color }}>{person.name[0]}</i>)}</span>
      <span className="jg-ov-group-copy"><strong>Your travel circle</strong><small>{last ? `${sender}: ${last.text}` : 'Your people and their personal Agents.'}</small></span>
      {unread > 0 && <b className="jg-ov-unread" aria-label={`${unread} unread messages`}>{unread > 99 ? '99+' : unread}</b>}
      <Icon name="arrow" size={17} />
    </button>

    {latest && <details className={`jg-ov-latest ${latestEdited ? 'is-edited' : ''}`}>
      <summary><Icon name={latestEdited ? 'document' : 'check'} size={16} /><span>{latestEdited ? 'A confirmed plan was edited' : 'Latest change saved to Plan'}</span><Icon name="chevron" size={15} /></summary>
      <div><strong>{latestEdited ? latestStop?.stop.title ?? 'The approved stop was removed' : latest.title}</strong><p>{latestDay ? formatDate(dateAt(trip.startDate, latestDay - 1)) : ''}{latestStop ? ` · ${latestStop.stop.time}` : !latestEdited ? ` · ${latest.time}` : ''}{latestEdited ? ' · review the current plan' : ' · confirmed by the group'}</p><button onClick={() => onPlan(latestDay ?? now.day)}>View in Plan <Icon name="arrow" size={15} /></button></div>
    </details>}
    <p className="jg-ov-note">{trip.id === 'tokyo-demo' ? 'Demo clock' : 'Saved on this device'} · no live monitoring</p>
  </section>
}
