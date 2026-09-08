import { useId, useState, type FormEvent, type ReactNode } from 'react'
import { Icon, type IconName } from '../ui/Icon'
import { Orb } from '../ui/Orb'
import { agentFor, journeyNow, updateAgent } from '../../domain/agents'
import { dateRange, money } from '../../domain/trips'
import type { AgentPreferences, Trip } from '../../types/trips'

type Props = {
  trips: Trip[]
  onUpdateTrip: (id: string, update: (trip: Trip) => Trip) => void
  onTrip: (id: string) => void
  onCreate: () => void
  onNotice: (message: string) => void
}

export function ProfileAgentCenter({ trips, onUpdateTrip, onTrip, onCreate, onNotice }: Props) {
  const [selectedId, setSelectedId] = useState(() => trips.find(trip => trip.id === 'tokyo-demo')?.id ?? trips[0]?.id ?? '')
  const selected = trips.find(trip => trip.id === selectedId) ?? trips[0]
  // The local prototype identifies its owner explicitly. Never fall back to editing another member.
  const mine = selected?.members.find(member => member.id === 'you')
  const myAgent = selected && mine ? agentFor(selected, mine.id) : null
  const sharingCount = myAgent ? [myAgent.shareAvailability, myAgent.shareArea, myAgent.shareBudget].filter(Boolean).length : 0
  const hasFuji = selected?.destination === 'tokyo' && selected.days.some(day => day.stops.some(stop => /fuji|kawaguchi|oishi/i.test(stop.title)))

  return <>
    <section className="profile-agent-hero" aria-labelledby="my-agent-title">
      <div className="profile-agent-identity"><span className="profile-owner-icon"><Icon name="user" size={14}/></span><span>YOUR PERSONAL SPACE</span></div>
      <div className="profile-agent-hero-main"><div><h2 id="my-agent-title">Your Agent.<br/>Your rules.</h2><p>A little less to coordinate.<br/>Always your call.</p></div><div className="profile-agent-presence" aria-hidden="true"><span className="profile-agent-orbit"/><Orb size="fill"/></div></div>
      <div className="profile-agent-promise"><Icon name="check" size={15}/><span>You choose what your Agent can share.</span></div>
    </section>

    {selected && mine ? <>
      <div className="profile-trip-context"><img src={hasFuji?'/images/fuji-lake-autumn-portrait.jpg':selected.image} alt=""/><div><label htmlFor="agent-trip">AGENT SETTINGS FOR</label><select id="agent-trip" value={selected.id} onChange={event => setSelectedId(event.target.value)}>{trips.map(trip => <option key={trip.id} value={trip.id}>{trip.city}{trip.id === 'tokyo-demo' ? ' · sample journey' : ''}</option>)}</select><small>{dateRange(selected)} · {selected.members.length} travellers</small></div></div>
      <details className="profile-agent-permissions"><summary><span className="profile-permission-icon"><Icon name="users" size={21}/></span><span><strong>Privacy & Agent permissions</strong><small>{sharingCount===0?'Your details stay private':`${sharingCount} sharing ${sharingCount===1?'permission':'permissions'} enabled`} · {myAgent?.autoApproveReunion?'limited approval':'you approve'}</small></span><Icon name="chevron" size={18}/></summary><div className="profile-permissions-content">
      <PersonalAgentSettings key={`${selected.id}-${mine.id}`} trip={selected} memberId={mine.id} onUpdateTrip={onUpdateTrip} onTrip={onTrip} onNotice={onNotice}/>
      </div></details>
      {selected.id === 'tokyo-demo' && <DemoChapter trip={selected} onUpdateTrip={onUpdateTrip} onNotice={onNotice}/>}
    </> : <div className="profile-no-journey"><h3>Your Agent starts with your journey.</h3><p>Once you plan a trip, set what your Agent can share with the people joining you.</p><button className="j-primary" onClick={onCreate}>Plan an escape <Icon name="arrow" size={18}/></button></div>}
  </>
}

