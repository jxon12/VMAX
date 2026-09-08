import type { AgentPreferences, JourneyProposal, Stop, Trip } from '../types/trips'
import { dateAt, minutes, timeOf } from './trips'

const clockTime = /^([01]\d|2[0-3]):[0-5]\d$/
const MUSEUM_STOP = 'tokyo-demo-museum-original'
const safeAgent: AgentPreferences = { shareAvailability: false, shareArea: false, shareBudget: false, autoApproveReunion: false, availableFrom: '', area: '', mealBudget: 0 }
const isTokyoDemo = (trip: Trip) => trip.id === 'tokyo-demo' && trip.destination === 'tokyo' && trip.startDate === '2026-09-14' && trip.endDate === '2026-09-20'
const copyStop = (stop: Stop): Stop => ({ ...stop, ...(stop.participantIds ? { participantIds: [...stop.participantIds] } : {}) })

export function agentFor(trip: Trip, memberId: string): AgentPreferences {
  const agent = trip.members.find(member => member.id === memberId)?.agent
  return {
    shareAvailability: agent?.shareAvailability === true,
    shareArea: agent?.shareArea === true,
    shareBudget: agent?.shareBudget === true,
    autoApproveReunion: agent?.autoApproveReunion === true,
    availableFrom: typeof agent?.availableFrom === 'string' && clockTime.test(agent.availableFrom) ? agent.availableFrom : '',
    area: typeof agent?.area === 'string' ? agent.area : '',
    mealBudget: Number.isFinite(agent?.mealBudget) && (agent?.mealBudget ?? 0) >= 0 ? agent!.mealBudget : 0,
  }
}

/** Add the explicitly labelled demo once; never replace an edited day on load. */
export function normalizeAgentTrip(trip: Trip): Trip {
  let next: Trip = { ...trip, members: trip.members.map(member => ({ ...member, agent: agentFor(trip, member.id) })), proposals: (trip.proposals ?? []).map(proposal => proposal.source?.checkedAt === 'Reference snapshot · 7 Sep 2026 (not a live check)' ? { ...proposal, source: { ...proposal.source, checkedAt: 'Official reference · captured for this prototype; not a live check' } } : proposal) }
  if (!isTokyoDemo(trip)) return next
  if (trip.agentScenarioVersion === 1) return normalizeSplitAssignments(next)

  const knownMembers = new Set(['you', 'member-1', 'member-2', 'member-3'])
  next = { ...next, demoPhase: trip.demoPhase ?? 'before', agentScenarioVersion: 1, members: next.members.map(member => {
    if (trip.members.find(old => old.id === member.id)?.agent || !knownMembers.has(member.id)) return member
    return { ...member, agent: { ...safeAgent, shareAvailability: true, shareArea: true, shareBudget: true, autoApproveReunion: member.id !== 'you', availableFrom: member.id === 'member-3' ? '18:15' : '18:00', area: member.id === 'member-3' ? 'Marunouchi' : 'Shibuya', mealBudget: member.id === 'member-2' ? 100 : 120 } }
  }) }

  const firstDay = next.days.find(day => day.number === 1)
  if (firstDay && !next.days.some(day => day.stops.some(stop => stop.id === MUSEUM_STOP || /tokyo national museum/i.test(stop.title)))) {
    const untouched = firstDay.stops.length === 2 && firstDay.stops[0].title === 'Arrive & settle in' && firstDay.stops[0].time === '15:00' && firstDay.stops[0].duration === 90 && !firstDay.stops[0].done && firstDay.stops[1].title === 'Neighbourhood dinner' && firstDay.stops[1].time === '18:30' && !firstDay.stops[1].done
    const stops = firstDay.stops.map(stop => untouched && stop.id === firstDay.stops[0].id ? { ...stop, time: '09:00' } : stop)
    // Only insert into a real gap, with 30 minutes on each side and within visitor hours.
    const slot = ['14:00', '13:00', '11:30', '10:30', '15:00'].find(time => fits(stops, time, 90))
    if (slot) next = { ...next, days: next.days.map(day => day.number === 1 ? { ...day, stops: [...stops, { id: MUSEUM_STOP, title: 'Tokyo National Museum', time: slot, duration: 90, kind: 'activity', cost: 30, done: false, participantIds: next.members.map(member => member.id) } as Stop].sort(byTime) } : day) }
  }
  next = ensureProposal(next, 'museum')
  return normalizeSplitAssignments(ensureProposal(next, 'reunion'))
}

