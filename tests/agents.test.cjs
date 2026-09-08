const { test } = require('node:test')
const assert = require('node:assert/strict')
const a = require('../.test-build/domain/agents.js')
const d = require('../.test-build/domain/trips.js')
const fixture = () => a.normalizeAgentTrip(d.seedTokyo())
const proposal = (trip, kind = 'reunion') => a.proposalFor(trip, kind)

test('agent migration is additive and runs once without resetting edited Fuji days', () => {
  const trip = d.seedTokyo()
  trip.days[2].stops[0].title = 'My custom Fuji transfer'
  trip.days[2].stops[0].time = '07:30'
  const beforeFuji = JSON.stringify(trip.days[2])
  const migrated = a.normalizeAgentTrip(trip)
  assert.equal(JSON.stringify(migrated.days[2]), beforeFuji)
  assert.equal(trip.days[0].stops[0].time, '15:00')
  assert.equal(migrated.days[0].stops[0].time, '09:00')
  assert.equal(migrated.days[0].stops.find(s => s.id === 'tokyo-demo-museum-original').time, '14:00')
  assert.equal(migrated.proposals.length, 2)
  const removed = { ...migrated, days: migrated.days.map(day => ({ ...day, stops: day.stops.filter(s => s.id !== 'tokyo-demo-museum-original') })) }
  assert.deepEqual(a.normalizeAgentTrip(removed).days, removed.days)
  assert.deepEqual(a.normalizeAgentTrip(migrated), migrated)
})

test('edited first days are preserved and do not get false museum alerts without a clean slot', () => {
  const trip = d.seedTokyo()
  trip.days[0].stops = [d.makeStop('Personal full-day commitment', '09:00', 'activity', 600)]
  const before = JSON.stringify(trip.days[0])
  const normalized = a.normalizeAgentTrip(trip)
  assert.equal(JSON.stringify(normalized.days[0]), before)
  assert.equal(proposal(normalized, 'museum'), undefined)
})

test('the sample exploring stops belong to three members and assignments migrate only once', () => {
  const original = d.seedTokyo()
  original.days[1].stops[1].participantIds = ['you']
  original.days[1].stops[2].title = 'My edited sightseeing stop'
  const trip = a.normalizeAgentTrip(original)
  assert.deepEqual(trip.days[1].stops[0].participantIds, ['you', 'member-1', 'member-2'])
  assert.deepEqual(trip.days[1].stops[1].participantIds, ['you'])
  assert.equal(trip.days[1].stops[2].participantIds, undefined)
  assert.deepEqual(trip.days[1].stops[3].participantIds, ['you', 'member-1', 'member-2'])
  assert.equal(trip.days.flatMap(day => day.stops).some(stop => /meeting|private commitment/i.test(stop.title)), false)
  trip.days[1].stops[0].participantIds = ['member-3']
  assert.deepEqual(a.normalizeAgentTrip(trip).days, trip.days)
})

test('next up excludes other members’ assigned stops while unassigned stops stay shared', () => {
  const trip = { ...fixture(), demoPhase: 'during' }
  const otherMemberStop = { ...d.makeStop('Member-only appointment', '17:30', 'activity', 30), participantIds: ['member-3'] }
  trip.days[1].stops.push(otherMemberStop)
  assert.equal(a.nextJourneyStop(trip).day, 3)
  assert.equal(a.nextJourneyStop(trip, 'member-3').stop.id, otherMemberStop.id)
  const sharedStop = d.makeStop('Shared walk', '18:30', 'activity', 30)
  trip.days[1].stops.push(sharedStop)
  assert.equal(a.nextJourneyStop(trip).stop.id, sharedStop.id)
})

test('ordinary trips and wrong-city demo ids receive no Tokyo fixtures or delegated authority', () => {
  for (const destination of ['tokyo', 'shanghai']) {
    const original = d.createTrip({ ...d.DEFAULT_PREFERENCES, destination, startDate: '2026-09-14', endDate: '2026-09-20', travellers: 4, budgetPerPerson: 1000 })
    if (destination === 'shanghai') original.id = 'tokyo-demo'
    const trip = a.normalizeAgentTrip(original)
    assert.deepEqual(trip.days, original.days)
    assert.deepEqual(trip.proposals, [])
    assert.equal(a.ensureProposal(trip, 'reunion'), trip)
    for (const member of trip.members) assert.equal(a.agentFor(trip, member.id).autoApproveReunion, false)
  }
})

