import type { Trip } from '../types/trips'

export const FLIGHT_SHORTLIST_ID = 'flight-shortlist-demo'
/** A comparison belongs in Wallet, but is not a required travel document. */
export const travelDocuments = (trip: Trip) => trip.documents.filter(doc => doc.id !== FLIGHT_SHORTLIST_ID)
