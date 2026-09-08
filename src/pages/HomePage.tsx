import { useState } from 'react'
import { HomeHeader } from '../components/home/HomeHeader'
import { SeasonCarousel } from '../components/home/SeasonCarousel'
import { SeasonHero } from '../components/home/SeasonHero'
import { UpcomingJourney } from '../components/home/UpcomingJourney'
import { NextUp, TripUpdates } from '../components/home/JourneyHomeSections'
import { TripWallet } from '../components/home/TripWallet'
import { formatDate, dayCount } from '../domain/trips'
import { PageScaffold } from '../components/layout/PageScaffold'
import type { NavDestination } from '../components/navigation/BottomNavigation'
import { CreateTripSheet, type CreateTripStep } from '../components/sheets/CreateTripSheet'
import { useTransientNotice } from '../hooks/useTransientNotice'
import '../styles/home.css'
import '../styles/home-lens.css'
import { Icon } from '../components/ui/Icon'
import { journeyNow } from '../domain/agents'
import { sendGroupMessage } from '../domain/group'
import type { Trip } from '../types/trips'

type HomePageProps = {
  trip?: Trip
  onAllTrips: () => void
  onSearchResults: (query: string) => void
  onOpenSeason: () => void
  onOpenActivity: (id: string) => void
  onOpenJourney: (tab?: Trip['activeTab'], day?: number) => void
  onUpdateTrip: (update: (trip: Trip) => Trip) => void
  onStartPlanner: (prompt: string, group: boolean) => void
  onDiscover: () => void
}

export function HomePage({ trip, onAllTrips, onOpenSeason, onOpenActivity, onOpenJourney, onUpdateTrip, onStartPlanner, onDiscover }: HomePageProps) {
  const [createTripStep, setCreateTripStep] = useState<CreateTripStep>('closed')
  const { notice, setNotice } = useTransientNotice()
  const now=trip?journeyNow(trip):undefined
  const hasFuji=trip?.days.some(day=>day.stops.some(stop=>/fuji|kawaguchi|oishi/i.test(stop.title)))??false
  const daysAway=trip?Math.max(0,dayCount(now?.date??trip.startDate,trip.startDate)-1):0
  const ended=!!trip&&!!now&&now.date>trip.endDate
  const navigate = (destination: NavDestination) => {
    if (destination === 'discover') onDiscover()
    else onAllTrips()
  }

  return (
    <PageScaffold label="V-MAX travel home" className="journey-home" notice={notice} onNavigate={navigate} journeyAssistant={!!trip} assistantTrip={trip} onAssistantReview={kind=>onOpenJourney(kind==='group'?'group':kind==='documents'?'overview':'plan',kind==='museum'?trip?.proposals?.find(p=>p.kind==='museum')?.day:kind==='reunion'?2:now?.day)} onAssistantPlan={(prompt) => { if(trip){if(prompt)onUpdateTrip(t=>sendGroupMessage(t, '@V-MAX, '+prompt));onOpenJourney('group')}else if(prompt)onStartPlanner(prompt,false) }}>
        <div className="home-lens-hero">
          <img
            className="hero-photo"
            src={hasFuji||!trip?"/images/fuji-lake-autumn-portrait.jpg":trip.image}
            alt={hasFuji||!trip?"Mount Fuji above a sunlit lake":trip.city}
          />
          <div className="hero-shade" />
          <div className="home-lens-hero-content">
            <HomeHeader
              onBrandClick={() => setNotice('Welcome to V-MAX')}
              onCreateTrip={() => trip ? onOpenJourney('group') : setCreateTripStep('choose')}
              members={trip?.members}
            />
            {trip ? <section className="season-hero home-personal-hero">
              <p className="home-hero-eyebrow">{ended?'YOUR ESCAPE, REMEMBERED':now?.phase==='during'?'YOUR ESCAPE, UNDERWAY':'YOUR NEXT ESCAPE'}</p>
              <h1>{hasFuji ? 'Fuji' : trip.city}<br/>{ended?'stays with you.':'is calling.'}</h1>
              <p className="home-trip-dates">{formatDate(trip.startDate)} – {formatDate(trip.endDate)}<span>·</span>{trip.travellers} travellers</p>
              <button className="home-hero-link lens-glass" onClick={() => onOpenJourney('overview')}>
                <span className="home-hero-journey-icon"><Icon name={ended?'check':now?.phase==='during'?'compass':'plane'} size={20}/></span>
                <span className="home-hero-journey-copy"><small>{ended?'Your journey, kept together':daysAway?`${daysAway} ${daysAway===1?'day':'days'} to go`:'Your journey is underway'}</small><strong>Step into your journey</strong></span>
                <span className="home-hero-journey-arrow"><Icon name="arrow" size={18}/></span>
              </button>
            </section> : <SeasonHero/>}
          </div>
        </div>

        <div className="page-content home-lens-body">
          {trip ? <>
            <TripUpdates key={trip.id} trip={trip} onJourney={onOpenJourney} onUpdate={onUpdateTrip}/>
            <NextUp key={`next-${trip.id}`} trip={trip} onJourney={onOpenJourney} onUpdate={onUpdateTrip}/>
            <TripWallet key={`wallet-${trip.id}`} trip={trip} onUpdate={onUpdateTrip}/>
          </> : <><SeasonCarousel onSelect={onOpenActivity} onExpand={onOpenSeason}/><UpcomingJourney onOpen={onOpenJourney} onAll={onAllTrips}/></>}
        </div>

        {createTripStep !== 'closed' && (
          <CreateTripSheet
            step={createTripStep}
            onStepChange={setCreateTripStep}
            onNotice={setNotice}
            onStartPlanning={(group) => {
              setCreateTripStep('closed')
              onStartPlanner('', group)
            }}
          />
        )}

    </PageScaffold>
  )
}