function normalizeSplitAssignments(trip: Trip): Trip {
  if (!isTokyoDemo(trip) || trip.splitScenarioVersion === 1) return trip
  const exploring = ['you', 'member-1', 'member-2']
  const knownStops = new Set(['Shibuya crossing & neighbourhood', 'Lunch near Shibuya', 'Meiji Jingu', 'Café break'])
  const hasSampleGroup = [...exploring, 'member-3'].every(id => trip.members.some(member => member.id === id))
  return { ...trip, splitScenarioVersion: 1, days: trip.days.map(day => day.number === 2 && hasSampleGroup ? { ...day, stops: day.stops.map(stop => knownStops.has(stop.title) && stop.participantIds === undefined && !stop.proposalId ? { ...stop, participantIds: [...exploring] } : stop) } : day) }
}

const byTime = (a: Stop, b: Stop) => minutes(a.time) - minutes(b.time)
function fits(stops: Stop[], time: string, duration: number, participantIds?: string[]) {
  if (!clockTime.test(time) || !Number.isFinite(duration) || duration <= 0 || minutes(time) + duration > 1440) return false
  const start = minutes(time), end = start + duration
  return stops.every(stop => {
    if (participantIds && stop.participantIds && !stop.participantIds.some(id => participantIds.includes(id))) return true
    return end + 30 <= minutes(stop.time) || start >= minutes(stop.time) + stop.duration + 30
  })
}

export function proposalFor(trip: Trip, kind: JourneyProposal['kind']) {
  return trip.proposals?.find(proposal => proposal.kind === kind)
}

export function ensureProposal(trip: Trip, kind: JourneyProposal['kind'], time?: string): Trip {
  if (!isTokyoDemo(trip)) return trip
  const existing = proposalFor(trip, kind)
  if (existing) {
    if (!time || !clockTime.test(time) || time === existing.time || existing.status === 'accepted') return trip
    return { ...trip, proposals: trip.proposals?.map(proposal => proposal.id === existing.id ? { ...proposal, status: 'pending', time, approvedBy: [] } : proposal) }
  }
  const participants = trip.members.map(member => member.id)
  let proposal: JourneyProposal
  if (kind === 'museum') {
    const original = trip.days.flatMap(day => day.stops).find(stop => stop.id === MUSEUM_STOP)
    if (!original || original.done) return trip
    const destination = [4, 5, 6, 7].map(day => trip.days.find(item => item.number === day)).find(day => day && fits(day.stops, '11:30', original.duration, original.participantIds))
    if (!destination) return trip
    proposal = { id: `${trip.id}-museum`, kind, status: 'pending', day: destination.number, time: '11:30', title: 'Tokyo National Museum', location: 'Ueno, Tokyo', participantIds: original.participantIds ?? participants, approvedBy: [], estimatedCost: original.cost, reasons: ['The original visit is on Monday, 14 September.', 'The official visitor page lists the regular Monday closure; holiday exceptions require checking.', 'Move the existing visit into an open itinerary slot. Ticket price is a demo estimate.'], source: { label: 'Tokyo National Museum · official visitor information', url: 'https://www.tnm.jp/modules/r_free_page/index.php?id=113l&lang=en', checkedAt: 'Official reference · captured for this prototype; not a live check' } }
  } else {
    if (!trip.days.some(day => day.number === 2) || participants.length < 2) return trip
    proposal = { id: `${trip.id}-reunion`, kind, status: 'pending', day: 2, time: time && clockTime.test(time) ? time : '19:00', title: 'Dinner together in Shinjuku', location: 'Shinjuku, Tokyo', participantIds: participants, approvedBy: [], estimatedCost: 90, reasons: ['Each member controls the information their Agent can share.', 'Demo transfer allowance: 30 minutes from Shibuya; 35 minutes from Marunouchi.', 'MYR 90 per person is a planning estimate, not a booking or charge.'] }
  }
  return { ...trip, proposals: [...(trip.proposals ?? []), proposal] }
}