function PersonalAgentSettings({ trip, memberId, onUpdateTrip, onTrip, onNotice }: Pick<Props, 'onUpdateTrip' | 'onTrip' | 'onNotice'> & { trip: Trip; memberId: string }) {
  const saved = agentFor(trip, memberId)
  const [draft, setDraft] = useState<AgentPreferences>(saved)
  const [error, setError] = useState('')
  const prefix = useId()
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved)
  const canDelegate = draft.shareAvailability && draft.shareArea && draft.shareBudget
  const shared = [draft.shareAvailability, draft.shareArea, draft.shareBudget].filter(Boolean).length
  const preview = [
    draft.shareAvailability && draft.availableFrom ? `Available after ${draft.availableFrom}` : '',
    draft.shareArea && draft.area.trim() ? `Around ${draft.area.trim()}` : '',
    draft.shareBudget ? `Meal budget up to ${money(draft.mealBudget)}` : '',
  ].filter(Boolean)

  const patch = (value: Partial<AgentPreferences>) => {
    setDraft(current => {
      const next = { ...current, ...value }
      if (!next.shareAvailability || !next.shareArea || !next.shareBudget) next.autoApproveReunion = false
      return next
    })
    setError('')
  }

  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (draft.shareAvailability && !/^([01]\d|2[0-3]):[0-5]\d$/.test(draft.availableFrom)) {
      setError('Choose when you are available before sharing your time.'); return
    }
    if (draft.shareArea && !draft.area.trim()) { setError('Add a general area before sharing your location.'); return }
    if (draft.shareBudget && (!Number.isFinite(draft.mealBudget) || draft.mealBudget <= 0)) { setError('Enter a meal budget above MYR 0 before sharing it.'); return }
    const next = { ...draft, area: draft.area.trim().slice(0, 60) }
    onUpdateTrip(trip.id, current => updateAgent(current, memberId, next))
    setDraft(next)
    onNotice('Your Agent settings are saved. Pending proposals will use these boundaries.')
  }

  return <form className="profile-agent-settings" onSubmit={save}>
    <div className="profile-section-heading"><h3>What I share</h3><span>{shared} of 3 enabled</span></div>
    <p className="profile-section-description">Your settings only. Other travellers manage their own Agents.{trip.id === 'tokyo-demo' ? ' Sample availability below is for the Day 2 dinner reunion.' : ''}</p>
    <div className="profile-sharing-list">
      <SharingSetting icon="clock" title="When I’m free" description="Availability, not your calendar details" checked={draft.shareAvailability} onChange={() => patch({ shareAvailability: !draft.shareAvailability })} fieldId={`${prefix}-time`}>
        <label htmlFor={`${prefix}-time`}>Available after <span>Local trip time</span></label>
        <input id={`${prefix}-time`} type="time" aria-label="Available after, local trip time" value={draft.availableFrom} onChange={event => patch({ availableFrom: event.target.value })}/>
      </SharingSetting>
      <SharingSetting icon="pin" title="My general area" description="Share a neighbourhood, not an exact address" checked={draft.shareArea} onChange={() => patch({ shareArea: !draft.shareArea })} fieldId={`${prefix}-area`}>
        <label htmlFor={`${prefix}-area`}>Area <span>For meet-up suggestions</span></label>
        <input id={`${prefix}-area`} type="text" maxLength={60} placeholder="e.g. Shibuya" value={draft.area} autoComplete="off" onChange={event => patch({ area: event.target.value })}/>
      </SharingSetting>
      <SharingSetting icon="wallet" title="My meal budget" description="A planning limit, not payment permission" checked={draft.shareBudget} onChange={() => patch({ shareBudget: !draft.shareBudget })} fieldId={`${prefix}-budget`}>
        <label htmlFor={`${prefix}-budget`}>Per person <span>MYR · planning currency</span></label>
        <input id={`${prefix}-budget`} type="number" inputMode="decimal" min="0" max="100000" step="0.01" aria-label="Meal budget per person in MYR" value={draft.mealBudget || ''} placeholder="120" onChange={event => patch({ mealBudget: event.target.value === '' ? 0 : Number(event.target.value) })}/>
      </SharingSetting>
    </div>

    <section className="profile-delegation" aria-labelledby={`${prefix}-delegation-title`}>
      <div className="profile-delegation-top"><div><h3 id={`${prefix}-delegation-title`}>Let my Agent say yes</h3><p>Only to a dinner reunion that fits.</p></div><button type="button" className="profile-switch" role="switch" aria-checked={draft.autoApproveReunion} aria-label="Allow my Agent to approve a dinner reunion within my limits" disabled={!canDelegate} onClick={() => patch({ autoApproveReunion: !draft.autoApproveReunion })}><span/></button></div>
      <p className="profile-delegation-rule">{!canDelegate ? 'Share your availability, area and meal budget first. Until then, every proposal needs your approval.' : draft.autoApproveReunion ? 'Your Agent may approve only within your shared time, transfer allowance and meal budget. Conflicts still need review.' : 'Your Agent can suggest a plan. You give the final yes.'}</p>
      <div className="profile-no-purchase"><Icon name="check" size={13}/><span>No bookings. No payments. Change this anytime.</span></div>
    </section>

    <section className="profile-sharing-preview" aria-labelledby={`${prefix}-preview-title`}><Orb size="nav"/><div><h3 id={`${prefix}-preview-title`}>{dirty ? 'Sharing preview · not saved yet' : 'What my Agent can tell the group'}</h3>{preview.length ? <ul>{preview.map(line => <li key={line}>{line}</li>)}</ul> : <p>No personal details are shared. Your Agent will ask you instead.</p>}</div></section>
    {error && <p className="profile-form-error" role="alert">{error}</p>}
    <button type="submit" className="profile-save-agent" disabled={!dirty}>{dirty ? 'Save agent settings' : <><Icon name="check" size={17}/> Agent settings saved</>}</button>
    <button type="button" className="profile-open-group" disabled={dirty} onClick={() => { onUpdateTrip(trip.id, current => ({ ...current, activeTab: 'group' })); onTrip(trip.id) }}>{dirty ? 'Save your changes to try them in Group' : <>See my Agent in Group <Icon name="arrow" size={15}/></>}</button>
  </form>
}

