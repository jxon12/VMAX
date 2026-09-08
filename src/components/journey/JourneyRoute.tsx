import { useState } from 'react'
import type { Trip } from '../../types/trips'
import { minutes } from '../../domain/trips'
import { journeyNow, nextJourneyStop } from '../../domain/agents'
import { Icon } from '../ui/Icon'
import { BottomSheet } from '../ui/BottomSheet'
import '../../styles/journey-utility.css'
import '../../styles/journey-utilities-glass.css'

type Props = { trip: Trip; onPlan: () => void; onNotice: (message: string) => void; onUpdate?: (update: (trip: Trip) => Trip) => void }

export function JourneyRoute({ trip, onPlan, onNotice, onUpdate }: Props) {
  const [rideOpen, setRideOpen] = useState(false)
  const [completedId, setCompletedId] = useState<string | null>(null)
  const now = journeyNow(trip)
  const isDemo = trip.id === 'tokyo-demo' && trip.destination === 'tokyo' && trip.startDate === '2026-09-14' && trip.endDate === '2026-09-20'
  const selectedDay = trip.days.find(day => day.number === trip.activeDay) ?? trip.days[0]
  const stops = [...(selectedDay?.stops ?? [])].sort((a, b) => minutes(a.time) - minutes(b.time))
  const yourStops = stops.filter(stop => !stop.participantIds || stop.participantIds.includes('you'))
  const next = nextJourneyStop(trip)
  const preview = now.phase === 'before' || selectedDay?.number !== now.day
  const target = preview ? yourStops.find(stop => !stop.done) : next?.day === selectedDay?.number ? next.stop : undefined
  const completed = stops.find(stop => stop.id === completedId && stop.done)
  const previous = target ? yourStops.slice(0, yourStops.findIndex(stop => stop.id === target.id)).at(-1) : undefined
  const isFujiDay = yourStops.some(stop => /fuji|kawaguchi|oishi/i.test(stop.title))
  const isTokyoDay = trip.destination === 'tokyo' && !isFujiDay
  const backdrop = isFujiDay ? '/images/fuji-lake-autumn-portrait.jpg' : isTokyoDay ? '/images/tokyo-map-night-v1.png' : undefined
  const area = isFujiDay ? 'Fuji / Kawaguchiko' : trip.city
  const participants = target?.participantIds?.length ?? trip.members.length
  const destinationArea = target && /\btokyo\b/i.test(target.title) ? 'Tokyo' : area
  const destinationPlace = target?.title.replace(/^(?:return|transfer|travel|back)\s+to\s+/i, '') ?? ''
  const destinationText = target ? destinationPlace.toLowerCase().includes(destinationArea.toLowerCase()) ? destinationPlace : `${destinationPlace}, ${destinationArea}` : ''
  const markVisited = () => {
    if (!target || !selectedDay || preview || !onUpdate) return
    setCompletedId(target.id)
    onUpdate(value => ({ ...value, days: value.days.map(day => day.number === selectedDay.number ? { ...day, stops: day.stops.map(stop => stop.id === target.id ? { ...stop, done: true } : stop) } : day) }))
    onNotice('Marked visited. Your next stop now follows the shared plan.')
  }
  const openNextDay = () => {
    if (next && onUpdate) onUpdate(value => ({ ...value, activeDay: next.day }))
    onPlan()
  }
  const copyDestination = async () => {
    try { await navigator.clipboard.writeText(destinationText); onNotice('Destination copied. Paste it into your chosen travel app.') }
    catch { onNotice('Clipboard unavailable. Select and copy the destination text above.') }
  }

  return <section className="j-panel jr-route ju-route jg-route">
    <header className="jg-utility-heading"><div><h2>Your way there.</h2><p>{preview ? `Day ${selectedDay?.number ?? 1} preview` : `${isDemo ? 'Demo' : 'Local time'} · ${now.time}`} · {area}</p></div><span className="jg-mode-pill"><Icon name="compass" size={13} />{preview ? 'Preview' : 'Itinerary'}</span></header>
    {!stops.length ? <div className="j-empty"><Icon name="pin" size={30} /><h3>A little room to explore.</h3><p>There are no stops on this day. Add an idea in Plan before arranging transport.</p><button className="j-secondary" onClick={onPlan}>Go to Plan</button></div> : <>
      <div className={`jr-live-map ju-route-backdrop jg-route-map ${!backdrop ? 'schematic' : ''}`}>
        {backdrop && <img src={backdrop} alt={isFujiDay ? 'Mount Fuji destination photograph, not a navigation map' : 'Illustrative Tokyo map backdrop, not live navigation'} />}
        <div className="jr-map-shade" />
        <div className="jg-map-heading"><strong>{area}</strong><span>{isFujiDay ? 'Destination photo' : backdrop ? 'Illustrative map' : 'Route overview'} · not live GPS</span></div>
        {!backdrop && <div className="ju-route-abstract" aria-hidden="true"><i /><i /><i /></div>}
        <div className="jg-map-destination"><div className="jg-map-destination-label"><span>{target ? preview ? 'First stop for you' : 'Next for you' : 'All clear'}</span>{target && <time>{target.time}</time>}</div><h3>{target?.title ?? 'A little room to explore.'}</h3><p>{target ? `${participants} ${participants === 1 ? 'traveller' : 'travellers'} · ${target.duration} min planned` : 'No more stops in your plan for this day.'}</p>
          {target && <div className="jg-map-actions"><button className="jg-directions-button" onClick={() => setRideOpen(true)}><Icon name="compass" size={17} />Directions & rides</button>{!preview && onUpdate && <button className="jg-visited-button" onClick={markVisited}><Icon name="check" size={17} />Visited</button>}</div>}
        </div>
      </div>
      {completed && <p className="ju-status" role="status"><Icon name="check" size={15} /><span>{completed.title} marked visited. <button onClick={() => { if (onUpdate) onUpdate(value => ({ ...value, days: value.days.map(day => ({ ...day, stops: day.stops.map(stop => stop.id === completed.id ? { ...stop, done: false } : stop) })) })); setCompletedId(null) }}>Undo</button></span></p>}
      {!target && next && <div className="ju-next-day"><span>Next scheduled · Day {next.day}<strong>{next.stop.title}</strong></span><button className="j-secondary" onClick={openNextDay}>View plan</button></div>}
      <div className="jg-utility-section-heading"><h3>Along the way</h3><button onClick={onPlan}>Edit plan<Icon name="arrow" size={15} /></button></div>
      <ol className="jr-route-list ju-stop-list jg-route-stops">{stops.map((stop, index) => <li key={stop.id} className={`${target?.id === stop.id ? 'next' : ''} ${stop.done ? 'is-visited' : ''}`}><span>{stop.done ? <Icon name="check" size={14} /> : index + 1}</span><div><strong>{stop.title}</strong><small>{stop.time} · {stop.duration} min{stop.participantIds ? ` · ${trip.members.filter(member => stop.participantIds?.includes(member.id)).map(member => member.id === 'you' ? 'You' : member.name).join(', ') || 'No participants assigned'}` : ' · Whole group'}</small></div>{stop.done ? <b>Visited</b> : target?.id === stop.id ? <b>{preview ? 'First' : 'Next'}</b> : null}</li>)}</ol>
      <details className="jg-utility-note"><summary>About this route<Icon name="chevron" size={15} /></summary><p>Your next stop follows the itinerary, not GPS. {previous ? `${previous.title} is the preceding stop in your plan. ` : ''}Check your pickup, exact destination and route in your chosen provider. Traffic, fares and arrival detection are not connected in this prototype. Marking a stop visited updates the shared plan manually.</p></details>
    </>}

    {rideOpen && target && <BottomSheet label="Review destination and transport options" className="j-sheet ju-transport-sheet jg-utility-sheet" onDismiss={() => setRideOpen(false)}>
      <header><div><p className="j-eyebrow">YOU CHOOSE THE WAY</p><h2>Directions & rides.</h2></div><button aria-label="Close transport options" onClick={() => setRideOpen(false)}><Icon name="close" /></button></header>
      <label className="field-label">Destination to search<input value={destinationText} readOnly onFocus={event => event.target.select()} /></label>
      <button className="j-secondary" onClick={copyDestination}>Copy destination</button>
      <div className="ju-transfer-facts"><p><span>Pickup</span><strong>Choose in the provider</strong></p><p><span>Travellers in this stop</span><strong>{participants}</strong></p><p><span>Planned time</span><strong>Day {selectedDay?.number} · {target.time}</strong></p></div>
      <p className="fine-print">Check the exact place and pickup in the provider. Nothing is booked here.</p>
      <a className="ju-maps-link" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destinationText)}`} target="_blank" rel="noreferrer" onClick={() => onNotice('Opening a map search for this stop. Review the exact place before navigating.')}><Icon name="compass" size={20} /><span><strong>Look up the destination</strong><small>Compare walking, transit or driving in Maps</small></span><Icon name="arrow" size={18} /></a>
      <div className="jr-ride-apps">{trip.country === 'Japan' && <a href="https://go.goinc.jp/" target="_blank" rel="noreferrer" onClick={() => onNotice('Opening GO’s website. Paste the destination and choose pickup there; no ride is booked.')}><span className="jr-app-icon go">GO</span><span><strong>GO Taxi</strong><small>Provider website</small></span><Icon name="arrow" size={17} /></a>}<a href="https://m.uber.com/" target="_blank" rel="noreferrer" onClick={() => onNotice('Opening Uber. Paste the destination and choose pickup there; no ride is booked.')}><span className="jr-app-icon uber">U</span><span><strong>Uber</strong><small>Provider website</small></span><Icon name="arrow" size={17} /></a></div>
      <details className="jg-utility-note"><summary>Before you go<Icon name="chevron" size={15} /></summary><p>Ride links open provider websites; they do not transfer the destination or request a car. Paste the destination, then verify the exact address, route, accessibility, vehicle capacity and price. Availability varies.</p></details>
    </BottomSheet>}
  </section>
}
