import { useEffect, useState } from 'react'
import { DEFAULT_PREFERENCES, seedTokyo, DESTINATIONS, dayCount, minutes } from '../domain/trips'
import { normalizeAgentTrip } from '../domain/agents'
import type { Preferences, Trip } from '../types/trips'
import type { LocalProfile, ProfileDetails } from '../types/profile'
import { emptyProfile, nameLocalOwner, saveLocalProfile, setLocalDemoSession, withLocalProfile } from '../domain/profile'
const KEY = 'vmax-travel-v2'
type TravelState = { version: 2; trips: Trip[]; savedIds: string[]; preferences: Preferences; profile: LocalProfile }
const fresh = (): TravelState => ({version:2,trips:[normalizeAgentTrip(seedTokyo())],savedIds:[],preferences:DEFAULT_PREFERENCES,profile:emptyProfile()})
const stringList=(value:unknown):value is string[]=>Array.isArray(value)&&value.every(v=>typeof v==='string')
function validPreferences(p:Preferences){
  return p&&stringList(p.mobility)&&stringList(p.dietary)&&stringList(p.interests)&&typeof p.pace==='string'&&(p.travellerTypes===undefined||stringList(p.travellerTypes))
}
function validTrip(t:Trip){
  return t&&typeof t.id==='string'&&DESTINATIONS[t.destination]&&typeof t.city==='string'&&typeof t.image==='string'
    &&Number.isInteger(t.travellers)&&t.travellers>=1&&t.travellers<=12&&Number.isFinite(t.budgetPerPerson)&&t.budgetPerPerson>0
    &&Array.isArray(t.days)&&t.days.length>=1&&t.days.length<=30&&dayCount(t.startDate,t.endDate)===t.days.length
    &&Number.isInteger(t.activeDay)&&t.activeDay>=1&&t.activeDay<=t.days.length&&['overview','plan','map','group','budget'].includes(t.activeTab)
    &&validPreferences(t)&&Array.isArray(t.members)&&t.members.length===t.travellers&&t.members.every(m=>m&&typeof m.id==='string'&&typeof m.name==='string'&&typeof m.color==='string')
    &&Array.isArray(t.messages)&&t.messages.every(m=>m&&typeof m.text==='string'&&typeof m.sender==='string'&&typeof m.id==='string')&&Number.isInteger(t.readMessages)&&t.readMessages>=0
    &&Array.isArray(t.expenses)&&t.expenses.every(e=>e&&typeof e.id==='string'&&typeof e.title==='string'&&Number.isFinite(e.amount)&&e.amount>0&&['Stay','Food','Transport','Activities'].includes(e.category)&&t.members.some(m=>m.id===e.paidBy)&&stringList(e.splitWith)&&e.splitWith.length>0&&new Set(e.splitWith).size===e.splitWith.length&&e.splitWith.every(id=>t.members.some(m=>m.id===id)))
    &&Array.isArray(t.checklist)&&t.checklist.length>0&&t.checklist.every(c=>c&&typeof c.label==='string'&&typeof c.done==='boolean')
    &&Array.isArray(t.documents)&&t.documents.every(d=>d&&typeof d.title==='string'&&typeof d.detail==='string'&&typeof d.ready==='boolean')
    &&t.days.every((d,i)=>d&&d.number===i+1&&Array.isArray(d.stops)&&d.stops.every(s=>s&&typeof s.id==='string'&&typeof s.title==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(s.time)&&Number.isFinite(s.duration)&&s.duration>0&&minutes(s.time)+s.duration<=1440&&Number.isFinite(s.cost)&&s.cost>=0))
}
function readStore():{state:TravelState;problem:string;writable:boolean}{
  try{
    const raw=localStorage.getItem(KEY)
    if(!raw)return {state:fresh(),problem:'',writable:true}
    const parsed=JSON.parse(raw)
    if(parsed.version===2&&Array.isArray(parsed.trips)&&parsed.trips.every(validTrip)&&new Set(parsed.trips.map((t:Trip)=>t.id)).size===parsed.trips.length&&stringList(parsed.savedIds)&&validPreferences(parsed.preferences)){
      const state:TravelState=withLocalProfile({...parsed,trips:parsed.trips.map(normalizeAgentTrip)})
      return {state,problem:'',writable:true}
    }
    return {state:fresh(),problem:'Previous local data could not be read and has NOT been overwritten. This session uses a temporary demo.',writable:false}
  }catch{return {state:fresh(),problem:'Device storage could not be read. Previous data has not been overwritten; this session is temporary.',writable:false}}
}
export function useTravelStore(){
  const [initial]=useState(readStore)
  const [state,setState]=useState<TravelState>(initial.state)
  const [writeError,setWriteError]=useState('')
  useEffect(()=>{
    if(!initial.writable)return
    try{localStorage.setItem(KEY,JSON.stringify(state));setWriteError('')}
    catch{setWriteError('Device storage is unavailable. Changes last only for this session.')}
  },[state,initial.writable])
  const updateTrip=(id:string,updater:(trip:Trip)=>Trip)=>setState(s=>({...s,trips:s.trips.map(t=>t.id===id?nameLocalOwner(normalizeAgentTrip(updater(t)),s.profile.displayName):t)}))
  const addTrip=(trip:Trip)=>setState(s=>({...s,trips:s.trips.some(t=>t.id===trip.id)?s.trips:[nameLocalOwner(normalizeAgentTrip(trip),s.profile.displayName),...s.trips]}))
  const toggleSaved=(id:string)=>setState(s=>({...s,savedIds:s.savedIds.includes(id)?s.savedIds.filter(i=>i!==id):[...s.savedIds,id]}))
  const setPreferences=(preferences:Preferences)=>setState(s=>({...s,preferences}))
  const saveProfile=(details:ProfileDetails)=>setState(s=>saveLocalProfile(s,details))
  const setDemoSession=(active:boolean)=>setState(s=>setLocalDemoSession(s,active))
  return {state,storageError:initial.problem||writeError,updateTrip,addTrip,toggleSaved,setPreferences,saveProfile,setDemoSession}
}
