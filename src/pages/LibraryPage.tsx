import { useState } from 'react'
import { PageScaffold } from '../components/layout/PageScaffold'
import { PageHeader } from '../components/ui/PageHeader'
import { Icon } from '../components/ui/Icon'
import { ActivityCard } from '../components/discovery/ActivityCard'
import { PreferenceFields } from '../components/planner/PreferenceFields'
import { ProfileAgentCenter } from '../components/profile/ProfileAgentCenter'
import { ProfileAccount } from '../components/profile/ProfileAccount'
import { activities } from '../data/discoveryData'
import { dateRange, money, tripStage, tripBudget, tripSpent } from '../domain/trips'
import type { Preferences, Trip } from '../types/trips'
import type { LocalProfile, ProfileDetails } from '../types/profile'
import '../styles/pages.css'
import '../styles/journey-workspace.css'
import '../styles/profile.css'
import '../styles/profile-agent.css'
import '../styles/library-lens.css'
import { useTransientNotice } from '../hooks/useTransientNotice'
import { useAppNavigation } from '../state/AppContext'
type Props={mode:'trips'|'saved'|'profile';trips:Trip[];savedIds:Set<string>;preferences:Preferences;account:LocalProfile;onSaveAccount:(details:ProfileDetails)=>void;onSetDemoSession:(active:boolean)=>void;onPreferences:(p:Preferences)=>void;onUpdateTrip:(id:string,update:(trip:Trip)=>Trip)=>void;onBack:()=>void;onProfile:()=>void;onSaved:()=>void;onTrip:(id:string)=>void;onCreate:()=>void;onActivity:(id:string)=>void;onToggleSaved:(id:string)=>void;onSeason:()=>void}
export function LibraryPage({mode,trips,savedIds,preferences,account,onSaveAccount,onSetDemoSession,onPreferences,onUpdateTrip,onBack,onProfile,onSaved,onTrip,onCreate,onActivity,onToggleSaved,onSeason}:Props){
  const [draft,setDraft]=useState(preferences);const {notice,setNotice}=useTransientNotice()
  const savedPlaces=activities.filter(activity=>savedIds.has(activity.id))
  const navigation=useAppNavigation()
  return <PageScaffold label={mode==='trips'?'My trips':mode==='saved'?'Saved places':'Profile'} notice={notice} activeNav={mode==='saved'?'profile':mode} onNavigate={onBack} onAssistantPlan={onCreate}><div className={`standard-page library-page library-lens library-lens--${mode} ${mode==='profile'?'profile-agent-page':''}`}><PageHeader title={mode==='trips'?'Journeys':mode==='saved'?'Saved places':'Profile'} onBack={onBack} action={mode==='trips'?<button className="library-add" aria-label="Plan another journey" onClick={onCreate}>+</button>:mode==='saved'?<button className="library-add" aria-label="Discover places" onClick={()=>navigation?navigation.navigate('discover'):onSeason()}><Icon name="compass" size={18}/></button>:undefined}/>
    {mode!=='profile'&&<header className="library-introduction"><span>{mode==='trips'?'YOUR NEXT CHAPTER':'A LITTLE WANDERLUST'}</span><h2>{mode==='trips'?<>Places to go.<br/>Stories to come.</>:<>Keep the places<br/>that stay with you.</>}</h2><p>{mode==='trips'?`${trips.length} ${trips.length===1?'journey':'journeys'}, all in one place.`:`${savedPlaces.length} saved ${savedPlaces.length===1?'place':'places'}. No plans needed yet.`}</p></header>}
    {mode==='trips'&&<><div className="library-journeys">{trips.map(trip=>{
      const hasFuji=trip.destination==='tokyo'&&trip.days.some(day=>day.stops.some(stop=>/fuji|kawaguchi|oishi/i.test(stop.title)))
      const stage=tripStage(trip)
      const remaining=tripBudget(trip)-tripSpent(trip)
      return <button className="library-trip" key={trip.id} onClick={()=>onTrip(trip.id)} aria-label={`Open ${hasFuji?'Tokyo and Fuji':trip.city} journey`}><img src={hasFuji?'/images/fuji-lake-autumn-portrait.jpg':trip.image} alt="" loading="lazy"/><span className="library-trip-shade"/><div className="library-trip-top"><small>{stage==='upcoming'?'Coming up':stage==='past'?'Past journey':'Travelling'}</small><span>{trip.id==='tokyo-demo'?'Sample journey':'Draft journey'}</span></div><div className="library-trip-copy"><span className="library-trip-country">{trip.country}</span><h2>{hasFuji?<>Tokyo<br/>& Fuji.</>:trip.city}</h2><p>{dateRange(trip)}</p><div className="library-trip-foot"><span>{trip.days.length} days · {trip.travellers} travellers<small>{remaining>=0?`${money(remaining)} remaining`:`${money(-remaining)} over budget`}</small></span><i><Icon name="arrow" size={21}/></i></div></div></button>
    })}</div><button className="library-create" onClick={onCreate}><span className="library-create-symbol">+</span><span><strong>Make room for another escape.</strong><small>Start a new journey</small></span><Icon name="arrow" size={19}/></button><button className="library-explore" onClick={onSeason}><Icon name="compass" size={17}/><span>A little inspiration?<small>Explore this season</small></span><Icon name="arrow" size={17}/></button><p className="library-local-note">Journeys are saved on this device.</p></>}
    {mode==='saved'&&<>{savedPlaces.length===0?<div className="j-empty"><Icon name="bookmark" size={33}/><h3>Keep a little wanderlust.</h3><p>Tap a bookmark in This Season or Discover to save a place. It won’t change any existing trip.</p><button className="j-primary" onClick={onSeason}>Explore this season</button></div>:<div className="discover-list">{savedPlaces.map(activity=><ActivityCard key={activity.id} activity={activity} saved onToggleSaved={()=>onToggleSaved(activity.id)} onOpen={()=>onActivity(activity.id)} layout="ticket"/>)}</div>}</>}
    {mode==='profile'&&<>
      <ProfileAccount account={account} onSaveAccount={onSaveAccount} onSetDemoSession={onSetDemoSession} onNotice={setNotice}/>
      <ProfileAgentCenter trips={trips} onUpdateTrip={onUpdateTrip} onTrip={onTrip} onCreate={onCreate} onNotice={setNotice}/>
      <div className="profile-personal-space"><h3>Personal space</h3>
      <button className="profile-saved-entry j-glass" onClick={onSaved}>
        <span className="profile-saved-icon"><Icon name="bookmark" size={23}/></span>
        <span className="profile-saved-copy"><strong>Saved places</strong><small>{savedPlaces.length===0?'Your next adventure starts here.':`${savedPlaces.length} ${savedPlaces.length===1?'place':'places'} to come back to.`}</small></span>
        <Icon name="arrow" size={19}/>
      </button>
      <details className="profile-defaults"><summary><span className="profile-detail-icon"><Icon name="compass" size={20}/></span><span><strong>Travel preferences</strong><small>Your starting point for future journeys</small></span><Icon name="chevron" size={18}/></summary><div className="profile-defaults-content"><p>Comfort, food and pace defaults for new journeys. These won’t change a trip you’ve already planned.</p><PreferenceFields value={draft} onChange={setDraft}/><button className="j-primary" onClick={()=>{onPreferences(draft);setNotice('Travel preferences saved. Existing journeys stay unchanged.')}}>Save travel preferences</button></div></details>
      </div>
      <p className="profile-device-note"><Icon name="document" size={15}/><span>Local prototype. Settings and journeys stay on this device; no calendar, payment or cloud account is connected. Please use sample information.</span></p>
    </>}
  </div></PageScaffold>
}
