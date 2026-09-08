const { test } = require('node:test')
const assert = require('node:assert/strict')
const { travelDocuments } = require('../.test-build/domain/documents.js')
const { preparationFor } = require('../.test-build/domain/preparation.js')
const a = require('../.test-build/domain/assistant.js')
const d = require('../.test-build/domain/trips.js')

test('an unbooked shortlist does not increase missing travel-document or preparation counts', () => {
  const trip = d.seedTokyo()
  const saved = a.saveSampleFlight(trip, 'direct-light', 'KUL', true, true)
  assert.deepEqual(travelDocuments(saved), trip.documents)
  assert.deepEqual(preparationFor(saved), preparationFor(trip))
})

test('bounded assistant routes its supported tasks and refuses unrelated requests', () => {
  for (const [text, intent] of [
    ['Compare flights to Tokyo', 'flights'],
    ['Help us coordinate after Joshua’s meeting', 'coordinate'],
    ['Review the museum closure', 'museum'],
    ['Show my budget', 'budget'],
    ['Open the trip wallet', 'documents'],
    ['Show the route', 'map'],
    ['Get directions for my next stop', 'map'],
    ['Change my permissions', 'profile'],
    ['Make today gentler', 'gentler'],
    ['Plan a trip to Iceland', 'new-trip'],
    ['Open the group chat', 'group'],
    ['Show my itinerary', 'plan'],
    ['我要看登机牌', 'documents'],
    ['帮我协调大家开会后的集合', 'coordinate'],
    ['查看分账收据', 'budget'],
    ['', 'unsupported'],
    ['Tell me a story about dragons', 'unsupported'],
    ['Show my interests', 'profile'],
    ['Find restaurants', 'unsupported'],
    ['Delete every person and message', 'unsupported'],
  ]) assert.equal(a.assistantIntent(text), intent, text)
})

test('flight documents and expenses do not accidentally open flight comparison', () => {
  assert.equal(a.assistantIntent('Show my flight boarding pass'), 'documents')
  assert.equal(a.assistantIntent('Open our saved flight tickets'), 'documents')
  assert.equal(a.assistantIntent('Show our flight expenses'), 'budget')
  assert.equal(a.assistantIntent('Compare flights within my budget'), 'flights')
})

test('sample offers require the explicit supported origin and correct trip destination', () => {
  const trip = d.seedTokyo()
  const before = JSON.stringify(trip)
  assert.equal(a.sampleFlightOptions(trip, 'KUL', true, false).length, 3)
  for (const origin of ['', 'AUTO', 'HND', 'SIN', 'kul']) assert.deepEqual(a.sampleFlightOptions(trip, origin, true, false), [])
  for (const destination of ['iceland', 'kyoto', 'shanghai', 'unknown']) {
    assert.deepEqual(a.sampleFlightOptions({ ...trip, destination }, 'KUL', true, false), [])
  }
  assert.equal(JSON.stringify(trip), before)
})

test('flight totals include the selected baggage allowance and sort by group total', () => {
  const trip = d.seedTokyo()
  const withBag = a.sampleFlightOptions(trip, 'KUL', true, false)
  assert.deepEqual(withBag.map(f => f.id), ['one-stop', 'direct-light', 'direct-complete'])
  assert.deepEqual(withBag.map(f => f.perPerson), [1830, 2100, 2280])
  assert.deepEqual(withBag.map(f => f.total), [7320, 8400, 9120])
  const withoutBag = a.sampleFlightOptions(trip, 'KUL', false, false)
  assert.deepEqual(withoutBag.map(f => f.perPerson), [1650, 1840, 2280])
  assert.deepEqual(withoutBag.map(f => f.total), [6600, 7360, 9120])
  assert.equal(a.sampleFlightOptions({ ...trip, travellers: 1 }, 'KUL', true, false)[0].total, 1830)
})

test('direct-only excludes connections and cannot shortlist a hidden offer', () => {
  const trip = d.seedTokyo()
  const options = a.sampleFlightOptions(trip, 'KUL', true, true)
  assert.equal(options.length, 2)
  assert.ok(options.every(f => f.stops === 0))
  assert.deepEqual(options.map(f => f.id), ['direct-light', 'direct-complete'])
  assert.equal(a.saveSampleFlight(trip, 'one-stop', 'KUL', true, true), trip)
  assert.equal(a.saveSampleFlight(trip, 'unknown-offer', 'KUL', true, false), trip)
})

test('malformed party sizes and date ranges cannot produce misleading fares', () => {
  const trip = d.seedTokyo()
  for (const travellers of [NaN, Infinity, 0, -1, 1.5, 13]) {
    assert.deepEqual(a.sampleFlightOptions({ ...trip, travellers }, 'KUL', true, false), [])
  }
  for (const patch of [
    { startDate: 'not-a-date' },
    { startDate: '2026-02-30' },
    { endDate: '2026-09-01' },
    { endDate: '2026-12-01' },
  ]) assert.deepEqual(a.sampleFlightOptions({ ...trip, ...patch }, 'KUL', true, false), [])
})

