import { useEffect, useRef, useState } from 'react'
import { PageScaffold } from '../components/layout/PageScaffold'
import { JourneyProposalCard } from '../components/journey/JourneyProposalCard'
import { JourneyOverview } from '../components/journey/JourneyOverview'
import { JourneyGlassTabs } from '../components/journey/JourneyGlassTabs'
import { JourneyPlan } from '../components/journey/JourneyPlan'
import { JourneyRoute } from '../components/journey/JourneyRoute'
import { JourneyGroupChat } from '../components/journey/JourneyGroupChat'
import { JourneyBudget } from '../components/journey/JourneyBudget'
import { JourneyEssentials } from '../components/journey/JourneyEssentials'
import { PreferenceFields } from '../components/planner/PreferenceFields'
import { BottomSheet } from '../components/ui/BottomSheet'
import { Icon } from '../components/ui/Icon'
import { dateAt, dayIssues, formatDate, money, softenDay, tripBudget } from '../domain/trips'
import type { Preferences, Trip } from '../types/trips'
import '../styles/pages.css'
import '../styles/journey-workspace.css'
import '../styles/journey-refresh.css'
import { journeyNow } from '../domain/agents'
import '../styles/agent-experience.css'
import '../styles/journey-glass.css'
import '../styles/journey-group-glass.css'
import '../styles/journey-lens.css'
import '../styles/journey-lens-content.css'
import { useTransientNotice } from '../hooks/useTransientNotice'
import type { AssistantRequest } from '../domain/assistant'
type Props={trip:Trip;assistantRequest?:AssistantRequest;onAssistantHandled?:()=>void;onBack:()=>void;onAddActivity:()=>void;onUpdate:(update:(trip:Trip)=>Trip)=>void}
export function JourneyPage({trip,assistantRequest,onAssistantHandled,onBack,onAddActivity,onUpdate}:Props){
  const [chapterOpen,setChapterOpen]=useState(false)
  const [overviewProposalId,setOverviewProposalId]=useState<string|null>(null)
  const overviewProposal=trip.proposals?.find(p=>p.id===overviewProposalId)
  const [essentials,setEssentials]=useState<'documents'|'checklist'|null>(null)
  const [settings,setSettings]=useState(false);const [draftNeeds,setDraftNeeds]=useState<Preferences>(trip);const [budget,setBudget]=useState(trip.budgetPerPerson)
  const [reviewDay,setReviewDay]=useState<number|null>(null);const {notice,setNotice}=useTransientNotice()
  const tab=trip.activeTab
  const now=journeyNow(trip)
  useEffect(() => {
    if (!assistantRequest) return
    const action = assistantRequest.action
    if (action === 'documents') setEssentials('documents')
    else if (action === 'gentler') setReviewDay(trip.activeDay)
    else if (action === 'museum' || action === 'reunion') {
      const proposal = trip.proposals?.find(p => p.kind === action)
      if (proposal) setOverviewProposalId(proposal.id)
      else setNotice('There is no matching proposal for this journey. Your current plan is unchanged.')
    }
    onAssistantHandled?.()
  }, [assistantRequest])
  const chrome=useRef<HTMLDivElement>(null)
  const hasFuji=trip.days.some(day=>day.stops.some(stop=>/fuji|kawaguchi|oishi/i.test(stop.title)))
  const cover=hasFuji?'/images/fuji-lake-autumn-portrait.jpg':trip.image
  useEffect(()=>{
    const update=()=>chrome.current?.classList.toggle('is-scrolled',window.scrollY>35)
    update();window.addEventListener('scroll',update,{passive:true})
    return()=>window.removeEventListener('scroll',update)
  },[])
  const openPlan=(day=now.day)=>{onUpdate(t=>({...t,activeTab:'plan',activeDay:day}));window.scrollTo({top:0,behavior:'smooth'})}
  const openTab=(activeTab:Trip['activeTab'])=>{onUpdate(t=>({...t,activeTab,...(activeTab==='group'?{readMessages:t.messages.length}:{})}));window.scrollTo({top:0,behavior:'smooth'})}
  const review=reviewDay?softenDay(trip,reviewDay):null
  const currentDay=reviewDay?trip.days[reviewDay-1]:null
  const proposedDay=reviewDay?review?.days[reviewDay-1]:null
  const reviewChanged=review!==trip
  const openSettings=()=>{setDraftNeeds({mobility:trip.mobility,dietary:trip.dietary,pace:trip.pace,interests:trip.interests,travellerTypes:trip.travellerTypes??[]});setBudget(trip.budgetPerPerson);setSettings(true)}
  return <PageScaffold label={`${trip.city} journey`} className={`journey-shell journey-glass journey-lens ${tab==='overview'?'jl-overview':'jl-inner'}`} notice={notice} activeNav="trips" onNavigate={onBack} journeyAssistant assistantTrip={trip} onAssistantReview={kind=>{if(kind==='group')openTab('group');else if(kind==='documents')setEssentials('documents');else openPlan(kind==='reunion'?2:kind==='museum'?trip.proposals?.find(p=>p.kind==='museum')?.day??now.day:now.day)}} onAssistantPlan={prompt=>{if(!prompt||/slow|rest|tired|walk|gentle|relax|慢|累|休息/i.test(prompt))setReviewDay(trip.activeDay);else {openTab('group');setNotice('Use @V-MAX in the group or edit the Plan. This prototype supports gentler-day drafts.')}}}>
    <div className="journey-workspace"><div className="jg-ambient" aria-hidden="true"><div className="jl-world"><img src={cover} alt=""/></div></div><div ref={chrome} className="jg-chrome"><header className="j-header"><button className="j-icon-button" aria-label="Back to trips" onClick={onBack}><span className="j-back"><Icon name="arrow"/></span></button><button className="j-title" onClick={openSettings}><strong>{hasFuji&&trip.destination==='tokyo'?'Tokyo & Fuji':trip.city}</strong><small>{formatDate(trip.startDate)} – {formatDate(trip.endDate)}</small></button><button className="j-header-people" aria-label="Open travel group" onClick={()=>openTab('group')}><span>{trip.travellers}</span><Icon name="users" size={18}/></button></header>
      <JourneyGlassTabs active={tab} unread={trip.messages.slice(trip.readMessages).some(m=>m.sender!=='you')} onChange={openTab}/></div>
      <div className="jg-preview-bar">{trip.id==='tokyo-demo'&&<button aria-label="Change prototype chapter" onClick={()=>setChapterOpen(true)}><span>Demo</span> · {now.phase==='before'?'Before departure':'Day 2, Tokyo'}<Icon name="chevron" size={13}/></button>}</div>
      {(tab==='plan'||tab==='map')&&<div className="j-days" aria-label="Trip days">{trip.days.map(day=><button key={day.number} className={day.number===trip.activeDay?'selected':''} aria-pressed={day.number===trip.activeDay} aria-label={formatDate(dateAt(trip.startDate,day.number-1))+' · Day '+day.number} onClick={()=>onUpdate(t=>({...t,activeDay:day.number}))}><small>{new Date(dateAt(trip.startDate,day.number-1)+'T12:00:00').toLocaleDateString('en-GB',{weekday:'short'})}</small><strong>{Number(dateAt(trip.startDate,day.number-1).slice(-2))}</strong></button>)}</div>}
      {tab==='overview'&&<JourneyOverview trip={trip} onPlan={openPlan} onSync={day=>{const proposal=trip.proposals?.find(p=>p.day===day&&p.status==='pending');if(proposal)setOverviewProposalId(proposal.id);else openPlan(day)}} onDocs={()=>setEssentials('documents')} onChecklist={()=>setEssentials('checklist')} onGroup={()=>openTab('group')} onBudget={()=>openTab('budget')} onSettings={openSettings}/>} 
      {tab==='plan'&&<JourneyPlan trip={trip} onUpdate={onUpdate} onAdd={onAddActivity} onSoften={()=>setReviewDay(trip.activeDay)}/>}
      {tab==='map'&&<JourneyRoute trip={trip} onPlan={()=>openTab('plan')} onNotice={setNotice} onUpdate={onUpdate}/>} 
      {tab==='group'&&<JourneyGroupChat trip={trip} onUpdate={onUpdate} onReview={setReviewDay} onPlan={openPlan}/>}
      {tab==='budget'&&<JourneyBudget trip={trip} onUpdate={onUpdate}/>}
      {overviewProposal&&<BottomSheet label="Review journey update" className="j-sheet agent-decision-sheet" onDismiss={()=>setOverviewProposalId(null)}><header><h2>From V-MAX</h2><button aria-label="Close journey update" onClick={()=>setOverviewProposalId(null)}><Icon name="close"/></button></header><JourneyProposalCard trip={trip} proposal={overviewProposal} onUpdate={onUpdate} onPlan={day=>{setOverviewProposalId(null);openPlan(day)}}/></BottomSheet>}
      {chapterOpen&&<BottomSheet label="Prototype chapters" className="j-sheet" onDismiss={()=>setChapterOpen(false)}><header><h2>Choose a moment.</h2><button aria-label="Close prototype chapters" onClick={()=>setChapterOpen(false)}><Icon name="close"/></button></header><p className="j-muted">Two moments in the same journey. Your saved plans and decisions stay in place.</p><div className="jg-demo-choices">{(['before','during'] as const).map(phase=><button key={phase} aria-pressed={now.phase===phase} onClick={()=>{onUpdate(t=>({...t,demoPhase:phase,activeDay:phase==='before'?1:2}));setChapterOpen(false)}}><span><strong>{phase==='before'?'Before departure':'Day 2 in Tokyo'}</strong><small>{phase==='before'?'13 Sept · 09:00 · final preparations':'15 Sept · 17:00 · time to reunite'}</small></span><Icon name={now.phase===phase?'check':'arrow'} size={19}/></button>)}</div><p className="fine-print">Fixed demo time. No live location or background monitoring.</p></BottomSheet>}
      {essentials&&<JourneyEssentials trip={trip} section={essentials} onClose={()=>setEssentials(null)} onUpdate={onUpdate}/>}
      {settings&&<BottomSheet label="Trip settings" className="j-sheet" onDismiss={()=>setSettings(false)}><header><h2>A journey that includes you.</h2><button aria-label="Close trip settings" onClick={()=>setSettings(false)}><Icon name="close"/></button></header><p className="j-muted">{trip.city} · {trip.days.length} days · {trip.travellers} travellers</p><PreferenceFields value={draftNeeds} onChange={setDraftNeeds}/><label className="field-label">Budget · MYR per person<input type="number" min="1" value={budget||''} onChange={e=>setBudget(Number(e.target.value))}/></label><p className="fine-print">Group budget: {money(budget*trip.travellers)}. These are shared preferences, not private health records.</p><button className="j-primary" disabled={!Number.isFinite(budget)||budget<=0} onClick={()=>{onUpdate(t=>({...t,...draftNeeds,budgetPerPerson:budget}));setSettings(false)}}>Save preferences</button></BottomSheet>}
      {reviewDay&&currentDay&&proposedDay&&<BottomSheet label="Review gentler itinerary" className="j-sheet" onDismiss={()=>setReviewDay(null)}><header><h2>A little more breathing room.</h2><button aria-label="Close adjustment" onClick={()=>setReviewDay(null)}><Icon name="close"/></button></header><p className="j-muted">Day {reviewDay} · nothing changes until you confirm.</p>{reviewChanged?<><div className="j-review-impact"><strong>＋30 min rest</strong><span>Existing stops kept · later times adjusted where needed</span></div><div className="j-review-stops">{proposedDay.stops.map(stop=><div key={stop.id}><time>{stop.time}</time><span>{stop.title}</span>{!currentDay.stops.some(s=>s.id===stop.id)&&<b>NEW</b>}</div>)}</div>{dayIssues(proposedDay.stops,trip,reviewDay).length>0&&<p className="j-warning">Some access, seasonal or timing notes still need review in Plan.</p>}<p className="fine-print">Prototype rule-based adjustment, not a live AI or transport prediction. Budget stays {money(tripBudget(trip))}.</p><button className="j-primary" onClick={()=>{onUpdate(t=>({...softenDay(t,reviewDay),activeDay:reviewDay,activeTab:'plan'}));setReviewDay(null);setNotice('Rest added. Plan, Route and Overview now use the updated day.')}}>Use this gentler day<Icon name="check"/></button></>:<p className="j-muted">{currentDay.softened?'This day already has the extra rest. You can still edit it in Plan.':currentDay.stops.length?'There isn’t enough room before midnight. Edit a stop first.':'Add a stop to this day first, then V-MAX can help space it out.'}</p>}</BottomSheet>}
    </div>
  </PageScaffold>
}