function constraints(trip: Trip, proposal: JourneyProposal): string[] {
  const reasons: string[] = []
  if (!isTokyoDemo(trip)) return ['This proposal does not belong to the Tokyo demo journey.']
  const day = trip.days.find(item => item.number === proposal.day)
  if (!day || !clockTime.test(proposal.time)) return ['Choose a valid day and time.']
  if (!Number.isFinite(proposal.estimatedCost) || proposal.estimatedCost < 0 || !proposal.participantIds.length || new Set(proposal.participantIds).size !== proposal.participantIds.length) return ['The proposal details need review.']
  if (proposal.participantIds.some(id => !trip.members.some(member => member.id === id))) return ['A participant is no longer in this journey.']
  const originalMuseum = trip.days.flatMap(item => item.stops).find(stop => stop.id === MUSEUM_STOP)
  if (proposal.kind === 'museum' && proposal.status !== 'accepted' && !originalMuseum) return ['The original museum visit has changed. Review the plan before moving it.']
  if (proposal.kind === 'museum' && proposal.status !== 'accepted' && originalMuseum) {
    const originalParticipants = originalMuseum.participantIds ?? trip.members.map(member => member.id)
    if (originalMuseum.done || originalMuseum.title !== proposal.title || originalMuseum.cost !== proposal.estimatedCost || originalParticipants.length !== proposal.participantIds.length || originalParticipants.some(id => !proposal.participantIds.includes(id))) return ['The original museum visit was completed or edited. Keep your changes and review the plan before moving it.']
  }
  const duration = proposal.kind === 'reunion' ? 90 : originalMuseum?.duration ?? 90
  const otherStops = day.stops.filter(stop => stop.proposalId !== proposal.id && !(proposal.kind === 'museum' && stop.id === MUSEUM_STOP))
  if (!fits(otherStops, proposal.time, duration, proposal.participantIds)) reasons.push('This time overlaps another stop or leaves less than 30 minutes to transfer.')
  if (proposal.kind === 'museum') {
    const originalDay = trip.days.find(item => item.stops.some(stop => stop.id === MUSEUM_STOP))
    if (proposal.status !== 'accepted' && originalDay && new Date(`${dateAt(trip.startDate, originalDay.number - 1)}T12:00:00`).getDay() !== 1) reasons.push('The original visit is no longer on Monday. This closure proposal needs refreshing.')
    const visitDate = dateAt(trip.startDate, proposal.day - 1)
    if (new Date(`${visitDate}T12:00:00`).getDay() === 1 || minutes(proposal.time) < 570 || minutes(proposal.time) + duration > 1020) reasons.push('Choose a visit within the demo museum hours on a day other than Monday.')
  } else {
    for (const id of proposal.participantIds) {
      const member = trip.members.find(item => item.id === id)!, agent = agentFor(trip, id)
      if (agent.shareAvailability) {
        if (!agent.availableFrom) reasons.push(`${member.name} needs a valid shared availability time.`)
        else if (agent.shareArea) {
          const transfer = agent.area === 'Marunouchi' ? 35 : agent.area === 'Shibuya' ? 30 : null
          if (transfer === null) reasons.push(`${member.name}’s transfer from the shared area needs review.`)
          else if (minutes(proposal.time) < minutes(agent.availableFrom) + transfer) reasons.push(`${member.name} cannot arrive before ${timeOf(minutes(agent.availableFrom) + transfer)} with the demo transfer allowance.`)
        } else if (minutes(proposal.time) < minutes(agent.availableFrom)) reasons.push(`${member.name} is not available at this time.`)
      }
      if (agent.shareBudget && proposal.estimatedCost > agent.mealBudget) reasons.push(`${member.name}’s shared meal budget is below the MYR ${proposal.estimatedCost} estimate.`)
    }
  }
  return reasons
}

