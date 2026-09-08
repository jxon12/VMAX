import { useEffect, useRef, useState } from 'react'
import type { ChatMessage, Trip } from '../../types/trips'
import { formatDate } from '../../domain/trips'
import { agentFor, journeyNow } from '../../domain/agents'
import { agentMentions, sendGroupMessage, type AgentMention } from '../../domain/group'
import { Icon } from '../ui/Icon'
import { Orb } from '../ui/Orb'
import { BottomSheet } from '../ui/BottomSheet'
import { JourneyProposalCard } from './JourneyProposalCard'
import '../../styles/agent-experience.css'

type Props = { trip: Trip; onUpdate: (update: (trip: Trip) => Trip) => void; onReview: (day: number) => void; onPlan?: (day: number) => void }

export function JourneyGroupChat({ trip, onUpdate, onReview, onPlan }: Props) {
  const [draft, setDraft] = useState('')
  const [caret, setCaret] = useState(0)
  const [dismissed, setDismissed] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const [membersOpen, setMembersOpen] = useState(false)
  const [decisionId, setDecisionId] = useState<string | null>(null)
  const [decisionListOpen, setDecisionListOpen] = useState(false)
  const [call, setCall] = useState(false)
  const [copied, setCopied] = useState('')
  const end = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const options = agentMentions(trip)
  const before = draft.slice(0, caret)
  const at = before.lastIndexOf('@')
  const query = at >= 0 ? before.slice(at + 1) : ''
  const complete = options.some(o => query.toLowerCase().startsWith(o.label.toLowerCase() + ' '))
  const filtered = options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
  const mentionOpen = at >= 0 && !dismissed && !complete && !/[,.!?\n]/.test(query) && query.length < 45
  const now = journeyNow(trip)
  const history=trip.messages.filter(m=>!m.date)
  const conversation=trip.messages.filter(m=>m.date)
  const pending = trip.proposals?.filter(p => p.status === 'pending' && (now.phase === 'during' || p.kind === 'museum')) ?? []
  useEffect(() => { end.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }) }, [trip.messages.length])
  const chooseMention = (option: AgentMention) => {
    const position = Math.max(0, at)
    const replacement = '@' + option.label + ' '
    const value = draft.slice(0, position) + replacement + draft.slice(caret)
    setDraft(value); setCaret(position + replacement.length); setDismissed(true); setHighlight(0)
    requestAnimationFrame(() => { input.current?.focus(); input.current?.setSelectionRange(position + replacement.length, position + replacement.length) })
  }
  const openMentions = () => {
    const position = input.current?.selectionStart ?? draft.length
    const prefix = position && draft[position - 1] !== ' ' ? ' @' : '@'
    setDraft(draft.slice(0, position) + prefix + draft.slice(position)); setCaret(position + prefix.length); setDismissed(false); setHighlight(0)
    requestAnimationFrame(() => { input.current?.focus(); input.current?.setSelectionRange(position + prefix.length, position + prefix.length) })
  }
  const send = () => {
    if (!draft.trim()) return
    onUpdate(t => sendGroupMessage(t, draft)); setDraft(''); setCaret(0); setDismissed(true)
  }
  const suggest = (value: string) => { setDraft(value); setCaret(value.length); setDismissed(true); input.current?.focus() }
  const renderMessage = (message: ChatMessage) => {
    const member = trip.members.find(m => m.id === message.sender)
    const agentMember = trip.members.find(m => 'agent:' + m.id === message.sender)
    const mine = message.sender === 'you'
    const ai = message.sender === 'vmax' || !!agentMember
    const label = message.sender === 'vmax' ? 'V-MAX' : agentMember ? agentMember.id === 'you' ? 'Your Agent' : agentMember.name + '’s Agent' : member?.name ?? 'Traveller'
    const proposal = trip.proposals?.find(p => p.id === message.proposalId)
    const legacy = !proposal && /checked the other agents|Synced with all four/i.test(message.text)
    return <div key={message.id} className={`j-message ${mine ? 'mine' : ''} ${ai ? 'ai' : ''}`}>
      {!mine && (message.sender === 'vmax' ? <span className="j-avatar-orb"><Orb/></span> : <span className={agentMember ? 'jr-agent-avatar' : 'j-avatar'} style={{ background: (agentMember ?? member)?.color }}>{(agentMember ?? member)?.name[0] ?? '?'}{agentMember && <i/>}</span>)}
      <div className="j-message-bubble"><small>{label}<time>{message.date?formatDate(message.date)+' · ':''}{message.time}</time></small><p>{message.text}</p>
        {legacy && <span className="agent-legacy-note">Earlier preview · not a confirmed itinerary change</span>}
        {message.proposal && <button className="j-secondary" onClick={() => onReview(message.day ?? trip.activeDay)}>Review Day {message.day ?? trip.activeDay}</button>}
        {proposal && <button className="agent-chat-link" onClick={() => setDecisionId(proposal.id)}><Icon name={proposal.status === 'accepted' ? 'check' : 'calendar'} size={15}/>{proposal.status === 'accepted' ? 'Applied · review decision' : proposal.status === 'declined' ? 'Not applied · view decision' : 'Review shared proposal'}<Icon name="arrow" size={15}/></button>}
      </div>
    </div>
  }
  const visibleProposalIds = new Set([...pending.map(p => p.id), ...trip.messages.map(m => m.proposalId).filter(Boolean)])
  const proposals = trip.proposals?.filter(p => visibleProposalIds.has(p.id)).sort((a,b) => Number(b.status === 'pending') - Number(a.status === 'pending') || Number(b.kind === (now.phase === 'during' ? 'reunion' : 'museum')) - Number(a.kind === (now.phase === 'during' ? 'reunion' : 'museum'))) ?? []
  const decision = trip.proposals?.find(p => p.id === decisionId)
  return <section className="j-group jr-group agent-group jg-group">
    <div className="j-section-heading"><div><h2>Group chat</h2><button className="j-text-button" onClick={() => setMembersOpen(true)}>{trip.members.length} people · {trip.members.length} personal Agents <Icon name="chevron" size={12}/></button></div><button className="j-icon-button" aria-label="Preview voice call" onClick={() => setCall(true)}><Icon name="phone" size={20}/></button></div>
    <div className="jg-chat-tools"><button onClick={openMentions}><i>@</i> Ask an Agent</button>{proposals.length > 0 && <button className="jg-decisions-trigger" aria-label="Review shared decisions" onClick={() => setDecisionListOpen(true)}><Icon name="calendar" size={15}/>{pending.length ? pending.length+' to review' : 'Decisions'}<Icon name="chevron" size={12}/></button>}</div>
    <div className="j-message-list" role="log" aria-label="Group messages" aria-live="polite">{history.length>0&&<details className="agent-chat-history"><summary>Earlier prototype messages · {history.length}</summary>{history.map(renderMessage)}</details>}{conversation.length?conversation.map(renderMessage):<p className="agent-conversation-welcome">Your people, their Agents, one shared conversation. Ask a question below to begin.</p>}<div ref={end}/></div>
    <div className="agent-chat-suggestions">{trip.members.length > 1 && <button onClick={() => suggest('@' + options[options.length - 1].label + ', when are you free to meet for dinner?')}>Find a time to reunite <Icon name="arrow" size={14}/></button>}<button onClick={() => suggest('@Your Agent, what is my shared availability and budget?')}>What can my Agent share?</button></div>
    <div className="j-chat-composer jr-chat-composer">
      {mentionOpen && <div className="jr-mention-menu" role="listbox" id="agent-mentions" aria-label="Mention an agent"><div><strong>Mention an Agent</strong><small>Only authorised information is shared</small></div>{filtered.length ? filtered.map((option,i) => <button id={`mention-option-${i}`} key={option.id} role="option" aria-selected={i === highlight} onMouseDown={e => e.preventDefault()} onClick={() => chooseMention(option)}>{option.id === 'vmax' ? <span className="j-avatar-orb"><Orb/></span> : <span className="jr-agent-avatar" style={{ background: option.color }}>{option.label[0]}<i/></span>}<span><strong>{option.label}</strong><small>{option.detail}</small></span></button>) : <p>No matching Agent</p>}</div>}
      <form onSubmit={e => { e.preventDefault(); send() }}><button type="button" className="jr-at-button" aria-label="Mention an agent" onClick={openMentions}>@</button><input ref={input} aria-label="Message the group" role="combobox" aria-autocomplete="list" aria-expanded={mentionOpen} aria-controls={mentionOpen ? 'agent-mentions' : undefined} aria-activedescendant={mentionOpen && filtered.length ? `mention-option-${Math.min(highlight,filtered.length - 1)}` : undefined} placeholder="Message or @ an Agent…" value={draft} maxLength={2000} onSelect={e => setCaret(e.currentTarget.selectionStart ?? 0)} onChange={e => { setDraft(e.target.value); setCaret(e.target.selectionStart ?? e.target.value.length); setDismissed(false); setHighlight(0) }} onKeyDown={e => { if (e.key === 'Escape') setDismissed(true); if (mentionOpen && filtered.length) { if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); setHighlight(i => (i + (e.key === 'ArrowDown' ? 1 : filtered.length - 1)) % filtered.length) } if (e.key === 'Enter') { e.preventDefault(); chooseMention(filtered[Math.min(highlight,filtered.length - 1)]) } } }}/><button aria-label="Send message" className="j-send" disabled={!draft.trim()}><Icon name="arrow"/></button></form>
    </div>
    <p className="j-demo-label">Sample conversation · no live messages or calls</p>
    {decisionListOpen && <BottomSheet label="Shared decisions" className="j-sheet" onDismiss={() => setDecisionListOpen(false)}><header><h2>A plan we agree on.</h2><button aria-label="Close shared decisions" onClick={() => setDecisionListOpen(false)}><Icon name="close"/></button></header><p className="j-muted">Review a suggestion, or revisit a choice you made together.</p>{proposals.map(p => <button className="agent-decision-row" key={p.id} onClick={() => { setDecisionListOpen(false); setDecisionId(p.id) }}><span className="agent-mini-orb"><Orb/></span><span><strong>{p.kind === 'reunion' ? 'A time to reunite' : 'Your museum update'}</strong><small>{p.status === 'accepted' ? 'Applied to Plan · view decision' : p.status === 'declined' ? 'Current plan kept' : 'Review together · your choice'}</small></span><Icon name={p.status === 'accepted' ? 'check' : 'arrow'} size={17}/></button>)}</BottomSheet>}
    {decision && <BottomSheet label="Shared group decision" className="j-sheet agent-decision-sheet" onDismiss={() => setDecisionId(null)}><header><h2>One decision, together.</h2><button aria-label="Close shared decision" onClick={() => setDecisionId(null)}><Icon name="close"/></button></header><JourneyProposalCard trip={trip} proposal={decision} onUpdate={onUpdate} onPlan={onPlan ? day => { setDecisionId(null); onPlan(day) } : undefined}/></BottomSheet>}
    {membersOpen && <BottomSheet label="Group members and sharing" className="j-sheet" onDismiss={() => setMembersOpen(false)}><header><h2>Shared, on their terms.</h2><button aria-label="Close members" onClick={() => setMembersOpen(false)}><Icon name="close"/></button></header><p className="fine-print">These are sample member permissions. Only your own Agent can be edited in Profile; real members would control their own access.</p>{trip.members.map(member => { const p = agentFor(trip, member.id); return <div className="agent-member-permissions" key={member.id}><span className="j-avatar" style={{ background: member.color }}>{member.name[0]}</span><span><strong>{member.name}</strong><small>{p.shareAvailability ? 'Availability shared' : 'Availability private'} · {p.shareArea ? 'Area shared' : 'Area private'}</small><small>{p.autoApproveReunion ? 'May approve reunions within shared limits' : 'Confirms changes personally'}</small></span></div> })}<button className="j-secondary" onClick={async () => { try { await navigator.clipboard.writeText(`${trip.city} · ${trip.startDate} to ${trip.endDate} · ${trip.travellers} travellers. V-MAX prototype summary, not a join link.`); setCopied('Summary copied. This is not an invitation link.') } catch { setCopied('Clipboard unavailable. The trip dates are shown above.') } }}>Copy trip summary</button><p className="fine-print" role="status">{copied}</p></BottomSheet>}
    {call && <BottomSheet label="Voice call preview" className="j-sheet j-call" onDismiss={() => setCall(false)}><p className="j-eyebrow">VOICE CALL · PREVIEW</p><h2>A little closer, together.</h2><p>A group call with V-MAX alongside.</p><div className="j-call-avatars">{trip.members.map(m => <span key={m.id} className="j-avatar" style={{ background: m.color }}>{m.name[0]}</span>)}</div><p className="fine-print">No microphone is active and no one is connected. Live calls are outside this prototype.</p><button className="j-secondary" onClick={() => { setCall(false); suggest('@V-MAX, make this day gentler') }}>Ask V-MAX in chat</button><button className="j-end-call" onClick={() => setCall(false)}>Close preview</button></BottomSheet>}
  </section>
}