test('confirmed reunion propagates through shared plan and current next stop, only once', () => {
  const trip = { ...fixture(), demoPhase: 'during', activeDay: 7 }
  const p = proposal(trip)
  assert.deepEqual(a.approvalState(trip, p), { ready: true, waiting: [], reasons: [] })
  const changed = a.reviewProposal(trip, p.id, 'accept')
  assert.equal(proposal(changed).status, 'accepted')
  assert.equal(proposal(trip).status, 'pending')
  assert.equal(changed.days[1].stops.filter(s => s.proposalId === p.id).length, 1)
  assert.deepEqual(changed.days[1].stops.find(s => s.proposalId === p.id).participantIds, trip.members.map(m => m.id))
  assert.equal(a.nextJourneyStop(changed).stop.proposalId, p.id)
  assert.equal(a.nextJourneyStop(changed).day, 2)
  assert.equal(changed.messages.at(-1).proposalId, p.id)
  assert.equal(changed.messages.at(-1).date, '2026-09-15')
  assert.equal(changed.messages.at(-1).time, '17:00')
  assert.equal(d.tripSpent(changed), d.tripSpent(trip))
  assert.equal(a.reviewProposal(changed, p.id, 'accept'), changed)
})

test('undo preserves unrelated user edits and allows one clean re-confirmation', () => {
  const trip = fixture(), p = proposal(trip)
  const confirmed = a.reviewProposal(trip, p.id, 'accept')
  confirmed.days[2].stops[0].title = 'Edited after confirmation'
  const undone = a.reviewProposal(confirmed, p.id, 'undo')
  assert.equal(proposal(undone).status, 'pending')
  assert.equal(undone.days[2].stops[0].title, 'Edited after confirmation')
  assert.equal(undone.days[1].stops.some(s => s.proposalId === p.id), false)
  assert.equal(a.reviewProposal(undone, p.id, 'accept').days[1].stops.filter(s => s.proposalId === p.id).length, 1)
})

test('undo pauses instead of deleting a confirmed stop that the user subsequently edited', () => {
  const trip = fixture(), p = proposal(trip)
  const confirmed = a.reviewProposal(trip, p.id, 'accept')
  confirmed.days[1].stops.find(s => s.proposalId === p.id).title = 'My edited dinner venue'
  assert.equal(a.reviewProposal(confirmed, p.id, 'undo'), confirmed)
  const state = a.approvalState(confirmed, proposal(confirmed))
  assert.equal(state.ready, false)
  assert.match(state.reasons.join(' '), /edited.*preserve/)
  assert.equal(proposal(confirmed).status, 'accepted')
})

test('removing an accepted stop does not silently recreate it or rewind unrelated changes', () => {
  const trip = fixture(), p = proposal(trip)
  const confirmed = a.reviewProposal(trip, p.id, 'accept')
  const removed = { ...confirmed, days: confirmed.days.map(day => ({ ...day, stops: day.stops.filter(s => s.proposalId !== p.id) })) }
  assert.equal(a.reviewProposal(removed, p.id, 'undo'), removed)
  assert.deepEqual(a.normalizeAgentTrip(removed).days, removed.days)
  assert.match(a.approvalState(removed, proposal(removed)).reasons.join(' '), /removed or moved/)
})

test('one user cannot override a member who has not delegated approval', () => {
  let trip = a.updateAgent(fixture(), 'member-1', { autoApproveReunion: false })
  const p = proposal(trip)
  assert.deepEqual(a.approvalState(trip, p).waiting, ['member-1'])
  trip = a.reviewProposal(trip, p.id, 'accept', 'you')
  assert.equal(proposal(trip).status, 'pending')
  assert.equal(trip.days[1].stops.some(s => s.proposalId === p.id), false)
  trip = a.reviewProposal(trip, p.id, 'accept', 'member-1')
  assert.equal(proposal(trip).status, 'accepted')
})

