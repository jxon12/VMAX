const { test } = require('node:test')
const assert = require('node:assert/strict')
const p = require('../.test-build/domain/profile.js')
const t = require('../.test-build/domain/trips.js')
const a = require('../.test-build/domain/agents.js')

const fixture = () => ({ version: 2, trips: [a.normalizeAgentTrip(t.seedTokyo())], savedIds: ['iceland-aurora'], preferences: t.DEFAULT_PREFERENCES })
const details = { displayName: 'Alex', email: 'alex@example.com', departureAirport: 'KUL' }

test('legacy storage gets an additive guest profile without changing any journeys or saved data', () => {
  const previous = fixture()
  previous.extraFutureField = { retained: true }
  const snapshot = JSON.stringify(previous)
  const migrated = p.withLocalProfile(previous)
  assert.deepEqual(migrated.profile, p.emptyProfile())
  assert.equal(migrated.trips, previous.trips)
  assert.equal(migrated.savedIds, previous.savedIds)
  assert.equal(migrated.preferences, previous.preferences)
  assert.equal(migrated.extraFutureField, previous.extraFutureField)
  assert.equal(JSON.stringify(previous), snapshot)
  assert.deepEqual(p.withLocalProfile(migrated), migrated)
})

test('a previous explicit local owner name is retained without renaming another member', () => {
  const previous = fixture()
  previous.trips[0].members[0].name = 'My local name'
  const migrated = p.withLocalProfile(previous)
  assert.equal(migrated.profile.displayName, 'My local name')
  assert.equal(migrated.profile.session, 'guest')
  assert.equal(migrated.trips, previous.trips)
  const noOwner = { ...previous, trips: [{ ...previous.trips[0], members: previous.trips[0].members.slice(1) }] }
  assert.equal(p.withLocalProfile(noOwner).profile.displayName, '')
})

test('malformed optional profile fields cannot invalidate journey data or invent verified login', () => {
  for (const malformed of [null, [], 'account', { displayName: 42, email: 'invalid', departureAirport: 'TOKYO', session: 'demo' }, { ...details, session: 'authenticated', token: 'not-a-real-token' }]) {
    const previous = { ...fixture(), profile: malformed }
    const migrated = p.withLocalProfile(previous)
    assert.equal(migrated.trips, previous.trips)
    assert.equal(migrated.profile.session, 'guest')
    assert.equal(migrated.profile.token, undefined)
  }
})

test('saving normalizes profile fields and changes only owner display names, not IDs or trip content', () => {
  const previous = fixture()
  const trip = previous.trips[0]
  const before = JSON.stringify(previous)
  const changed = p.saveLocalProfile(previous, { displayName: '  Alex   Lee  ', email: ' ALEX@EXAMPLE.COM ', departureAirport: ' kul ' })
  assert.deepEqual(changed.profile, { displayName: 'Alex Lee', email: 'alex@example.com', departureAirport: 'KUL', session: 'guest' })
  assert.equal(changed.trips[0].members[0].id, 'you')
  assert.equal(changed.trips[0].members[0].name, 'Alex Lee')
  assert.equal(changed.trips[0].members[0].agent, trip.members[0].agent)
  for (let index = 1; index < trip.members.length; index++) assert.equal(changed.trips[0].members[index], trip.members[index])
  for (const key of ['days', 'messages', 'proposals', 'expenses', 'documents', 'checklist']) assert.equal(changed.trips[0][key], trip[key])
  assert.equal(JSON.stringify(previous), before)
  assert.equal(JSON.stringify(changed.trips).includes('alex@example.com'), false)
  assert.equal(JSON.stringify(changed.trips).includes('KUL'), false)
})

test('optional email and airport can stay blank but malformed fields are rejected', () => {
  assert.deepEqual(p.profileErrors({ displayName: 'A', email: '', departureAirport: '' }), {})
  assert.ok(p.profileErrors({ displayName: '', email: '', departureAirport: '' }).displayName)
  assert.ok(p.profileErrors({ ...details, displayName: 'A'.repeat(41) }).displayName)
  assert.ok(p.profileErrors({ ...details, email: 'not-an-email' }).email)
  assert.ok(p.profileErrors({ ...details, departureAirport: '123' }).departureAirport)
  assert.ok(p.profileErrors({ ...details, departureAirport: 'TOKYO' }).departureAirport)
  const previous = fixture()
  const snapshot = JSON.stringify(previous)
  assert.throws(() => p.saveLocalProfile(previous, { ...details, email: 'invalid' }), /Check your personal details/)
  assert.equal(JSON.stringify(previous), snapshot)
})

test('starting a local demo needs valid name and email and never produces auth credentials', () => {
  const guest = p.withLocalProfile(fixture())
  assert.equal(p.setLocalDemoSession(guest, true).profile.session, 'guest')
  const prepared = p.saveLocalProfile(guest, details)
  const signedIn = p.setLocalDemoSession(prepared, true)
  assert.equal(signedIn.profile.session, 'demo')
  assert.deepEqual(Object.keys(signedIn.profile).sort(), ['departureAirport', 'displayName', 'email', 'session'])
  assert.equal(signedIn.trips, prepared.trips)
  assert.equal(prepared.profile.session, 'guest')
})

test('sign-out keeps personal details, journey records and Agent permissions exactly as they were', () => {
  const signedIn = p.setLocalDemoSession(p.saveLocalProfile(fixture(), details), true)
  const signedOut = p.setLocalDemoSession(signedIn, false)
  assert.deepEqual(signedOut.profile, { ...details, session: 'guest' })
  assert.equal(signedOut.trips, signedIn.trips)
  assert.equal(signedOut.savedIds, signedIn.savedIds)
  assert.equal(signedOut.preferences, signedIn.preferences)
  assert.equal(signedIn.profile.session, 'demo')
})

test('changing an email ends the demo session while a name-only edit keeps its local status', () => {
  const signedIn = p.setLocalDemoSession(p.saveLocalProfile(fixture(), details), true)
  assert.equal(p.saveLocalProfile(signedIn, { ...details, displayName: 'Alex Lee' }).profile.session, 'demo')
  const changed = p.saveLocalProfile(signedIn, { ...details, email: 'another@example.com' })
  assert.equal(changed.profile.session, 'guest')
  assert.equal(changed.profile.email, 'another@example.com')
  assert.equal(changed.trips[0].days, signedIn.trips[0].days)
})

test('future trips use the same local owner name without creating or claiming other members', () => {
  const trip = fixture().trips[0]
  const named = p.nameLocalOwner(trip, 'Alex')
  assert.equal(named.members[0].name, 'Alex')
  assert.equal(p.nameLocalOwner(named, 'Alex'), named)
  assert.equal(p.nameLocalOwner(trip, ''), trip)
  const noOwner = { ...trip, members: trip.members.slice(1) }
  assert.equal(p.nameLocalOwner(noOwner, 'Alex'), noOwner)
})

test('profile and local session survive a serialisation round trip without changes to journeys', () => {
  const signedIn = p.setLocalDemoSession(p.saveLocalProfile(fixture(), details), true)
  const restored = p.withLocalProfile(JSON.parse(JSON.stringify(signedIn)))
  assert.deepEqual(restored, signedIn)
})