test('shortlisting is explicit demo evidence, idempotent and never a booked ticket', () => {
  const trip = d.seedTokyo()
  trip.documents[0] = { ...trip.documents[0], ready: true, detail: 'My existing confirmed pass', sample: false }
  const before = JSON.stringify(trip)
  const saved = a.saveSampleFlight(trip, 'direct-light', 'KUL', true, true)
  const shortlist = saved.documents.find(doc => doc.id === a.FLIGHT_SHORTLIST_ID)
  assert.equal(JSON.stringify(trip), before)
  assert.equal(shortlist.ready, false)
  assert.equal(shortlist.sample, true)
  assert.match(shortlist.detail, /DEMO · NOT BOOKED/)
  assert.match(shortlist.detail, /KUL → NRT/)
  assert.match(shortlist.detail, /2026-09-14–2026-09-20/)
  assert.match(shortlist.detail, /MYR 2100 per person \/ MYR 8400 group total/)
  assert.match(shortlist.detail, /not live inventory/)
  assert.equal(saved.documents.length, trip.documents.length + 1)
  assert.deepEqual(saved.documents.filter(doc => doc.id !== a.FLIGHT_SHORTLIST_ID), trip.documents)
  assert.equal(saved.expenses, trip.expenses)
  assert.equal(saved.days, trip.days)
  assert.equal(saved.checklist, trip.checklist)
  assert.equal(saved.messages, trip.messages)
  assert.equal(saved.readMessages, trip.readMessages)
  assert.equal(d.tripSpent(saved), d.tripSpent(trip))
  assert.equal(a.saveSampleFlight(saved, 'direct-light', 'KUL', true, true), saved)
})

test('changing shortlist updates one document without overwriting other passes', () => {
  const trip = d.seedTokyo()
  const first = a.saveSampleFlight(trip, 'direct-light', 'KUL', true, false)
  const second = a.saveSampleFlight(first, 'direct-complete', 'KUL', false, true)
  assert.equal(second.documents.filter(doc => doc.id === a.FLIGHT_SHORTLIST_ID).length, 1)
  assert.match(second.documents.find(doc => doc.id === a.FLIGHT_SHORTLIST_ID).detail, /KUL → HND/)
  assert.deepEqual(second.documents.filter(doc => doc.id !== a.FLIGHT_SHORTLIST_ID), trip.documents)
  assert.deepEqual(second.expenses, trip.expenses)
})

test('resaving a modified sample shortlist restores its unbooked metadata, not other passes', () => {
  const trip = d.seedTokyo()
  trip.documents[0] = { ...trip.documents[0], ready: true, sample: false, detail: 'Actual pass retained' }
  const saved = a.saveSampleFlight(trip, 'direct-light', 'KUL', true, true)
  const edited = { ...saved, documents: saved.documents.map(doc => doc.id === a.FLIGHT_SHORTLIST_ID ? { ...doc, title: 'Ticket', ready: true, sample: false } : doc) }
  const corrected = a.saveSampleFlight(edited, 'direct-light', 'KUL', true, true)
  const shortlist = corrected.documents.find(doc => doc.id === a.FLIGHT_SHORTLIST_ID)
  assert.equal(shortlist.title, 'Flight shortlist')
  assert.equal(shortlist.ready, false)
  assert.equal(shortlist.sample, true)
  assert.deepEqual(corrected.documents.filter(doc => doc.id !== a.FLIGHT_SHORTLIST_ID), trip.documents)
  assert.equal(corrected.expenses, trip.expenses)
  assert.equal(a.saveSampleFlight(corrected, 'direct-light', 'KUL', true, true), corrected)
})

test('a shortlist belongs only to the trip and route selected for that action', () => {
  const trip = d.seedTokyo()
  const otherTokyo = d.createTrip({ ...d.DEFAULT_PREFERENCES, destination: 'tokyo', startDate: '2026-11-10', endDate: '2026-11-14', travellers: 2, budgetPerPerson: 4000 })
  const otherBefore = JSON.stringify(otherTokyo)
  a.saveSampleFlight(trip, 'direct-light', 'KUL', true, true)
  assert.equal(JSON.stringify(otherTokyo), otherBefore)
  const savedOther = a.saveSampleFlight(otherTokyo, 'direct-light', 'KUL', true, true)
  const detail = savedOther.documents.find(doc => doc.id === a.FLIGHT_SHORTLIST_ID).detail
  assert.match(detail, /2026-11-10–2026-11-14/)
  assert.match(detail, /2 travellers/)
  assert.match(detail, /MYR 4200 group total/)
  assert.equal(a.saveSampleFlight(trip, 'direct-light', 'SIN', true, true), trip)
  const nonTokyo = { ...trip, destination: 'iceland' }
  assert.equal(a.saveSampleFlight(nonTokyo, 'direct-light', 'KUL', true, true), nonTokyo)
})