test('another member cannot confirm for the owner unless the owner explicitly delegated within limits', () => {
  const manual = fixture(), p = proposal(manual)
  assert.equal(proposal(a.reviewProposal(manual, p.id, 'accept', 'member-1')).status, 'pending')
  const delegated = a.updateAgent(manual, 'you', { autoApproveReunion: true })
  assert.equal(proposal(a.reviewProposal(delegated, p.id, 'accept', 'member-1')).status, 'accepted')
  const outsideOwnerBudget = a.updateAgent(delegated, 'you', { mealBudget: 40 })
  assert.equal(a.reviewProposal(outsideOwnerBudget, p.id, 'accept', 'member-1'), outsideOwnerBudget)
})

test('revoking delegation after a confirmed decision does not silently rewrite the existing plan', () => {
  const trip = fixture(), p = proposal(trip)
  const accepted = a.reviewProposal(trip, p.id, 'accept')
  const beforeDays = JSON.stringify(accepted.days)
  const revoked = a.updateAgent(accepted, 'member-3', { autoApproveReunion: false, shareAvailability: false })
  assert.equal(JSON.stringify(revoked.days), beforeDays)
  assert.equal(proposal(revoked).status, 'accepted')
  assert.equal(a.approvalState(revoked, proposal(revoked)).ready, true)
})

test('private fields do not grant automatic consent or leak into constraint explanations', () => {
  const trip = a.updateAgent(fixture(), 'member-3', { shareAvailability: false, shareArea: false, shareBudget: false, availableFrom: '23:45', area: 'Secret office', mealBudget: 1 })
  const state = a.approvalState(trip, proposal(trip))
  assert.equal(state.ready, false)
  assert.deepEqual(state.waiting, ['member-3'])
  assert.equal(JSON.stringify(state).includes('Secret office'), false)
  assert.equal(JSON.stringify(state).includes('23:45'), false)
  assert.equal(a.reviewProposal(trip, proposal(trip).id, 'accept').days[1].stops.some(s => s.proposalId), false)
})

test('outside budget or arrival bounds prevents confirmation and leaves all stops unchanged', () => {
  const cases = [
    a.updateAgent(fixture(), 'member-2', { mealBudget: 50 }),
    a.ensureProposal(fixture(), 'reunion', '18:30'),
  ]
  for (const trip of cases) {
    const p = proposal(trip), state = a.approvalState(trip, p)
    assert.equal(state.ready, false)
    assert.ok(state.reasons.length)
    assert.equal(a.reviewProposal(trip, p.id, 'accept'), trip)
  }
})

test('time and permission changes invalidate pending approvals without altering accepted plans', () => {
  let trip = a.updateAgent(fixture(), 'member-1', { autoApproveReunion: false })
  trip = a.reviewProposal(trip, proposal(trip).id, 'accept', 'member-1')
  assert.ok(proposal(trip).approvedBy.includes('member-1'))
  trip = a.ensureProposal(trip, 'reunion', '19:30')
  assert.deepEqual(proposal(trip).approvedBy, [])
  trip = a.reviewProposal(trip, proposal(trip).id, 'accept', 'member-1')
  trip = a.updateAgent(trip, 'member-1', { shareArea: false })
  assert.equal(proposal(trip).approvedBy.includes('member-1'), false)
  const accepted = a.reviewProposal(fixture(), proposal(fixture()).id, 'accept')
  assert.equal(a.ensureProposal(accepted, 'reunion', '19:30'), accepted)
})

test('museum needs individual group consent and moves the actual original visit atomically', () => {
  let trip = fixture(), p = proposal(trip, 'museum')
  assert.equal(p.day, 4)
  assert.equal(p.time, '11:30')
  assert.deepEqual(a.approvalState(trip, p).waiting, ['member-1', 'member-2', 'member-3'])
  const original = trip.days[0].stops.find(s => s.id === 'tokyo-demo-museum-original')
  for (const member of trip.members.slice(1)) trip = a.reviewProposal(trip, p.id, 'accept', member.id)
  assert.equal(proposal(trip, 'museum').status, 'pending')
  trip = a.reviewProposal(trip, p.id, 'accept', 'you')
  assert.equal(proposal(trip, 'museum').status, 'accepted')
  assert.equal(trip.days[0].stops.some(s => s.id === original.id), false)
  assert.equal(trip.days[3].stops.find(s => s.id === original.id).time, '11:30')
  const restored = a.reviewProposal(trip, p.id, 'undo')
  assert.deepEqual(restored.days[0].stops.find(s => s.id === original.id), original)
  assert.equal(restored.days[3].stops.some(s => s.id === original.id), false)
})