function SharingSetting({ icon, title, description, checked, onChange, fieldId, children }: { icon: IconName; title: string; description: string; checked: boolean; onChange: () => void; fieldId: string; children: ReactNode }) {
  return <section className={`profile-sharing-setting ${checked ? 'is-shared' : ''}`}><div className="profile-sharing-toggle"><span className="profile-sharing-icon"><Icon name={icon} size={19}/></span><div><h4>{title}</h4><p>{description}</p></div><button type="button" role="switch" className="profile-switch" aria-checked={checked} aria-label={`Share ${title.toLowerCase()}`} aria-controls={`${fieldId}-field`} onClick={onChange}><span/></button></div>{checked ? <div className="profile-sharing-field" id={`${fieldId}-field`}>{children}</div> : <p className="profile-private-note" id={`${fieldId}-field`}>Private. Your Agent won’t disclose this to the group.</p>}</section>
}

function DemoChapter({ trip, onUpdateTrip, onNotice }: Pick<Props, 'onUpdateTrip' | 'onNotice'> & { trip: Trip }) {
  const now = journeyNow(trip)
  return <details className="profile-demo-controls"><summary><span><Icon name="play" size={16}/> Prototype chapters</span><Icon name="chevron" size={16}/></summary><p>Move through the same sample journey. This changes the demo clock, not your saved plan or decisions.</p><div className="profile-demo-segments">{(['before', 'during'] as const).map(phase => <button type="button" key={phase} aria-pressed={now.phase === phase} onClick={() => { onUpdateTrip(trip.id, current => ({ ...current, demoPhase: phase, activeDay: phase === 'before' ? 1 : 2 })); onNotice(phase === 'before' ? 'Demo clock: 13 Sep, 09:00 · before departure.' : 'Demo clock: 15 Sep, 17:00 · travelling, Day 2.') }}><strong>{phase === 'before' ? 'Before departure' : 'On the journey'}</strong><small>{phase === 'before' ? '13 Sep · 09:00' : '15 Sep · 17:00'}</small></button>)}</div><small className="profile-demo-disclosure">Sample member availability is entered locally. No live calendar or location tracking is connected.</small></details>
}
