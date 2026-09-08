import type { Trip } from '../../types/trips'
import { journeyNow } from '../../domain/agents'
import { useEffect, useState, type RefObject } from 'react'
import type { OrbPhase } from '../../hooks/useOrbTransition'
import { BottomSheet } from '../ui/BottomSheet'
import { Icon } from '../ui/Icon'
import { Orb } from '../ui/Orb'
import { LensSurface } from '../ui/LensSurface'
import { AgentTaskWorkspace } from './AgentTaskWorkspace'
import { assistantIntent, type AssistantAction } from '../../domain/assistant'
import '../../styles/assistant-lens.css'
import '../../styles/agent-workspace.css'

type VMaxAssistantSheetProps = {
  phase: Exclude<OrbPhase, 'idle'>
  orbRef: RefObject<HTMLSpanElement | null>
  orbGhost: boolean
  initialView: 'demo' | 'assistant'
  onDemoSeen: () => void
  onClose: () => void
  onPlan: (prompt?: string) => void
  trip?: Trip
  onReview?: (kind: AssistantAction) => void
  onUpdateTrip?: (update: (trip: Trip) => Trip) => void
  departureAirport?: string
}

type VoicePhase = 'idle' | 'listening' | 'thinking' | 'result'

export function VMaxAssistantSheet({ phase, orbRef, orbGhost, initialView, onDemoSeen, onClose, onPlan, trip, onReview, onUpdateTrip, departureAirport }: VMaxAssistantSheetProps) {
  const now=trip?journeyNow(trip):undefined
  const pending=trip?.proposals?.filter(p=>p.status==='pending'&&(now?.phase==='during'||p.kind==='museum'))??[]
  const [prompt, setPrompt] = useState('')
  const [view, setView] = useState(initialView)
  const [voicePhase, setVoicePhase] = useState<VoicePhase>('idle')
  const [typingOpen, setTypingOpen] = useState(false)
  const [task, setTask] = useState<'flights' | 'coordinate' | null>(null)
  const [inputNotice, setInputNotice] = useState('')
  const cover = trip?.days.some(day => day.stops.some(stop => /fuji|kawaguchi|oishi/i.test(stop.title)))
    ? '/images/fuji-lake-autumn-portrait.jpg' : trip?.image

  useEffect(() => {
    if (voicePhase === 'listening') {
      const timer = window.setTimeout(() => setVoicePhase('thinking'), 2800)
      return () => window.clearTimeout(timer)
    }
    if (voicePhase === 'thinking') {
      const timer = window.setTimeout(() => setVoicePhase('result'), 1500)
      return () => window.clearTimeout(timer)
    }
  }, [voicePhase])

  const submit = () => {
    if (!prompt.trim()) return
    const intent = assistantIntent(prompt)
    setInputNotice('')
    if (intent === 'flights' || intent === 'coordinate') { setTask(intent); setTypingOpen(false); setPrompt(''); return }
    if (intent === 'new-trip') { onPlan(prompt.trim()); return }
    if (intent === 'unsupported') { setInputNotice('This prototype can compare sample flights, coordinate shared availability, or open your plan, route, wallet and budget. Choose a tool above or name one here. Nothing has changed.'); return }
    if (!trip && intent !== 'profile') { setInputNotice('There is no active journey yet. Start a new escape so I can use the right dates and people.'); return }
    onReview?.(intent)
  }

  const finishDemo = () => {
    onDemoSeen()
    setView('assistant')
  }

  const startListening = () => setVoicePhase('listening')

  if (view === 'demo') {
    return (
      <BottomSheet
        label="Introducing Hey V-MAX"
        onDismiss={onClose}
        className="assistant-sheet assistant-sheet--full demo-intro assistant-lens"
        phase={phase === 'closing' ? 'closing' : 'opening'}
      >
        <div className="demo-aurora" />
        <header className="assistant-topbar">
          <button aria-label="Close introduction" onClick={onClose}><Icon name="close" size={19} /></button>
          <span>MEET V-MAX</span>
          <button aria-label="Skip introduction" onClick={finishDemo}>Skip</button>
        </header>

        <div className="demo-film" aria-label="How Hey V-MAX helps">
          <div className="demo-film__scene">
            <span className="demo-film__edge demo-film__edge--one" />
            <span className="demo-film__edge demo-film__edge--two" />
            <div className="demo-film__orb-wrap">
              <Orb ref={orbRef} size="assistant" ghost={orbGhost} className="orb--demo" />
              <span className="demo-film__ring" />
            </div>
            <p className="demo-film__wake">HEY V-MAX</p>
            <h2>One request.<br />Your journey, connected.</h2>
            <div className="demo-film__caption">
              <span className="demo-film__caption-one">“Find a flight that works for all four of us.”</span>
              <span className="demo-film__caption-two">Compare the total. Review it. Keep your choice.</span>
            </div>
          </div>
          <div className="lens-intro-steps"><span><Icon name="plane" size={18}/><strong>Compare</strong><small>Fares, bags, group total.</small></span><span><Icon name="users" size={18}/><strong>Coordinate</strong><small>Each person’s Agent.</small></span><span><Icon name="check" size={18}/><strong>Carry out</strong><small>Approved changes reach Plan & Wallet.</small></span></div>
        </div>

        <div className="demo-intro__copy">
          <p>One Agent across your plans, people and travel tools.</p>
          <span>Interactive prototype · sample fares and Agent replies. Voice is simulated; no microphone active.</span>
        </div>
        <button className="demo-continue" onClick={finishDemo}>Continue to V-MAX <Icon name="arrow" size={17} /></button>
      </BottomSheet>
    )
  }

  return (
    <BottomSheet
      label="V-MAX assistant"
      onDismiss={onClose}
      className={`assistant-sheet assistant-sheet--full assistant-lens is-${voicePhase}`}
      phase={phase === 'closing' ? 'closing' : 'opening'}
    >
      <div className={`assistant-ambient ${voicePhase !== 'idle' ? `assistant-ambient--${voicePhase}` : ''}`} />
      <div className="lens-assistant-light" aria-hidden="true"/>
      {voicePhase !== 'idle' && <div className={`voice-edge voice-edge--${voicePhase}`} aria-hidden="true"><i /><i /><i /><i /></div>}
      <header className="assistant-topbar">
        <button aria-label="Close V-MAX" onClick={onClose}><Icon name="close" size={19} /></button>
        <span>V-MAX</span>
        <button aria-label="Replay introduction" onClick={() => setView('demo')}><Icon name="video" size={19} /></button>
      </header>
      {task ? <AgentTaskWorkspace key={task} task={task} trip={trip} departureAirport={departureAirport} onBack={() => setTask(null)} onOpen={action => onReview?.(action)} onUpdate={onUpdateTrip} onNewTrip={() => onPlan('')}/> : voicePhase === 'idle' ? (
        <>
          <div className="assistant-agent-hero">
            <button className="assistant-agent-orb" onClick={startListening} aria-label="Try V-MAX voice demo">
              <i className="lens-orb-orbit" aria-hidden="true"/>
              <Orb ref={orbRef} size="assistant" ghost={orbGhost} />
              <span><Icon name="mic" size={14}/> Try voice · demo</span>
            </button>
            <p>YOUR PERSONAL TRAVEL AGENT</p>
            <h2>One request.<br/>Across your journey.</h2>
            <small>Compare flights. Coordinate your people.<br/>Carry out the changes you approve.</small>
          </div>
          <div className="agent-capability-grid" aria-label="What V-MAX can do"><button onClick={() => setTask('flights')}><Icon name="plane" size={24}/><strong>Compare flights</strong><small>Full fare, bags & group total</small><span>TRY THE COMPARISON <Icon name="arrow" size={14}/></span></button><button onClick={() => setTask('coordinate')}><Icon name="users" size={24}/><strong>Coordinate us</strong><small>Your friends have Agents, too</small><span>SEE SPLIT & SYNC <Icon name="arrow" size={14}/></span></button></div>
          <section className="assistant-agent-proof agent-assistant-actions" aria-label="Your journey actions">
            <header><span>{trip?trip.city.toUpperCase()+' · YOUR JOURNEY':'START WITH AN ESCAPE'}</span><i>{trip?pending.length+' TO REVIEW':'YOUR CHOICE'}</i></header>
            {pending.map((proposal,index)=><div className={`lens-assistant-decision ${index===0?'is-featured':''}`} key={proposal.id}>
              {index===0&&<>{cover&&<img className="lens-decision-photo" src={cover} alt=""/>}<span className="lens-decision-shade"/><LensSurface/></>}
              <button onClick={()=>onReview?.(proposal.kind)}><span className="lens-assistant-action-icon"><Icon name={proposal.kind==='museum'?'calendar':'users'} size={20}/></span><span><small>{proposal.kind==='museum'?'SPOTTED BEFORE YOU GO':'REUNITE THE GROUP'}</small><strong>{proposal.kind==='museum'?'A better day for the museum':`Dinner together at ${proposal.time}?`}</strong><em>Review the evidence. Nothing applied yet.</em></span><Icon name="arrow" size={17}/></button>
            </div>)}
            {!trip&&<button onClick={()=>onPlan('')}><Icon name="plane" size={19}/><span><small>LET’S BEGIN</small><strong>Plan a new escape</strong><em>Choose a destination, your people and your pace</em></span><Icon name="arrow" size={16}/></button>}
          </section>
          {trip&&<div className="agent-connected-tools" aria-label="Connected journey tools">{([['plan','calendar','Plan'],['map','pin','Route'],['documents','document','Trip wallet'],['budget','wallet','Budget']] as const).map(([action,icon,label])=><button key={action} onClick={()=>onReview?.(action)}><Icon name={icon} size={20}/><span>{label}</span></button>)}</div>}
          {!typingOpen && <button className="assistant-type-toggle" onClick={() => setTypingOpen(true)}><Icon name="document" size={15}/> Type instead <Icon name="arrow" size={15}/></button>}
        </>
      ) : (
        <><div className={`assistant-identity assistant-identity--voice assistant-identity--${voicePhase}`}><Orb ref={orbRef} size="assistant" ghost={orbGhost} /></div><div className="voice-conversation" aria-live="polite">
          <p>{voicePhase === 'listening' ? 'Voice demo · listening animation' : voicePhase === 'thinking' ? 'Voice demo · preparing a suggestion' : 'A gentler-day idea'}</p>
          <h2>{voicePhase === 'listening' ? '“Tomorrow feels a little too tiring.”' : voicePhase === 'thinking' ? 'Let’s make room to rest.' : 'A little more breathing room.'}</h2>
          {voicePhase === 'result' && (
            <div className="voice-result">
              <div><span>Suggestion</span><strong>Add a rest</strong></div>
              <div><span>Later stops</span><strong>Review times</strong></div>
              <div><span>Changes</span><strong>Not applied</strong></div>
              <div><span>Voice</span><strong>Simulation</strong></div>
            </div>
          )}
        </div></>
      )}

      {!task && voicePhase === 'idle' && typingOpen && <div className="assistant-prompt assistant-prompt--compact">
        <textarea
          autoFocus
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Compare flights, coordinate dinner, open my wallet…"
          aria-label="Ask V-MAX to use a travel tool"
          onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); submit() } }}
        />
        <button className="assistant-mic" aria-label="Speak to V-MAX" onClick={startListening}><Icon name="mic" size={18} /></button>
        <button className="assistant-send" disabled={!prompt.trim()} aria-label="Ask V-MAX" onClick={submit}><Icon name="arrow" /></button>
      </div>}

      {!task && inputNotice && <p className="agent-input-notice" role="status">{inputNotice}</p>}
      {!task && voicePhase === 'idle' && <p className="assistant-privacy assistant-agent-privacy">Working local tools · sample fares, Agent replies & voice.<br/>No live monitoring, bookings or payments.</p>}
      {voicePhase === 'result' && <><button className="voice-apply" onClick={() => trip ? onReview?.('gentler') : onPlan('A relaxed escape')}>Review a gentler plan <Icon name="arrow" size={17} /></button><button className="voice-cancel" onClick={() => setVoicePhase('idle')}>Back to V-MAX tools</button></>}
      {(voicePhase === 'listening' || voicePhase === 'thinking') && <button className="voice-cancel" onClick={() => setVoicePhase('idle')}>Cancel</button>}
    </BottomSheet>
  )
}
