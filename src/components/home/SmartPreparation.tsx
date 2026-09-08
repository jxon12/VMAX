import { preparationFor } from '../../domain/preparation'
import type { Trip } from '../../types/trips'
import { BottomSheet } from '../ui/BottomSheet'
import { Icon } from '../ui/Icon'

export function SmartPreparation({ trip, onClose, onUpdate }: { trip: Trip; onClose: () => void; onUpdate: (update: (trip: Trip) => Trip) => void }) {
  const items = preparationFor(trip)
  return <BottomSheet label="Your preparation brief" className="home-detail-sheet" onDismiss={onClose}>
    <header><h2>A little less to think about.</h2><button className="round-button" aria-label="Close preparation" onClick={onClose}><Icon name="close"/></button></header>
    <p>V-MAX has pulled together a preparation brief from your itinerary, group preferences and document status. You confirm what’s actually ready.</p>
    <div className="home-prep-context"><span>{trip.city}</span><span>{trip.days.length} days</span><span>{trip.travellers} travellers</span></div>
    <p className="home-detail-muted">Prototype · local suggestions, not live AI checks. No documents, bookings or packed items are automatically verified.</p>
    <div className="home-smart-list">{items.map(item => <label key={item.id} className={item.done ? 'is-ready' : ''}>
      <input type="checkbox" checked={item.done} onChange={() => onUpdate(current => {
        const existing = current.checklist.find(c => c.id === item.id)
        return { ...current, checklist: existing ? current.checklist.map(c => c.id === item.id ? { ...c, done: !c.done } : c) : [...current.checklist, { id: item.id, label: item.label, done: true }] }
      })}/><span><strong>{item.label}</strong><small>{item.reason}</small><em>{item.done ? 'Confirmed by you' : 'Needs your confirmation'}</em></span>
    </label>)}</div>
    <button className="home-primary" onClick={onClose}>Done for now <Icon name="check" size={16}/></button>
  </BottomSheet>
}
