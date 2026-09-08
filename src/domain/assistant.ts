import type { Trip } from '../types/trips'
import { dayCount, isISODate } from './trips'
import { FLIGHT_SHORTLIST_ID } from './documents'
export { FLIGHT_SHORTLIST_ID } from './documents'

export type AssistantAction = 'museum' | 'reunion' | 'plan' | 'group' | 'documents' | 'map' | 'budget' | 'profile' | 'gentler'
export type AssistantIntent = AssistantAction | 'flights' | 'coordinate' | 'new-trip' | 'unsupported'
export type AssistantRequest = { id: number; tripId: string; action: AssistantAction }

export const isGentleRequest = (text: string) => /\b(?:slow\w*|rest|tired|walk\w*|gentl\w*|relax\w*)\b|慢|累|休息/i.test(text)

/** A deliberately bounded prototype router, not a general language model. */
export function assistantIntent(text: string): AssistantIntent {
  const query = text.trim().toLowerCase()
  // The object of an explicit request wins over a broad topic such as "flight".
  if (/receipt|expense|split.*(bill|cost)|收据|分账/.test(query)) return 'budget'
  if (/wallet|document|boarding pass|(?:show|open|view)\b.*\btickets?\b|票夹|登机牌|证件/.test(query)) return 'documents'
  if (/flight|airfare|机票|航班|比价/.test(query)) return 'flights'
  if (/coordinat|meeting|reunit|sync|dinner|member.*agent|agent.*member|开会|会议|协调|集合/.test(query)) return 'coordinate'
  if (/museum|clos(ed|ure)|博物馆|闭馆/.test(query)) return 'museum'
  if (/receipt|budget|expense|split.*(bill|cost)|收据|分账|预算/.test(query)) return 'budget'
  if (/wallet|document|boarding pass|票夹|登机牌|证件/.test(query)) return 'documents'
  if (/route|taxi|ride|map|direction|地图|打车|路线/.test(query)) return 'map'
  if (/profile|preference|interest|permission|sign.?in|log.?in|资料|偏好|兴趣|权限|登录/.test(query)) return 'profile'
  if (isGentleRequest(query)) return 'gentler'
  if (/new (trip|escape|journey)|plan a trip|新行程|新旅程/.test(query)) return 'new-trip'
  if (/chat|group|群聊/.test(query)) return 'group'
  if (/plan|itinerary|next|行程|下一站/.test(query)) return 'plan'
  return 'unsupported'
}

export type SampleFlight = { id: string; label: string; airport: 'HND' | 'NRT'; stops: number; duration: string; fare: number; checkedBag: number; note: string }
// Fictional offers. Never associate these amounts with a real carrier or live inventory.
export const SAMPLE_FLIGHTS: readonly SampleFlight[] = [
  { id: 'direct-complete', label: 'Direct · with a checked bag', airport: 'HND', stops: 0, duration: '7h 10m', fare: 2280, checkedBag: 0, note: '20 kg included · arrival airport closer to central Tokyo in this example.' },
  { id: 'direct-light', label: 'Direct · light fare', airport: 'NRT', stops: 0, duration: '7h 20m', fare: 1840, checkedBag: 260, note: 'Cabin bag included · checked baggage is an extra round-trip allowance.' },
  { id: 'one-stop', label: 'One stop · lower fare', airport: 'NRT', stops: 1, duration: '11h 35m', fare: 1650, checkedBag: 180, note: 'Lower example fare, with a longer journey and a connection.' },
]

export function sampleFlightOptions(trip: Trip, origin: string, bag: boolean, directOnly: boolean) {
  if (trip.destination !== 'tokyo' || origin !== 'KUL' || !Number.isInteger(trip.travellers) || trip.travellers < 1 || trip.travellers > 12 || !isISODate(trip.startDate) || !isISODate(trip.endDate) || dayCount(trip.startDate, trip.endDate) < 1 || dayCount(trip.startDate, trip.endDate) > 30) return []
  return SAMPLE_FLIGHTS.filter(f => !directOnly || f.stops === 0)
    .map(f => ({ ...f, perPerson: f.fare + (bag ? f.checkedBag : 0), total: (f.fare + (bag ? f.checkedBag : 0)) * trip.travellers }))
    .sort((a, b) => a.total - b.total)
}

export function saveSampleFlight(trip: Trip, flightId: string, origin: string, bag: boolean, directOnly: boolean): Trip {
  const flight = sampleFlightOptions(trip, origin, bag, directOnly).find(f => f.id === flightId)
  if (!flight) return trip
  const doc = {
    id: FLIGHT_SHORTLIST_ID, title: 'Flight shortlist', ready: false, sample: true,
    detail: `DEMO · NOT BOOKED. ${origin} → ${flight.airport} · ${trip.startDate}–${trip.endDate} · round trip · ${trip.travellers} travellers. ${flight.label}. MYR ${flight.perPerson} per person / MYR ${flight.total} group total${bag ? ' with checked baggage' : ' without additional checked baggage'}. Illustrative fares including example taxes; not live inventory. No payment, ticket or budget expense created.`,
  }
  const existing = trip.documents.find(d => d.id === doc.id)
  if (existing?.detail === doc.detail && existing.title === doc.title && existing.sample === true && existing.ready === false) return trip
  return { ...trip, documents: [...trip.documents.filter(d => d.id !== doc.id), doc] }
}
