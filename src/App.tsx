import { useEffect, useLayoutEffect, useState, type ReactNode } from 'react'
import { activityById } from './data/discoveryData'
import { ActivityDetailPage } from './pages/ActivityDetailPage'
import { DiscoverPage, type DiscoverState } from './pages/DiscoverPage'
import { HomePage } from './pages/HomePage'
import { JourneyPage } from './pages/JourneyPage'
import { PlannerPage } from './pages/PlannerPage'
import { SeasonPage, type SeasonPosition } from './pages/SeasonPage'
import { LibraryPage } from './pages/LibraryPage'
import { useTravelStore } from './state/useTravelStore'
import { AppNavigationProvider } from './state/AppContext'
import { journeyNow } from './domain/agents'
import { activityFitsTrip, minutes, stopFromActivity } from './domain/trips'
import type { NavDestination } from './components/navigation/BottomNavigation'
import type { TripAddition } from './types/trips'
import type { AssistantAction, AssistantRequest } from './domain/assistant'
import './styles/journey-workspace.css'
type Route={page:string;id?:string;trip?:string;seed?:string}
const readRoute=():Route=>{const [path,query]=window.location.hash.slice(1).split('?');const p=new URLSearchParams(query);return {page:path||'home',id:p.get('id')??undefined,trip:p.get('trip')??undefined,seed:p.get('seed')??undefined}}
const emptyBrowse:DiscoverState={filters:{},query:'',filtersOpen:false}
function App(){
  const store=useTravelStore()
  const [route,setRoute]=useState(readRoute)
  const [plannerInput,setPlannerInput]=useState({prompt:'',group:false})
  const [browse,setBrowse]=useState<Record<string,DiscoverState>>({})
  const [season,setSeason]=useState<SeasonPosition>({index:0,category:'For everyone'})
  const [assistantRequest,setAssistantRequest]=useState<AssistantRequest>()
  useEffect(()=>{const listener=()=>setRoute(readRoute());window.addEventListener('popstate',listener);window.addEventListener('hashchange',listener);return()=>{window.removeEventListener('popstate',listener);window.removeEventListener('hashchange',listener)}},[])
  useLayoutEffect(()=>{window.scrollTo(0,0)},[route])
  useEffect(()=>{const titles:Record<string,string>={home:'Your escape',journey:'Journey',trips:'Journeys',profile:'Your profile',planner:'Plan an escape',discover:'Discover',season:'This season',activity:'Discover a place',saved:'Saved places'};document.title=`${titles[route.page]??'Travel together'} · V-MAX`},[route.page])
  const open=(next:Route)=>{const p=new URLSearchParams();if(next.id)p.set('id',next.id);if(next.trip)p.set('trip',next.trip);if(next.seed)p.set('seed',next.seed);const hash='#'+next.page+(p.size?'?'+p.toString():'');if(window.location.hash!==hash)window.history.pushState({vmax:true},'',hash);setRoute(next)}
  const back=()=>{if(window.history.state?.vmax)window.history.back();else open({page:'home'})}
  const navigate=(to:NavDestination)=>open({page:to})
  const plan=(prompt='',group=false,seed?:string)=>{setPlannerInput({prompt,group});open({page:'planner',seed})}
  const savedIds=new Set(store.state.savedIds)
  const trip=store.state.trips.find(t=>t.id===route.trip||t.id===route.id&&route.page==='journey')
  const activity=route.page==='activity'?activityById(route.id??''):undefined
  const active:NavDestination=route.page==='journey'?'trips':route.page==='activity'||route.page==='season'?'discover':['home','trips','saved','profile','discover'].includes(route.page)?route.page as NavDestination:'trips'
  const upcoming=[...store.state.trips].filter(t=>t.endDate>=journeyNow(t).date).sort((a,b)=>a.startDate.localeCompare(b.startDate))[0]
  const assistantTrip = trip ?? upcoming
  const review = (action: AssistantAction) => {
    if (action === 'profile') { open({page:'profile'}); return }
    if (!assistantTrip) { open({page:'trips'}); return }
    const target = assistantTrip
    const tab = action === 'budget' ? 'budget' : action === 'map' ? 'map' : action === 'group' ? 'group' : action === 'documents' ? 'overview' : 'plan'
    store.updateTrip(target.id, t => ({...t, activeTab: tab, ...(tab === 'group' ? {readMessages:t.messages.length} : {})}))
    setAssistantRequest(previous => ({id:(previous?.id ?? 0)+1,tripId:target.id,action}))
    open({page:'journey',id:target.id})
  }
  const onAddition=(addition:TripAddition)=>{
    if(!trip||!activity||!activityFitsTrip(activity,trip)||addition.day<1||addition.day>trip.days.length)return
    store.updateTrip(trip.id,t=>({...t,activeDay:addition.day,days:t.days.map(d=>({...d,stops:[...d.stops.filter(s=>s.activityId!==activity.id),...(d.number===addition.day?[{...stopFromActivity(activity,addition.time),duration:addition.duration??90}]:[])].sort((a,b)=>minutes(a.time)-minutes(b.time))}))}))
  }
  let page:ReactNode
  if(route.page==='home')page=<HomePage trip={upcoming} onAllTrips={()=>open({page:'trips'})} onSearchResults={query=>{setBrowse(b=>({...b,global:{...emptyBrowse,query}}));open({page:'discover'})}} onOpenSeason={()=>open({page:'season'})} onOpenActivity={id=>open({page:'activity',id})} onOpenJourney={(tab,day)=>{if(upcoming){if(tab||day)store.updateTrip(upcoming.id,t=>({...t,activeTab:tab??t.activeTab,activeDay:day??t.activeDay}));open({page:'journey',id:upcoming.id})}else open({page:'trips'})}} onUpdateTrip={update=>{if(upcoming)store.updateTrip(upcoming.id,update)}} onStartPlanner={plan} onDiscover={()=>open({page:'discover'})}/>
  else if(route.page==='season')page=<SeasonPage savedIds={savedIds} position={season} onPosition={setSeason} onBack={back} onDiscover={()=>open({page:'discover'})} onSaved={()=>open({page:'saved'})} onOpenActivity={id=>open({page:'activity',id})} onToggleSaved={store.toggleSaved}/>
  else if(route.page==='discover'&&(!route.trip||trip)){const key=route.trip??'global';page=<DiscoverPage browse={browse[key]??emptyBrowse} onBrowseChange={value=>setBrowse(b=>({...b,[key]:value}))} tripDestination={trip?.destination} savedIds={savedIds} onBack={back} onOpenActivity={id=>open({page:'activity',id,trip:route.trip})} onToggleSaved={store.toggleSaved}/>}
  else if(route.page==='activity'&&activity&&(!route.trip||trip))page=<ActivityDetailPage key={activity.id} activity={activity} trip={trip} saved={savedIds.has(activity.id)} onBack={back} onToggleSaved={()=>store.toggleSaved(activity.id)} onAddToTrip={onAddition} onRemoveFromTrip={()=>trip&&store.updateTrip(trip.id,t=>({...t,days:t.days.map(d=>({...d,stops:d.stops.filter(s=>s.activityId!==activity.id)}))}))} onPlanTrip={()=>plan('',false,activity.id)}/>
  else if(route.page==='journey'&&trip)page=<JourneyPage key={trip.id} trip={trip} assistantRequest={assistantRequest?.tripId===trip.id?assistantRequest:undefined} onAssistantHandled={()=>setAssistantRequest(undefined)} onBack={()=>open({page:'trips'})} onAddActivity={()=>open({page:'discover',trip:trip.id})} onUpdate={update=>store.updateTrip(trip.id,update)}/>
  else if(route.page==='planner'&&(!route.seed||activityById(route.seed)))page=<PlannerPage key={route.seed??'new'} initialPrompt={plannerInput.prompt} initialActivity={route.seed?activityById(route.seed):undefined} groupMode={plannerInput.group} preferences={store.state.preferences} onBack={back} onDiscover={()=>open({page:'discover'})} onOpenJourney={newTrip=>{store.addTrip(newTrip);open({page:'journey',id:newTrip.id})}}/>
  else if(route.page==='trips'||route.page==='saved'||route.page==='profile')page=<LibraryPage key={route.page} mode={route.page} trips={store.state.trips} savedIds={savedIds} preferences={store.state.preferences} account={store.state.profile} onSaveAccount={store.saveProfile} onSetDemoSession={store.setDemoSession} onPreferences={store.setPreferences} onUpdateTrip={store.updateTrip} onBack={back} onProfile={()=>open({page:'profile'})} onSaved={()=>open({page:'saved'})} onTrip={id=>open({page:'journey',id})} onCreate={()=>plan()} onActivity={id=>open({page:'activity',id})} onToggleSaved={store.toggleSaved} onSeason={()=>open({page:'season'})}/>
  else page=<main className="app-stage"><section className="phone-shell standard-page"><h1>This page is no longer available.</h1><p>Your saved trips are safe.</p><button className="j-primary" onClick={()=>open({page:'trips'})}>Go to my trips</button></section></main>
  return <AppNavigationProvider value={{navigate,plan,active,assistantTrip,review,departureAirport:store.state.profile.departureAirport,updateAssistantTrip:assistantTrip?update=>store.updateTrip(assistantTrip.id,update):undefined}}>{store.storageError&&<p className="storage-alert" role="alert">{store.storageError}</p>}{page}</AppNavigationProvider>
}
export default App
