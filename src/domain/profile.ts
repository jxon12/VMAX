import type { LocalProfile, ProfileDetails, ProfileErrors } from '../types/profile'
import type { Trip } from '../types/trips'

export const emptyProfile = (): LocalProfile => ({ displayName: '', email: '', departureAirport: '', session: 'guest' })
const text = (value: unknown) => typeof value === 'string' ? value.trim() : ''
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const airportPattern = /^[A-Z]{3}$/

export function cleanProfileDetails(details: ProfileDetails): ProfileDetails {
  return {
    displayName: text(details.displayName).replace(/\s+/g, ' '),
    email: text(details.email).toLowerCase(),
    departureAirport: text(details.departureAirport).toUpperCase(),
  }
}

export function profileErrors(details: ProfileDetails, requireEmail = false): ProfileErrors {
  const clean = cleanProfileDetails(details)
  const errors: ProfileErrors = {}
  if (!clean.displayName || clean.displayName.length > 40) errors.displayName = 'Use a display name between 1 and 40 characters.'
  if ((requireEmail && !clean.email) || (clean.email && (!emailPattern.test(clean.email) || clean.email.length > 254))) errors.email = 'Enter an email-shaped sample, such as alex@example.com.'
  if (clean.departureAirport && !airportPattern.test(clean.departureAirport)) errors.departureAirport = 'Use a three-letter airport code, such as KUL, or leave it blank.'
  return errors
}

/** Invalid optional account data must never invalidate otherwise valid journeys. */
export function normalizeProfile(value: unknown, fallbackDisplayName = ''): LocalProfile {
  const raw = value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
  const name = text(raw.displayName).replace(/\s+/g, ' ')
  const fallback = text(fallbackDisplayName).replace(/\s+/g, ' ')
  const email = text(raw.email).toLowerCase()
  const departureAirport = text(raw.departureAirport).toUpperCase()
  const details = {
    displayName: name.length <= 40 && name ? name : fallback.length <= 40 && fallback !== 'You' ? fallback : '',
    email: email.length <= 254 && emailPattern.test(email) ? email : '',
    departureAirport: airportPattern.test(departureAirport) ? departureAirport : '',
  }
  return { ...details, session: raw.session === 'demo' && Object.keys(profileErrors(details, true)).length === 0 ? 'demo' : 'guest' }
}

type ProfileState = { trips: Trip[]; profile?: unknown }

export function withLocalProfile<T extends ProfileState>(state: T): T & { profile: LocalProfile } {
  const ownerName = state.trips.flatMap(trip => trip.members).find(member => member.id === 'you' && member.name !== 'You')?.name ?? ''
  return { ...state, profile: normalizeProfile(state.profile, ownerName) }
}

/** Stable member IDs keep approvals, expenses and chat ownership unchanged. */
export function nameLocalOwner(trip: Trip, displayName: string): Trip {
  const name = text(displayName).replace(/\s+/g, ' ')
  if (!name || name.length > 40 || !trip.members.some(member => member.id === 'you' && member.name !== name)) return trip
  return { ...trip, members: trip.members.map(member => member.id === 'you' ? { ...member, name } : member) }
}

export function saveLocalProfile<T extends ProfileState>(state: T, details: ProfileDetails): T & { profile: LocalProfile } {
  const clean = cleanProfileDetails(details)
  if (Object.keys(profileErrors(clean)).length) throw new Error('Check your personal details before saving.')
  const previous = normalizeProfile(state.profile)
  const session = previous.session === 'demo' && previous.email === clean.email ? 'demo' : 'guest'
  return { ...state, profile: { ...clean, session }, trips: state.trips.map(trip => nameLocalOwner(trip, clean.displayName)) }
}

export function setLocalDemoSession<T extends ProfileState>(state: T, active: boolean): T & { profile: LocalProfile } {
  const profile = normalizeProfile(state.profile)
  if (active && Object.keys(profileErrors(profile, true)).length) return { ...state, profile: { ...profile, session: 'guest' } }
  return { ...state, profile: { ...profile, session: active ? 'demo' : 'guest' } }
}
