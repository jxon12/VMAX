import { activities, type Activity } from '../data/discoveryData'
import type { Stop, Trip, TripRequest, Preferences } from '../types/trips'

// Fixed and visibly labelled so a demo never changes its story overnight.
export const DEMO_TODAY = '2026-09-13'
export const money = (n: number) => `MYR ${n.toLocaleString('en-MY', { maximumFractionDigits: 2 })}`
export const uid = () => crypto.randomUUID()
export const dateAt = (date: string, offset = 0) => new Date(Date.parse(`${date}T00:00:00Z`) + offset * 86400000).toISOString().slice(0, 10)
export const dayCount = (start: string, end: string) => Math.round((Date.parse(end) - Date.parse(start)) / 86400000) + 1
export const isISODate = (date: string) => /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(date)) && dateAt(date) === date
export const formatDate = (date: string, weekday = false) => new Date(`${date}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', ...(weekday ? { weekday: 'short' as const } : {}), timeZone: 'UTC' })
export const dateRange = (trip: Pick<Trip, 'startDate' | 'endDate'>) => `${formatDate(trip.startDate)} – ${formatDate(trip.endDate)}, ${trip.endDate.slice(0, 4)}`
export const minutes = (time: string) => { const [h, m] = time.split(':').map(Number); return h * 60 + m }
export const timeOf = (value: number) => `${String(Math.floor(value / 60) % 24).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`
export const DEFAULT_PREFERENCES: Preferences = { mobility: ['Low walking'], dietary: [], pace: 'Balanced days', interests: ['Food', 'Culture'] }
export const DESTINATIONS: Record<string, { city: string; country: string; image: string }> = {
  tokyo: { city: 'Tokyo', country: 'Japan', image: '/images/tokyo-ginkgo-crowd.jpg' },
  kyoto: { city: 'Kyoto', country: 'Japan', image: '/images/arashiyama-morning.png' },
  iceland: { city: 'Iceland', country: 'Iceland', image: '/images/iceland-aurora.png' },
  shanghai: { city: 'Shanghai', country: 'China', image: '/images/shanghai-disney-10.jpg' },
  marrakech: { city: 'Marrakech', country: 'Morocco', image: '/images/marrakech-evening.png' },
  banff: { city: 'Banff', country: 'Canada', image: '/images/banff-larch-season.png' },
  patagonia: { city: 'El Chaltén', country: 'Argentina', image: '/images/patagonia-spring.png' },
}
export const destinationOf = (activity: Activity) => {
  if (activity.country === 'Japan') return activity.location.includes('Kyoto') ? 'kyoto' : 'tokyo'
  return ({ China: 'shanghai', Iceland: 'iceland', Morocco: 'marrakech', Canada: 'banff', Argentina: 'patagonia' } as Record<string, string>)[activity.country] ?? ''
}
export const activityFitsTrip = (activity: Activity, trip: Pick<Trip, 'destination'>) => destinationOf(activity) === trip.destination
const WINDOWS: Record<string, [string, string]> = {
  'iceland-aurora': ['10-01', '03-28'], 'banff-larches': ['09-18', '10-05'],
  'marrakech-evening': ['10-10', '11-30'], 'patagonia-spring': ['10-20', '12-15'],
  'arashiyama-morning': ['11-10', '11-30'], 'gion-evening': ['10-24', '11-30'],
  'tokyo-ginkgo-accessible': ['11-20', '12-10'],
}
export const inSeason = (activity: Activity, date = DEMO_TODAY) => {
  if (activity.id === 'shanghai-disney-10') return date >= '2026-03-20' && date <= '2026-12-31'
  const window = WINDOWS[activity.id]
  if (!window) return true
  const d = date.slice(5)
  return window[0] > window[1] ? d >= window[0] || d <= window[1] : d >= window[0] && d <= window[1]
}
export const seasonalLabel = (activity: Activity) => inSeason(activity) ? 'In season · demo calendar' : `Plan ahead · ${activity.season}`
export const recommendedStart = (activity?: Activity) => {
  if (!activity) return '2026-11-12'
  const window = WINDOWS[activity.id]
  return window ? `2026-${window[0]}` : '2026-09-14'
}
export const activityCost = (activity: Activity) => activity.budgetTier === 'Free' ? 0 : activity.budgetTier === 'Premium' ? 400 : 80
export const activityDuration = (activity: Activity) => activity.id === 'shanghai-disney-10' ? 420 : activity.id === 'iceland-aurora' ? 180 : activity.mood === 'Adventure' ? 180 : 90
export const activityTime = (activity: Activity) => activity.id === 'iceland-aurora' ? '20:00' : /evening|golden-hour/.test(activity.id) ? '17:30' : '09:30'
export const makeStop = (title: string, time: string, kind: Stop['kind'] = 'activity', duration = 60): Stop => ({ id: uid(), title, time, kind, duration, cost: 0, done: false })
export const stopFromActivity = (activity: Activity, time = activityTime(activity)): Stop => ({ ...makeStop(activity.title, time, 'activity', activityDuration(activity)), activityId: activity.id, image: activity.image, cost: activityCost(activity) })
export const isGentle = (trip: Pick<Trip, 'mobility' | 'pace'>) => trip.mobility.length > 0 || trip.pace === 'Slow & relaxed'
export const routeLeg = (from: Stop, to: Stop, trip: Pick<Trip, 'mobility' | 'pace' | 'destination'>) => {
  const nearby = from.kind === 'rest' || to.kind === 'rest' || from.kind === 'meal' || to.kind === 'meal'
  return { from: from.title, to: to.title, duration: nearby ? 10 : trip.destination === 'iceland' ? 45 : 25, mode: nearby ? 'Nearby connection' : isGentle(trip) ? 'Transfer / step-free option' : 'Transit option' }
}
const sharesParticipants = (a: Stop, b: Stop) => !a.participantIds || !b.participantIds || a.participantIds.some(id => b.participantIds!.includes(id))
export const dayIssues = (stops: Stop[], trip: Pick<Trip, 'mobility' | 'dietary' | 'pace' | 'destination' | 'startDate' | 'travellerTypes'> & Partial<Pick<Trip, 'members'>>, day: number) => {
  const issues: string[] = []
  const sorted = [...stops].sort((a, b) => minutes(a.time) - minutes(b.time))
  sorted.forEach(stop => {
    const a = activities.find(a => a.id === stop.activityId)
    if (a && trip.travellerTypes?.includes('Children') && !a.audiences.includes('Family')) issues.push(`${a.title}: check age suitability before taking children.`)
    if (a && trip.travellerTypes?.includes('Older travellers') && !a.audiences.includes('Older travellers')) issues.push(`${a.title}: review activity demands and rest options with your group.`)
    if (a && !inSeason(a, dateAt(trip.startDate, day - 1))) issues.push(`${a.title}: outside the suggested seasonal window.`)
    if (a && trip.mobility.includes('Step-free') && !a.mobilityTags.includes('Step-free')) issues.push(`${a.title}: step-free access needs confirmation.`)
    if (a && trip.dietary.some(need => !a.dietaryTags.includes(need))) issues.push(`${a.title}: confirm your dietary requests with the venue.`)
    if (minutes(stop.time) + stop.duration > 1440) issues.push(`${stop.title}: ends after midnight; shorten it or start earlier.`)
  })
  // Split plans have separate timelines. Check each traveller's next actual stop,
  // including shared reunions, instead of connecting unrelated parallel stops.
  const participantIds = [...new Set([...(trip.members ?? []).map(member => member.id), ...sorted.flatMap(stop => stop.participantIds ?? [])])]
  const streams = participantIds.length ? participantIds.map(id => sorted.filter(stop => !stop.participantIds || stop.participantIds.includes(id))) : [sorted]
  streams.forEach(stream => stream.forEach((stop, index) => {
    const next = stream[index + 1]
    if (next && minutes(stop.time) + stop.duration + routeLeg(stop, next, trip).duration > minutes(next.time)) issues.push(`Allow more time between ${stop.title} and ${next.title}.`)
  }))
  return [...new Set(issues)]
}
export function createTrip(request: TripRequest): Trip {
  if (!isISODate(request.startDate) || !isISODate(request.endDate)) throw new Error('Choose valid departure and return dates.')
  if (!DESTINATIONS[request.destination] || !Number.isInteger(request.travellers) || request.travellers < 1 || request.travellers > 12 || !Number.isFinite(request.budgetPerPerson) || request.budgetPerPerson <= 0 || !Number.isFinite(dayCount(request.startDate, request.endDate)) || dayCount(request.startDate, request.endDate) < 1 || dayCount(request.startDate, request.endDate) > 30) throw new Error('Choose valid dates (1–30 days), 1–12 travellers and a positive budget.')
  const names = ['You', 'Louise', 'Simyee', 'Joshua']; const colors = ['#a59afa', '#67d6bd', '#eeb785', '#8cbef3']
  const members = Array.from({ length: request.travellers }, (_, i) => ({ id: i === 0 ? 'you' : `member-${i}`, name: names[i] ?? `Traveller ${i + 1}`, color: colors[i % 4] }))
  const seed = activities.find(a => a.id === request.seedActivityId && activityFitsTrip(a, request))
  const days = Array.from({ length: dayCount(request.startDate, request.endDate) }, (_, i) => ({ number: i + 1, stops: i === 0 ? [makeStop('Arrive & settle in', '15:00', 'arrival', 90), makeStop('Neighbourhood dinner', '18:30', 'meal', 60)] : [] as Stop[] }))
  if (seed) {
    const day = days[Math.min(1, days.length - 1)]
    day.stops = [stopFromActivity(seed)]
    if (minutes(activityTime(seed)) >= 17 * 60) day.stops.unshift(makeStop('A slow start & local lunch', '12:00', 'meal', 60))
    if (isGentle(request) && activityDuration(seed) < 300) day.stops.push(makeStop('Time to recharge', minutes(activityTime(seed)) >= 1020 ? '15:30' : timeOf(minutes(activityTime(seed)) + activityDuration(seed) + 30), 'rest', 30))
    day.stops.sort((a,b) => minutes(a.time) - minutes(b.time))
  }
  return {
    ...request, mobility:[...request.mobility], dietary:[...request.dietary], interests:[...request.interests], travellerTypes:[...(request.travellerTypes??[])], ...DESTINATIONS[request.destination], id: uid(), members, days, activeDay: 1, activeTab: 'overview',
    messages: [{ id: uid(), sender: 'vmax', text: `Welcome to ${DESTINATIONS[request.destination].city}. This is your shared planning space. @V-MAX can draft a slower day for you to review.`, time: '09:00' }], readMessages: 0, expenses: [],
    checklist: ['Check passport validity', 'Confirm entry requirements', 'Confirm transport & accommodation', 'Check accessibility with venues', 'Pack medication & essentials', 'Download tickets for offline use'].map((label,i) => ({id:`check-${i}`,label,done:false})),
    documents: [{id:'flight',title:'Boarding pass',detail:'Add booking details after check-in',ready:false},{id:'hotel',title:'Accommodation',detail:'Keep your booking reference here',ready:false},{id:'insurance',title:'Travel insurance',detail:'Keep your policy number here',ready:false}],
  }
}
export function seedTokyo(): Trip {
  const trip = createTrip({ ...DEFAULT_PREFERENCES, destination: 'tokyo', startDate:'2026-09-14', endDate:'2026-09-20', travellers:4, budgetPerPerson:7000, mobility:['Step-free','Low walking'], dietary:['Vegetarian'] })
  trip.id = 'tokyo-demo'
  trip.days[1].stops = [{ ...makeStop('Shibuya crossing & neighbourhood', '10:00', 'activity', 90), image:'/images/tokyo-night.png' }, makeStop('Lunch near Shibuya', '12:00', 'meal', 60), { ...makeStop('Meiji Jingu', '14:00', 'activity', 90), image:'/images/arashiyama-morning.png' }, makeStop('Café break', '16:00', 'rest', 30)]
  trip.days[2].stops = [
    makeStop('Transfer to Lake Kawaguchi', '08:00', 'arrival', 120),
    { ...makeStop('Lake Kawaguchi · Fuji viewpoint', '10:30', 'activity', 90), image:'/images/fuji-lake-autumn-portrait.jpg' },
    makeStop('Lunch with a Fuji view', '12:30', 'meal', 60),
    { ...makeStop('Oishi Park & lakeside rest', '14:15', 'activity', 75), image:'/images/fuji-lake-autumn-portrait.jpg' },
    makeStop('Return to Tokyo', '16:15', 'arrival', 120),
  ]
  trip.expenses = [{id:'stay-demo',title:'Accommodation deposit (sample)',amount:4900,category:'Stay',paidBy:'you',splitWith:trip.members.map(m=>m.id)}, {id:'transport-demo',title:'Flights (sample)',amount:3740,category:'Transport',paidBy:'member-1',splitWith:trip.members.map(m=>m.id)}]
  trip.messages.push({id:'welcome-louise',sender:'member-1',text:'AHHHHHH can’t wait for Shibuya!!! Let’s plan our first full day.',time:'09:12'})
  trip.checklist[0].done = true
  trip.documents[0] = {id:'flight',title:'Boarding pass',detail:'Sample pass · not valid for travel',ready:false,sample:true}
  return trip
}
export const tripSpent = (trip: Trip) => trip.expenses.reduce((sum,e)=>sum+e.amount,0)
export const tripBudget = (trip: Trip) => trip.travellers * trip.budgetPerPerson
export const tripStage = (trip: Trip) => {
  const demo = trip.id === 'tokyo-demo' && trip.destination === 'tokyo' && trip.startDate === '2026-09-14' && trip.endDate === '2026-09-20'
  const now = new Date()
  const today = demo ? trip.demoPhase === 'during' ? '2026-09-15' : DEMO_TODAY : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  return today < trip.startDate ? 'upcoming' : today > trip.endDate ? 'past' : 'travelling'
}
export function softenDay(trip: Trip, day: number): Trip {
  const current = trip.days.find(d=>d.number===day)
  if (!current || current.softened || current.stops.length === 0) return trip
  const stops = current.stops.map(s=>({...s})); const pivot = stops.findIndex(s=>s.kind === 'activity'); const index = pivot < 0 ? 0 : pivot
  const start = minutes(stops[index].time) + stops[index].duration + 15
  if (start + 30 > 1439) return trip
  const rest = { ...makeStop('A little breathing room',timeOf(start),'rest',30), ...(stops[index].participantIds ? { participantIds: [...stops[index].participantIds] } : {}) }
  stops.splice(index + 1,0,rest)
  const affected = [rest]
  for (let i=index+2; i<stops.length; i++) {
    const preceding = affected.filter(previous => sharesParticipants(previous, stops[i]))
    if (!preceding.length) continue
    const earliest = Math.max(...preceding.map(previous => minutes(previous.time)+previous.duration+routeLeg(previous,stops[i],trip).duration))
    const adjusted = Math.max(minutes(stops[i].time),earliest)
    if (adjusted + stops[i].duration > 1440) return trip
    if (adjusted !== minutes(stops[i].time)) { stops[i].time = timeOf(adjusted); affected.push(stops[i]) }
  }
  return {...trip,days:trip.days.map(d=>d.number===day?{...d,stops:stops.sort((a,b)=>minutes(a.time)-minutes(b.time)),softened:true}:d)}
}
export function reorderDay(trip: Trip, day: number, from: number, to: number): Trip {
  const current=trip.days.find(d=>d.number===day)
  if (!current || !Number.isInteger(from) || !Number.isInteger(to) || from<0 || to<0 || from>=current.stops.length || to>=current.stops.length || from===to) return trip
  const stops=current.stops.map(s=>({...s})); const start=minutes(stops[0].time); const [moving]=stops.splice(from,1);stops.splice(to,0,moving)
  let cursor=start
  for(let i=0;i<stops.length;i++){ stops[i].time=timeOf(cursor);cursor+=stops[i].duration+(stops[i+1]?routeLeg(stops[i],stops[i+1],trip).duration:0) }
  if(cursor>1440) return trip
  return {...trip,days:trip.days.map(d=>d.number===day?{...d,stops}:d)}
}