function approved(trip: Trip, proposal: JourneyProposal, id: string) {
  if (proposal.approvedBy.includes(id)) return true
  const agent = agentFor(trip, id)
  return proposal.kind === 'reunion' && agent.autoApproveReunion && agent.shareAvailability && agent.shareArea && agent.shareBudget && Boolean(agent.availableFrom) && Boolean(agent.area) && agent.mealBudget >= proposal.estimatedCost
}

function acceptedEditReason(trip: Trip, proposal: JourneyProposal): string | undefined {
  const applied = proposal.appliedStop
  const matching = trip.days.flatMap(day => day.stops.filter(stop => stop.proposalId === proposal.id).map(stop => ({ day: day.number, stop })))
  if (matching.length !== 1 || matching[0].day !== proposal.day) return 'This confirmed stop was removed or moved in Plan. Undo is paused to preserve your edits.'
  const current = matching[0].stop
  if (!applied) {
    if (current.title !== proposal.title || current.time !== proposal.time || current.cost !== proposal.estimatedCost || current.done) return 'This confirmed stop was edited in Plan. Undo is paused to preserve your edits.'
  } else {
    const fields: (keyof Stop)[] = ['id', 'activityId', 'title', 'time', 'duration', 'image', 'kind', 'cost', 'done', 'proposalId']
    if (fields.some(field => current[field] !== applied[field]) || JSON.stringify(current.participantIds) !== JSON.stringify(applied.participantIds)) return 'This confirmed stop was edited in Plan. Undo is paused to preserve your edits.'
  }
  for (const previous of proposal.previousStops ?? []) {
    const destination = trip.days.find(day => day.number === previous.day)
    if (!destination) return 'The previous day is no longer in this journey. Undo is paused to preserve your edits.'
    const remaining = destination.stops.filter(stop => stop.proposalId !== proposal.id)
    if (previous.stops.some(stop => !fits(remaining, stop.time, stop.duration, stop.participantIds))) return 'The previous time now conflicts with another stop. Undo is paused to preserve your new plans.'
  }
  return undefined
}

/** Ready means the initiating user's confirm can commit; waiting contains OTHER member IDs. */
export function approvalState(trip: Trip, proposal: JourneyProposal): { ready: boolean; waiting: string[]; reasons: string[] } {
  if (proposal.status === 'accepted') {
    const editReason = acceptedEditReason(trip, proposal)
    return { ready: !editReason, waiting: [], reasons: editReason ? [editReason] : [] }
  }
  const reasons = constraints(trip, proposal)
  const waiting = proposal.participantIds.filter(id => id !== 'you' && !approved(trip, proposal, id))
  return { ready: reasons.length === 0 && waiting.length === 0, waiting, reasons }
}

