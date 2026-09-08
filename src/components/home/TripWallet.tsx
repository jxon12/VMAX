import { useState, type CSSProperties } from 'react'
import { Icon, type IconName } from '../ui/Icon'
import { BottomSheet } from '../ui/BottomSheet'
import { JourneyEssentials } from '../journey/JourneyEssentials'
import { dateAt, formatDate } from '../../domain/trips'
import type { Trip } from '../../types/trips'
import { FLIGHT_SHORTLIST_ID } from '../../domain/assistant'

type Pass = { id: string; title: string; subtitle: string; date: string; icon: IconName; detail: string; status: string }
type Props = { trip: Trip; onUpdate: (update: (trip: Trip) => Trip) => void }

export function TripWallet({ trip, onUpdate }: Props) {
  const [selected, setSelected] = useState<number | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [documents, setDocuments] = useState(false)
  const sample = trip.id === 'tokyo-demo'
  const museumProposal = trip.proposals?.find(proposal => proposal.kind === 'museum')
  const museumDay = museumProposal?.status === 'accepted' ? trip.days.find(day => day.stops.some(stop => stop.proposalId === museumProposal.id)) : undefined
  const shortlist = trip.documents.find(d => d.id === FLIGHT_SHORTLIST_ID)
  const passes: Pass[] = [...(shortlist ? [{id:shortlist.id,title:shortlist.title,subtitle:'A comparison, not a booking',date:formatDate(trip.startDate),icon:'plane' as const,detail:shortlist.detail,status:'Unbooked · demo'}] : []), ...(sample ? [
    { id: 'museum-preview', title: 'Museum admission', subtitle: 'A little art. A different perspective.', date: museumDay ? formatDate(dateAt(trip.startDate, museumDay.number - 1)) : 'Date to be confirmed', icon: 'document', detail: 'Example ticket design. A planned visit is not a ticket; no ticket has been purchased.', status: 'Design preview' },
    { id: 'flight-preview', title: 'Your flight to Tokyo', subtitle: 'Flight reservation', date: formatDate(trip.startDate), icon: 'plane', detail: 'Sample flight pass. Actual airline, departure airport and check-in details will appear when a booking is added.', status: 'Sample pass' },
    { id: 'rail-preview', title: 'Airport → the city', subtitle: 'Airport transfer', date: formatDate(trip.startDate), icon: 'compass', detail: 'Example transfer pass. A route and ticket have not been booked.', status: 'Design preview' },
  ] : trip.documents.filter(d => d.id !== FLIGHT_SHORTLIST_ID).map(d => ({ id: d.id, title: d.title, subtitle: trip.city, date: formatDate(trip.startDate), icon: d.id === 'flight' ? 'plane' : 'document', detail: d.detail, status: d.sample ? 'Sample pass' : d.ready ? 'Saved document' : 'To add' }))) as Pass[]]
  const pass = selected === null ? null : passes[selected]
  return <section className="home-wallet" aria-labelledby="trip-wallet-title">
    <div className="section-heading"><h2 id="trip-wallet-title">Trip wallet</h2>{passes.length>0&&<button className="home-text-button" aria-expanded={expanded} onClick={() => setExpanded(v => !v)}>{expanded ? 'Stack' : 'View all'}<Icon name="arrow" size={14}/></button>}</div>
    {passes.length>0?<div className={`home-pass-stack ${expanded ? 'expanded' : ''}`} style={{ '--pass-count': passes.length } as CSSProperties}>
      {passes.map((p, index) => <button className="home-pass" key={p.id} style={{ '--pass-index': index } as CSSProperties} onClick={() => setSelected(index)} aria-label={`Open ${p.title}, ${p.status}`}>
        <span className="home-pass-top"><span><Icon name={p.icon} size={18}/>{p.id.startsWith('museum') ? 'ADMISSION' : p.id.startsWith('flight') ? 'FLIGHT' : p.id.startsWith('rail') ? 'TRANSFER' : 'DOCUMENT'}</span><small>{p.status}</small></span>
        <span className="home-pass-title">{p.title}</span><span className="home-pass-subtitle">{p.subtitle}</span>
        <span className="home-pass-tear"/><span className="home-pass-bottom"><span>{p.date}</span><span>V—MAX <Icon name="arrow" size={15}/></span></span>
      </button>)}
    </div>:<button className="home-wallet-empty" onClick={()=>setDocuments(true)}><Icon name="document" size={24}/><span><strong>Keep your journey together.</strong><small>Add your tickets and travel documents.</small></span><Icon name="arrow" size={18}/></button>}
    <button className="home-wallet-import" onClick={() => setDocuments(true)}><Icon name="document" size={15}/>{sample ? 'Sample collection · manage your documents' : 'Manage tickets & documents'}<Icon name="arrow" size={15}/></button>
    {pass && <BottomSheet label={pass.title} className="home-detail-sheet" onDismiss={() => setSelected(null)}>
      <header><h2>Trip wallet</h2><button className="round-button" aria-label="Close ticket" onClick={() => setSelected(null)}><Icon name="close"/></button></header>
      <article className="home-open-pass"><span className="home-pass-top"><Icon name={pass.icon} size={24}/><small>{pass.status}</small></span><h3>{pass.title}</h3><p>{pass.subtitle}</p><div className="home-pass-tear"/><strong>{pass.date}</strong><p>{pass.detail}</p>{(sample || pass.status === 'Sample pass') && <small>PREVIEW · NOT VALID FOR TRAVEL</small>}</article>
      <div className="home-wallet-controls"><button className="round-button" aria-label="Previous ticket" disabled={selected === 0} onClick={() => setSelected(Math.max(0, (selected ?? 0) - 1))}><span className="home-back-arrow"><Icon name="arrow"/></span></button><span>{(selected ?? 0) + 1} / {passes.length}</span><button className="round-button" aria-label="Next ticket" disabled={selected === passes.length - 1} onClick={() => setSelected(Math.min(passes.length - 1, (selected ?? 0) + 1))}><Icon name="arrow"/></button></div>
      <button className="home-secondary" onClick={() => { setSelected(null); setDocuments(true) }}>Manage documents</button>
    </BottomSheet>}
    {documents && <JourneyEssentials trip={trip} section="documents" onClose={() => setDocuments(false)} onUpdate={onUpdate}/>}
  </section>
}
