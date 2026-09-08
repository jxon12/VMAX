import type { Trip } from '../types/trips'
import { travelDocuments } from './documents'

export type PreparationItem = { id: string; label: string; reason: string; done: boolean }

// Local prototype rules, not a live AI or document-verification service.
export function preparationFor(trip: Trip): PreparationItem[] {
  const items: PreparationItem[] = trip.checklist.map(item => ({ ...item, reason: 'From your saved trip checklist.' }))
  const suggest = (id: string, label: string, reason: string) => {
    const existing = items.find(item => item.id === id || item.label === label)
    if (existing) existing.reason = reason
    else items.push({ id, label, reason, done: false })
  }
  const documents = travelDocuments(trip)
  suggest('prep-offline', 'Download tickets for offline use', `${documents.filter(d => !d.ready).length} of ${documents.length} document entries still need your confirmation. A saved note is not an offline ticket.`)
  if (trip.mobility.length) suggest('prep-access', 'Check accessibility with venues', `Your group requested ${trip.mobility.join(', ').toLowerCase()}. Confirm the entrance and facilities with each venue.`)
  if (trip.dietary.length) suggest('prep-food', 'Save a dietary note to show restaurants', `Based on your group’s ${trip.dietary.join(', ').toLowerCase()} preferences.`)
  if (trip.days.some(day => day.stops.some(stop => stop.kind === 'arrival'))) suggest('prep-arrival', 'Save the first-stop address offline', `Your ${trip.city} itinerary includes an arrival. Keep the destination available without mobile data.`)
  if (trip.travellers > 1) suggest('prep-contact', 'Agree on a meeting point with your group', `${trip.travellers} travellers are sharing this trip. Choose a fallback meeting point if you get separated.`)
  return items
}