export function reviewProposal(trip: Trip, id: string, decision: 'accept' | 'decline' | 'undo', actorId = 'you'): Trip {
  const proposal = trip.proposals?.find(item => item.id === id)
  if (!proposal || !isTokyoDemo(trip) || !trip.members.some(member => member.id === actorId) || !proposal.participantIds.includes(actorId)) return trip
  if (decision === 'undo') {
    if (proposal.status !== 'accepted' || actorId !== 'you') return trip
    if (acceptedEditReason(trip, proposal)) return trip
    let days = trip.days.map(day => ({ ...day, stops: day.stops.filter(stop => stop.proposalId !== id) }))
    for (const previous of proposal.previousStops ?? []) {
      const missing = previous.stops.filter(stop => !days.some(day => day.stops.some(item => item.id === stop.id)))
      days = days.map(day => day.number === previous.day ? { ...day, stops: [...day.stops, ...missing.map(copyStop)].sort(byTime) } : day)
    }
    return recordChange({ ...trip, days, proposals: trip.proposals?.map(item => item.id === id ? { ...item, status: 'pending', approvedBy: [], previousStops: undefined, appliedStop: undefined } : item) }, proposal, 'Change undone. The previous plan is restored; unrelated edits are kept.')
  }
  if (proposal.status !== 'pending') return trip
  if (decision === 'decline') return recordChange({ ...trip, proposals: trip.proposals?.map(item => item.id === id ? { ...item, status: 'declined' } : item) }, proposal, 'Proposal declined. The current journey stays unchanged.')
  if (constraints(trip, proposal).length) return trip
  const voted = { ...proposal, approvedBy: [...new Set([...proposal.approvedBy, actorId])] }
  const next = { ...trip, proposals: trip.proposals?.map(item => item.id === id ? voted : item) }
  if (!voted.participantIds.every(memberId => approved(next, voted, memberId))) return next

  const previousStops: { day: number; stops: Stop[] }[] = []
  const museumOriginal = trip.days.flatMap(day => day.stops).find(stop => stop.id === MUSEUM_STOP)
  let days = trip.days.map(day => {
    const removed = proposal.kind === 'museum' ? day.stops.filter(stop => stop.id === MUSEUM_STOP) : []
    if (removed.length) previousStops.push({ day: day.number, stops: removed.map(copyStop) })
    return { ...day, stops: day.stops.filter(stop => !removed.some(item => item.id === stop.id)) }
  })
  const stop: Stop = { ...(museumOriginal && proposal.kind === 'museum' ? copyStop(museumOriginal) : { id: `${id}-stop`, duration: 90, kind: 'meal' as const, done: false }), title: proposal.title, time: proposal.time, cost: proposal.estimatedCost, participantIds: [...proposal.participantIds], proposalId: id }
  days = days.map(day => day.number === proposal.day ? { ...day, stops: [...day.stops, stop].sort(byTime) } : day)
  return recordChange({ ...next, days, proposals: next.proposals?.map(item => item.id === id ? { ...voted, status: 'accepted', previousStops, appliedStop: copyStop(stop) } : item) }, voted, `${proposal.title} confirmed for Day ${proposal.day} at ${proposal.time}. Plan and Route now use this change. No booking or payment was made.`)
}

function recordChange(trip: Trip, proposal: JourneyProposal, text: string): Trip {
  const now = journeyNow(trip)
  return { ...trip, messages: [...trip.messages, { id: `${proposal.id}-${Date.now()}-${trip.messages.length}`, sender: 'vmax', text, time: now.time, date: now.date, proposalId: proposal.id }] }
}

export function updateAgent(trip: Trip, memberId: string, patch: Partial<AgentPreferences>): Trip {
  if (!trip.members.some(member => member.id === memberId)) return trip
  const proposed = { ...agentFor(trip, memberId), ...patch }
  const intermediate = { ...trip, members: trip.members.map(member => member.id === memberId ? { ...member, agent: proposed } : member) }
  return { ...intermediate, members: intermediate.members.map(member => member.id === memberId ? { ...member, agent: agentFor(intermediate, memberId) } : member), proposals: trip.proposals?.map(proposal => proposal.status === 'pending' ? { ...proposal, approvedBy: proposal.approvedBy.filter(id => id !== memberId) } : proposal) }
}

export function journeyNow(trip: Trip): { date: string; time: string; day: number; phase: 'before' | 'during' } {
  if (isTokyoDemo(trip)) return trip.demoPhase === 'during' ? { date: '2026-09-15', time: '17:00', day: 2, phase: 'during' } : { date: '2026-09-13', time: '09:00', day: 1, phase: 'before' }
  const now = new Date(), date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const day = Math.max(1, Math.min(trip.days.length, Math.floor((Date.parse(date) - Date.parse(trip.startDate)) / 86400000) + 1))
  return { date, time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`, day, phase: date < trip.startDate ? 'before' : 'during' }
}

export function nextJourneyStop(trip: Trip, viewerId = 'you'): { day: number; stop: Stop } | undefined {
  const now = journeyNow(trip)
  for (const day of [...trip.days].sort((a, b) => a.number - b.number)) {
    const date = dateAt(trip.startDate, day.number - 1)
    if (date < now.date) continue
    const stop = [...day.stops].sort(byTime).find(item => !item.done && (!item.participantIds || item.participantIds.includes(viewerId)) && (date > now.date || minutes(item.time) + item.duration > minutes(now.time)))
    if (stop) return { day: day.number, stop }
  }
  return undefined
}