test('museum fallback preserves a user commitment on the suggested Thursday', () => {
  const original = d.seedTokyo()
  original.days[3].stops = [d.makeStop('Private day trip', '09:00', 'activity', 540)]
  const trip = a.normalizeAgentTrip(original)
  assert.equal(proposal(trip, 'museum').day, 5)
  assert.deepEqual(trip.days[3], original.days[3])
})

test('declining leaves the plan intact and a stale edited museum proposal cannot apply', () => {
  const trip = fixture(), p = proposal(trip)
  assert.deepEqual(a.reviewProposal(trip, p.id, 'decline').days, trip.days)
  const removed = { ...trip, days: trip.days.map(day => ({ ...day, stops: day.stops.filter(s => s.id !== 'tokyo-demo-museum-original') })) }
  assert.equal(a.approvalState(removed, proposal(removed, 'museum')).ready, false)
  assert.equal(a.reviewProposal(removed, proposal(removed, 'museum').id, 'accept'), removed)
})

test('journey clock ignores browsed day, skips completed/elapsed stops and survives serialization', () => {
  const trip = fixture()
  assert.deepEqual(a.journeyNow(trip), { date: '2026-09-13', time: '09:00', day: 1, phase: 'before' })
  trip.demoPhase = 'during'; trip.activeDay = 7
  assert.deepEqual(a.journeyNow(trip), { date: '2026-09-15', time: '17:00', day: 2, phase: 'during' })
  assert.equal(a.nextJourneyStop(trip).day, 3)
  const confirmed = a.reviewProposal(trip, proposal(trip).id, 'accept')
  const restored = a.normalizeAgentTrip(JSON.parse(JSON.stringify(confirmed)))
  assert.equal(proposal(restored).status, 'accepted')
  assert.equal(a.nextJourneyStop(restored).day, 2)
  restored.days[1].stops.find(s => s.proposalId === proposal(restored).id).done = true
  assert.equal(a.nextJourneyStop(restored).day, 3)
})

test('a stale museum proposal cannot overwrite a completed, renamed or reassigned stop', () => {
  for (const change of [{ done: true }, { title: 'My replacement gallery' }, { cost: 70 }, { participantIds: ['you'] }]) {
    const trip = fixture(), p = proposal(trip, 'museum')
    Object.assign(trip.days[0].stops.find(s => s.id === 'tokyo-demo-museum-original'), change)
    const before = JSON.stringify(trip.days)
    assert.match(a.approvalState(trip, p).reasons.join(' '), /completed or edited/)
    for (const member of trip.members) assert.equal(a.reviewProposal(trip, p.id, 'accept', member.id), trip)
    assert.equal(JSON.stringify(trip.days), before)
  }
})

test('museum undo pauses when the original slot is occupied by a new plan', () => {
  let trip = fixture(), p = proposal(trip, 'museum')
  for (const member of trip.members) trip = a.reviewProposal(trip, p.id, 'accept', member.id)
  assert.equal(proposal(trip, 'museum').status, 'accepted')
  trip.days[0].stops.push(d.makeStop('New Monday commitment', '14:00', 'activity', 90))
  const before = JSON.stringify(trip.days)
  assert.equal(a.reviewProposal(trip, p.id, 'undo'), trip)
  assert.match(a.approvalState(trip, proposal(trip, 'museum')).reasons.join(' '), /previous time now conflicts/)
  assert.equal(JSON.stringify(trip.days), before)
})

test('invalid museum duration cannot pass an otherwise empty target slot', () => {
  for (const duration of [NaN, -10, 0, Infinity]) {
    const trip = fixture(), p = proposal(trip, 'museum')
    trip.days[0].stops.find(s => s.id === 'tokyo-demo-museum-original').duration = duration
    assert.equal(a.approvalState(trip, p).ready, false)
    assert.equal(a.reviewProposal(trip, p.id, 'accept'), trip)
  }
})
