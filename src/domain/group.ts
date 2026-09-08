import type { Trip, ChatMessage } from '../types/trips'
import { agentFor, ensureProposal, journeyNow, proposalFor } from './agents'
import { uid } from './trips'
import { isGentleRequest } from './assistant'

export type AgentMention = { id: string; label: string; memberId?: string; color?: string; detail: string }
export const agentMentions = (trip: Trip): AgentMention[] => [
  { id: 'vmax', label: 'V-MAX', detail: 'Your shared journey coordinator' },
  ...trip.members.map(m => ({ id: `agent:${m.id}`, memberId: m.id, label: m.id === 'you' ? 'Your Agent' : `${m.name}’s Agent`, color: m.color, detail: 'Answers only from shared information' })),
]
const normalized = (text: string) => text.toLowerCase().replaceAll('’', "'")
type MentionOccurrence = { option: AgentMention; start: number; end: number }
function mentionOccurrences(trip: Trip, text: string): MentionOccurrence[] {
  const value = normalized(text)
  const found: MentionOccurrence[] = []
  for (const option of agentMentions(trip)) {
    const labels = option.memberId === 'you' ? [option.label, "You's Agent"] : [option.label]
    for (const label of labels) {
      const token = `@${normalized(label)}`
      let index = value.indexOf(token)
      while (index >= 0) {
        const before = value[index - 1], after = value[index + token.length]
        if ((!before || /[\s([{,;:!?，。？！：；]/.test(before)) && (!after || /[\s)\]},?.!:;，。？！：；]/.test(after))) found.push({ option, start: index, end: index + token.length })
        index = value.indexOf(token, index + token.length)
      }
    }
  }
  return found.sort((a, b) => a.start - b.start || b.end - a.end)
}

export function mentionsIn(trip: Trip, text: string) {
  return [...new Map(mentionOccurrences(trip, text).map(mention => [mention.option.id, mention.option])).values()]
}

function questionsByAgent(trip: Trip, text: string) {
  const occurrences = mentionOccurrences(trip, text)
  const segments = occurrences.map((mention, index) => text.slice(mention.end, occurrences[index + 1]?.start))
  const questions = new Map<string, { option: AgentMention; questions: string[] }>()
  occurrences.forEach((mention, index) => {
    let endOfCluster = index
    // Adjacent tags share their following question; a real question ends the cluster.
    while (endOfCluster + 1 < segments.length && /^[\s,，:：;&+]*(?:(?:and|和|与)[\s,，:：;&+]*)?$/i.test(segments[endOfCluster])) endOfCluster++
    const question = segments[endOfCluster]
    const current = questions.get(mention.option.id) ?? { option: mention.option, questions: [] }
    if (!current.questions.includes(question)) current.questions.push(question)
    questions.set(mention.option.id, current)
  })
  return [...questions.values()].map(item => ({ option: item.option, question: item.questions.join('\n') }))
}

export function sendGroupMessage(trip: Trip, text: string): Trip {
  if (!text.trim()) return trip
  const { time, date } = journeyNow(trip)
  let next = trip
  const messages: ChatMessage[] = [{ id: uid(), sender: 'you', text: text.trim(), time, date }]
  const reply = (sender: string, content: string, extra: Partial<ChatMessage> = {}) => messages.push({ id: uid(), sender, text: content, time, date, ...extra })
  const requests = questionsByAgent(trip, text)
  const reunionIntent = (question: string) => /\b(?:dinner|sync|rejoin|meet)\b|晚餐|集合|聚餐/i.test(question)
  for (const { option, question } of requests) {
    if (!option.memberId) continue
    const availability = /free|availab|when|finish|meeting|meet|dinner|sync|rejoin|集合|空|几点|晚餐|开会|结束/i.test(question)
    const location = /where|area|location|work|office|address|哪里|地点|地址/i.test(question)
    const precise = /address|exact|room|floor|具体|地址/i.test(question)
    const budget = /budget|cost|price|afford|预算|多少钱/i.test(question)
    const p = agentFor(trip, option.memberId)
    const pieces: string[] = []
    if (precise) pieces.push('An exact address is not shared with this group. Please ask the member directly; I cannot disclose it.')
    else if (location) pieces.push(p.shareArea && p.area ? `Shared area: ${p.area}.` : 'Their area is private. I cannot share it without permission.')
    if (availability) pieces.push(p.shareAvailability && p.availableFrom ? `Shared availability: free from ${p.availableFrom}${trip.id === 'tokyo-demo' && trip.destination === 'tokyo' && trip.startDate === '2026-09-14' && trip.endDate === '2026-09-20' ? ' on Day 2' : ''}. This is not a booking confirmation.` : 'Availability has not been shared. Their confirmation is needed.')
    if (budget) pieces.push(p.shareBudget ? `Shared meal limit: MYR ${p.mealBudget} per person.` : 'Their budget is private.')
    if (!pieces.length) pieces.push('I can help with shared availability, an area or meal budget. Which would you like to check?')
    reply(option.id, pieces.join(' '))
  }
  if (requests.some(request => reunionIntent(request.question))) {
    next = ensureProposal(next, 'reunion')
    const proposal = proposalFor(next, 'reunion')
    reply('agent:you', proposal ? 'I can bring those shared constraints into one dinner proposal. Check the timing and permissions below; I won’t change anyone’s plan without approval.' : 'I don’t have a supported reunion scenario for this trip yet. You can add a shared meal in Plan and ask the group to confirm.', proposal ? { proposalId: proposal.id } : {})
  }
  const coordinator = requests.find(request => request.option.id === 'vmax')
  if (coordinator) {
    const question = coordinator.question
    let handled = reunionIntent(question)
    if (isGentleRequest(question)) {
      reply('vmax', `I can add a rest to Day ${trip.activeDay} and adjust later stops. Review the changes before applying them.`, { proposal: true, day: trip.activeDay })
      handled = true
    }
    if (/museum|closed|closure|博物馆|闭馆/i.test(question)) {
      next = ensureProposal(next, 'museum')
      const proposal = proposalFor(next, 'museum')
      reply('vmax', proposal ? 'Here is the source-backed demo suggestion for your museum visit. The group reviews it before the plan changes.' : 'There is no museum closure proposal in this trip. I haven’t performed a live opening-hours check.', proposal ? { proposalId: proposal.id } : {})
      handled = true
    }
    if (!handled) reply('vmax', 'Try asking about a dinner reunion, a gentler day, or the museum update. This prototype uses sample trip information, not live calendars.')
  }
  return { ...next, messages: [...next.messages, ...messages], readMessages: next.messages.length + messages.length }
}
