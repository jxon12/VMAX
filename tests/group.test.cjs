const { test } = require('node:test')
const assert = require('node:assert/strict')
const g = require('../.test-build/domain/group.js')
const a = require('../.test-build/domain/agents.js')
const d = require('../.test-build/domain/trips.js')
const fixture = () => a.normalizeAgentTrip(d.seedTokyo())
const replies = (before, after) => after.messages.slice(before.messages.length).filter(message => message.sender !== 'you')

test('one chat message can mention multiple member Agents and each replies once', () => {
  const trip = fixture()
  const text = '@Louise’s Agent @Joshua\'s Agent when are you free?'
  assert.deepEqual(g.mentionsIn(trip, text).map(m => m.memberId).sort(), ['member-1', 'member-3'])
  const after = g.sendGroupMessage(trip, text)
  assert.deepEqual(replies(trip, after).map(m => m.sender).sort(), ['agent:member-1', 'agent:member-3'])
  assert.match(replies(trip, after)[0].text, /18:00/)
  assert.match(replies(trip, after)[1].text, /18:15/)
})

test('separate mentioned Agents answer their own questions without borrowing another intent', () => {
  const trip = fixture()
  const after = g.sendGroupMessage(trip, '@Your Agent what is my meal budget? @Joshua’s Agent where are you working?')
  const messages = replies(trip, after)
  const own = messages.find(m => m.sender === 'agent:you').text
  const joshua = messages.find(m => m.sender === 'agent:member-3').text
  assert.match(own, /Shared meal limit: MYR 120/)
  assert.doesNotMatch(own, /Shared area:|Shared availability:/)
  assert.match(joshua, /Shared area: Marunouchi/)
  assert.doesNotMatch(joshua, /meal limit|Shared availability:/)
})

test('one Agent’s exact-address request does not change another Agent’s budget answer', () => {
  const trip = fixture()
  const after = g.sendGroupMessage(trip, '@Louise’s Agent what can you afford? @Joshua’s Agent what is your exact office address?')
  const messages = replies(trip, after)
  assert.match(messages.find(m => m.sender === 'agent:member-1').text, /Shared meal limit:/)
  assert.doesNotMatch(messages.find(m => m.sender === 'agent:member-1').text, /exact address/)
  assert.match(messages.find(m => m.sender === 'agent:member-3').text, /exact address is not shared/i)
})

test('V-MAX retains its own museum question when another Agent is asked about dinner', () => {
  const trip = fixture()
  const after = g.sendGroupMessage(trip, '@V-MAX is the museum closed? @Joshua’s Agent when can we meet for dinner?')
  const messages = replies(trip, after)
  assert.ok(messages.some(m => m.sender === 'vmax' && m.proposalId === a.proposalFor(after, 'museum').id))
  assert.ok(messages.some(m => m.sender === 'agent:you' && m.proposalId === a.proposalFor(after, 'reunion').id))
})

test('Your Agent and You’s Agent aliases address the same owner', () => {
  const trip = fixture()
  for (const text of ['@Your Agent when am I free?', '@You’s Agent when am I free?', "@You's Agent when am I free?"]) {
    assert.deepEqual(g.mentionsIn(trip, text).map(m => m.memberId), ['you'])
    assert.equal(replies(trip, g.sendGroupMessage(trip, text))[0].sender, 'agent:you')
  }
})

test('a valid mention is recognized after an earlier invalid token but substrings never tag', () => {
  const trip = fixture()
  assert.deepEqual(g.mentionsIn(trip, '@Your Agentless is not a tag'), [])
  assert.equal(g.mentionsIn(trip, '@Your Agentless then @Your Agent, when am I free?')[0].memberId, 'you')
  const after = g.sendGroupMessage(trip, '@Your Agentless then @Your Agent, when am I free?')
  assert.match(replies(trip, after)[0].text, /Shared availability: free from 18:00/)
})

test('private availability, area and budget never appear in the group reply', () => {
  const trip = a.updateAgent(fixture(), 'member-3', { shareAvailability: false, shareArea: false, shareBudget: false, area: 'Private office 987', availableFrom: '23:45', mealBudget: 777 })
  const after = g.sendGroupMessage(trip, '@Joshua’s Agent where are you, when free, and what budget?')
  const text = replies(trip, after).map(m => m.text).join(' ')
  assert.doesNotMatch(text, /Private office|987|23:45|777/)
  assert.match(text, /private/)
  assert.match(text, /not been shared/)
})

test('exact address requests are refused even when a general area is shared', () => {
  const trip = a.updateAgent(fixture(), 'member-3', { shareArea: true, area: 'Marunouchi' })
  const after = g.sendGroupMessage(trip, '@Joshua’s Agent what is the exact office address?')
  const text = replies(trip, after).map(m => m.text).join(' ')
  assert.match(text, /exact address is not shared/i)
  assert.doesNotMatch(text, /Shared area:/)
})

test('missing owner availability produces no invented free time or false calendar check', () => {
  const trip = a.updateAgent(fixture(), 'you', { shareAvailability: true, availableFrom: '' })
  const after = g.sendGroupMessage(trip, '@Your Agent when am I free?')
  const text = replies(trip, after).map(m => m.text).join(' ')
  assert.match(text, /has not been shared/)
  assert.doesNotMatch(text, /free from|checked.*calendar/i)
})

test('unsupported trips never inherit Tokyo meetings, reunion proposals, or Day 2 availability', () => {
  let trip = d.createTrip({ ...d.DEFAULT_PREFERENCES, destination: 'shanghai', startDate: '2026-09-14', endDate: '2026-09-20', travellers: 2, budgetPerPerson: 1000 })
  trip.id = 'tokyo-demo'
  trip = a.updateAgent(a.normalizeAgentTrip(trip), 'you', { shareAvailability: true, availableFrom: '17:00' })
  const after = g.sendGroupMessage(trip, '@Your Agent when am I free for dinner?')
  const text = replies(trip, after).map(m => m.text).join(' ')
  assert.doesNotMatch(text, /Shinjuku|Marunouchi|Day 2/)
  assert.equal(after.proposals.length, 0)
  assert.match(text, /supported reunion scenario/)
})

test('agent coordination offers a proposal without committing or booking anything', () => {
  const trip = fixture()
  const after = g.sendGroupMessage(trip, '@Joshua’s Agent when can we meet for dinner?')
  const message = replies(trip, after).find(m => m.proposalId)
  assert.equal(message.proposalId, a.proposalFor(after, 'reunion').id)
  assert.equal(a.proposalFor(after, 'reunion').status, 'pending')
  assert.deepEqual(after.days, trip.days)
  assert.deepEqual(after.expenses, trip.expenses)
})

test('a work meeting question does not invent a request for dinner coordination', () => {
  const trip = fixture()
  const after = g.sendGroupMessage(trip, '@Joshua’s Agent when does your meeting finish?')
  const messages = replies(trip, after)
  assert.equal(messages.length, 1)
  assert.equal(messages[0].sender, 'agent:member-3')
  assert.match(messages[0].text, /Shared availability:/)
  assert.equal(messages[0].proposalId, undefined)
  assert.deepEqual(after.proposals, trip.proposals)
})

test('mention boundaries reject embedded strings and support parentheses', () => {
  const trip = fixture()
  assert.deepEqual(g.mentionsIn(trip, 'not@Your Agent when free?'), [])
  assert.deepEqual(g.mentionsIn(trip, '(@Your Agent) when am I free?').map(m => m.memberId), ['you'])
  assert.equal(replies(trip, g.sendGroupMessage(trip, 'not@Your Agent dinner?')).length, 0)
})
