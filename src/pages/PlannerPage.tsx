import { useMemo, useState } from 'react'
import { PageScaffold } from '../components/layout/PageScaffold'
import { JourneyDraftPass } from '../components/planner/JourneyDraftPass'
import { PreferenceFields } from '../components/planner/PreferenceFields'
import { Icon } from '../components/ui/Icon'
import { PageHeader } from '../components/ui/PageHeader'
import type { Activity } from '../data/discoveryData'
import { createTrip, dateAt, dateRange, dayCount, DEFAULT_PREFERENCES, destinationOf, DESTINATIONS, money, recommendedStart } from '../domain/trips'
import type { Preferences, Trip } from '../types/trips'
import '../styles/planner.css'
import '../styles/journey-workspace.css'
import '../styles/planner-lens.css'
type Props={initialPrompt:string;initialActivity?:Activity;groupMode:boolean;preferences?:Preferences;onBack:()=>void;onDiscover:()=>void;onOpenJourney:(trip:Trip)=>void}
export function PlannerPage({initialPrompt,initialActivity,groupMode,preferences=DEFAULT_PREFERENCES,onBack,onDiscover,onOpenJourney}:Props){
  const [step,setStep]=useState<'describe'|'suggestions'|'setup'|'ready'>(initialActivity?'setup':initialPrompt?'suggestions':'describe')
  const [prompt,setPrompt]=useState(initialPrompt)
  const ranked=useMemo(()=>Object.entries(DESTINATIONS).sort(([ka,a],[kb,b])=>{
    const score=(key:string,city:string)=>prompt.toLowerCase().includes(key)||prompt.toLowerCase().includes(city.toLowerCase())?10:0
    return score(kb,b.city)-score(ka,a.city)
  }),[prompt])
  const [destination,setDestination]=useState(initialActivity?destinationOf(initialActivity):ranked[0][0])
  const [startDate,setStartDate]=useState(recommendedStart(initialActivity))
  const [endDate,setEndDate]=useState(dateAt(recommendedStart(initialActivity),initialActivity?.country==='Iceland'?4:6))
  const [travellers,setTravellers]=useState(groupMode?4:2)
  const [budget,setBudget]=useState(7000)
  const [needs,setNeeds]=useState(preferences)
  const [draft,setDraft]=useState<Trip|null>(null)
  const [error,setError]=useState('')
  const selected=DESTINATIONS[destination];const days=dayCount(startDate,endDate)
  const stepNumber=step==='describe'?0:step==='suggestions'?1:step==='setup'?2:3
  const valid=Number.isFinite(days)&&days>0&&days<=30&&travellers>=1&&travellers<=12&&Number.isFinite(budget)&&budget>0
  const back=()=>{if(step==='ready')setStep('setup');else if(step==='setup'&&!initialActivity)setStep('suggestions');else if(step==='suggestions')setStep('describe');else onBack()}
  const generate=()=>{try{setDraft(createTrip({...needs,destination,startDate,endDate,travellers,budgetPerPerson:budget,seedActivityId:initialActivity?.id}));setStep('ready');setError('');window.scrollTo(0,0)}catch(e){setError((e as Error).message)}}
  return <PageScaffold label="V-MAX trip planner" notice={error} onNavigate={onDiscover} onAssistantPlan={()=>{}}>
    <div className={`standard-page planner-page planner-lens planner-lens--${step}`}>
      <PageHeader title={step==='ready'?'Journey Pass':'Plan an escape'} onBack={back}/>
      <div className="planner-step-progress" aria-label={`Step ${stepNumber+1} of 4: ${['Your idea','Choose a place','Make it yours','Journey ready'][stepNumber]}`}><small>{['Your idea','Choose a place','Make it yours','Journey ready'][stepNumber]}</small><span aria-hidden="true">{[0,1,2,3].map(index=><i key={index} className={index<=stepNumber?'is-reached':''}/>)}</span></div>
      {step==='describe'&&<section className="planner-stage planner-describe"><div className="planner-opener"><img src="/images/tokyo-ginkgo-crowd.jpg" alt=""/><p className="planner-kicker">THE NEXT CHAPTER</p><h1>Your next<br/>somewhere.</h1><p>A destination, a feeling, a few days away. Start with what you have in mind.</p></div><div className="planner-textbox"><textarea aria-label="Describe your trip" value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="A relaxed trip to Tokyo for four, with easy walking…"/><button disabled={!prompt.trim()} aria-label="Find trip ideas" onClick={()=>{setDestination(ranked[0][0]);setStep('suggestions')}}><Icon name="arrow"/></button></div><div className="planner-prompts">{['A relaxed Tokyo trip','Family magic in Shanghai','Northern lights in Iceland'].map(p=><button key={p} onClick={()=>setPrompt(p)}>{p}<Icon name="arrow"/></button>)}</div></section>}
      {step==='suggestions'&&<section className="planner-stage"><p className="planner-kicker">A LITTLE INSPIRATION</p><h1>Where shall we go?</h1><p className="planner-summary">“{prompt}”</p><div className="planner-ideas">{ranked.slice(0,3).map(([key,idea])=><button key={key} className={destination===key?'selected':''} aria-pressed={destination===key} onClick={()=>setDestination(key)}><img src={idea.image} alt=""/><span className="planner-idea-shade"/><span className="planner-idea-copy"><small>{idea.country}</small><strong>{idea.city}</strong><em>A starting point, shaped around you.</em></span><i aria-hidden="true">{destination===key?'✓':''}</i></button>)}</div><label className="field-label">Or choose another destination<select value={destination} onChange={e=>setDestination(e.target.value)}>{Object.entries(DESTINATIONS).map(([key,d])=><option key={key} value={key}>{d.city}, {d.country}</option>)}</select></label><button className="planner-primary" onClick={()=>setStep('setup')}>Plan {selected.city}<Icon name="arrow"/></button><p className="fine-print">Prototype suggestions. Destination words are matched locally; your needs are set in the next step.</p></section>}
      {step==='setup'&&<section className="planner-stage planner-setup-stage"><p className="planner-kicker">THE DETAILS THAT MATTER</p><h1>Make it yours.</h1><p className="planner-summary">{selected.city} is the destination.<br/>The rest is up to you.</p>
        <JourneyDraftPass city={selected.city} image={selected.image} dates={dateRange({startDate,endDate})} travellers={travellers} mobility={needs.mobility.join(' · ')||'Flexible'} dietary={needs.dietary.join(' · ')||'No requests'} pace={needs.pace} budget={budget||0} progress={valid?8:6} personalized={{mobility:true,dietary:true,pace:true,budget:true}}/>
        <div className="planner-basics"><h2>When & who</h2><div className="setup-date-grid"><label className="field-label">Depart<input type="date" aria-label="Departure date" value={startDate} onInput={e=>{const value=e.currentTarget.value;setStartDate(value);if(value>endDate)setEndDate(value)}} onChange={e=>{setStartDate(e.target.value);if(e.target.value>endDate)setEndDate(e.target.value)}}/></label><label className="field-label">Return<input type="date" aria-label="Return date" min={startDate} value={endDate} onInput={e=>setEndDate(e.currentTarget.value)} onChange={e=>setEndDate(e.target.value)}/></label></div>
        <p className="fine-print">{valid?`${days} days · ${days-1} nights`:'Choose a trip of 1–30 days.'}</p>
        <div className="setup-date-grid"><label className="field-label">Travellers<input type="number" min="1" max="12" value={travellers} onChange={e=>setTravellers(Number(e.target.value))}/></label><label className="field-label">Budget · MYR per person<input type="number" min="1" step="100" value={budget||''} onChange={e=>setBudget(Number(e.target.value))}/></label></div></div>
        <details className="planner-comfort"><summary><Icon name="compass" size={21}/><span><strong>Your kind of journey</strong><small>{needs.pace} · comfort, food & interests</small></span><Icon name="chevron" size={18}/></summary><PreferenceFields value={needs} onChange={setNeeds}/></details>
        <div className="planner-budget"><span><small>Whole-group budget</small><strong>{money((budget||0)*travellers)}</strong></span></div>
        <p className="fine-print">This creates a local draft—not bookings. Route access and dietary availability still need venue confirmation. Group members can be renamed later.</p>
        <button className="planner-primary" disabled={!valid} onClick={generate}>Create my Journey Pass<Icon name="arrow"/></button>
      </section>}
      {step==='ready'&&draft&&<section className="planner-stage planner-ready"><p className="planner-kicker">YOUR NEXT ADVENTURE</p><h1>Let’s go, {initialActivity?.id==='shanghai-disney-10'?'Shanghai Disneyland':draft.city}!</h1><p className="planner-summary">{days} days · {travellers} travellers · one shared plan.</p><div className="ready-hero"><img src={selected.image} alt=""/><span/><b className="ready-pass-mark">V-MAX JOURNEY PASS</b><i className="ready-pass-perforation"/><div><small>{dateRange(draft)}</small><strong>{draft.city}</strong><em>{days-1} nights · draft itinerary</em></div></div><div className="ready-impact"><div><span>Mobility</span><strong>{needs.mobility.join(' · ')||'Flexible'}</strong></div><div><span>Food requests</span><strong>{needs.dietary.join(' · ')||'None added'}</strong></div><div><span>Pace</span><strong>{needs.pace}</strong></div><div><span>Budget</span><strong>{money(budget)} pp</strong></div></div><div className="ready-preview"><p>{initialActivity?`Day ${Math.min(2,days)} · Your inspiration is included`:'Day 1 preview'}</p>{draft.days[initialActivity?Math.min(1,days-1):0].stops.map(stop=><div key={stop.id}><time>{stop.time}</time><span><strong>{stop.title}</strong><small>{stop.duration} min · draft</small></span></div>)}</div><button className="planner-primary" onClick={()=>onOpenJourney(draft)}>Open my journey<Icon name="arrow"/></button></section>}
    </div>
  </PageScaffold>
}
