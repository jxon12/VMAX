import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { activities } from '../data/discoveryData'
import { seasonalLabel, destinationOf, DESTINATIONS } from '../domain/trips'
import { PageScaffold } from '../components/layout/PageScaffold'
import { Icon } from '../components/ui/Icon'
import '../styles/season-swipe.css'
import '../styles/discovery-lens.css'

export type SeasonPosition = { index: number; category: string }
type Props = {
  savedIds: Set<string>
  position: SeasonPosition
  onPosition: (value: SeasonPosition) => void
  onBack: () => void
  onDiscover: () => void
  onSaved: () => void
  onOpenActivity: (id: string) => void
  onToggleSaved: (id: string) => void
}

export function SeasonPage({ savedIds, position, onPosition, onBack, onDiscover, onSaved, onOpenActivity, onToggleSaved }: Props) {
  const [delta, setDelta] = useState(0)
  const [exiting, setExiting] = useState(false)
  const [notice, setNotice] = useState('')
  const start = useRef<{ x: number; y: number } | null>(null)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const preferred = ['iceland-aurora', 'shanghai-disney-10', 'arashiyama-morning', 'tokyo-ginkgo-accessible']
  const deck = activities.filter(a => a.seasonal !== false && (
    position.category === 'For everyone' ||
    (position.category === 'With family' ? a.audiences.includes('Family') :
      position.category === 'Easy going' ? a.mobilityTags.includes('Low walking') || a.mobilityTags.includes('Step-free') :
        a.mood === 'Adventure')
  )).sort((a, b) => (preferred.includes(a.id) ? preferred.indexOf(a.id) : 99) - (preferred.includes(b.id) ? preferred.indexOf(b.id) : 99))
  const index = Math.max(0, Math.min(position.index, deck.length - 1))
  const activity = deck[index]
  const preview = deck[index + (delta > 0 ? -1 : 1)]
  const saved = activity && savedIds.has(activity.id)

  const navigateCard = (direction: -1 | 1) => {
    if (!activity || exiting) return
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= deck.length) {
      setDelta(0)
      setNotice(direction < 0 ? 'First place.' : 'Last place.')
      return
    }
    // Advancing moves the current card left; going back moves it right.
    setDelta(-direction * 520)
    setExiting(true)
    timer.current = window.setTimeout(() => {
      onPosition({ ...position, index: targetIndex })
      setNotice(`Place ${targetIndex + 1} of ${deck.length}. ${deck[targetIndex].title}.`)
      setDelta(0)
      setExiting(false)
    }, 300)
  }

  const down = (e: PointerEvent<HTMLElement>) => {
    if ((e.target as HTMLElement).closest('button') || exiting || (e.pointerType === 'mouse' && e.button !== 0)) return
    start.current = { x: e.clientX, y: e.clientY }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const move = (e: PointerEvent<HTMLElement>) => {
    if (!start.current || exiting) return
    const x = e.clientX - start.current.x
    const y = e.clientY - start.current.y
    if (Math.abs(y) > Math.abs(x) + 15) {
      start.current = null
      setDelta(0)
      return
    }
    const atBoundary = (x > 0 && index === 0) || (x < 0 && index === deck.length - 1)
    setDelta(atBoundary ? x * .2 : x)
  }
  const up = (e: PointerEvent<HTMLElement>) => {
    if (!start.current) return
    const distance = e.clientX - start.current.x
    const verticalDistance = e.clientY - start.current.y
    start.current = null
    if (Math.abs(distance) > 85 && Math.abs(distance) > Math.abs(verticalDistance)) navigateCard(distance < 0 ? 1 : -1)
    else setDelta(0)
  }

  return (
    <PageScaffold className="season-lens-shell" label="This season" notice="" activeNav="discover" onNavigate={onDiscover} onAssistantPlan={() => {}}>
      <div className="season-swipe-page">
        {activity && <div key={activity.id} className="season-lens-atmosphere" aria-hidden="true" style={{ backgroundImage: `url("${activity.image}")` }} />}
        <header className="swipe-topbar">
          <button className="j-icon-button" aria-label="Back" onClick={onBack}><span className="j-back"><Icon name="arrow" /></span></button>
          <h1 className="swipe-title">This season</h1>
          <button className="j-icon-button" aria-label="View saved places" onClick={onSaved}><Icon name="bookmark" /></button>
        </header>
        <div className="swipe-categories" aria-label="Seasonal recommendations">
          {['For everyone', 'With family', 'Easy going', 'Adventure'].map(category => (
            <button key={category} aria-pressed={position.category === category} disabled={exiting} onClick={() => {
              onPosition({ index: 0, category })
              setDelta(0)
              start.current = null
              setNotice('')
            }}>{category}</button>
          ))}
        </div>
        {activity ? (
          <div className="swipe-deck">
            {preview && <div className="swipe-card-back" aria-hidden="true"><img src={preview.image} alt="" /></div>}
            <article
              tabIndex={0}
              aria-roledescription="swipeable destination card"
              aria-label={`${activity.title}. Right arrow for next place; left arrow for previous place.`}
              className={`swipe-destination ${exiting ? 'exiting' : ''} ${delta ? 'dragging' : ''}`}
              style={{ transform: `translate3d(${delta}px, 0, 0) rotate(${delta / 70}deg)` }}
              onPointerDown={down}
              onPointerMove={move}
              onPointerUp={up}
              onPointerCancel={() => { start.current = null; setDelta(0) }}
              onKeyDown={e => {
                if (e.target !== e.currentTarget) return
                if (e.key === 'ArrowRight') { e.preventDefault(); navigateCard(1) }
                if (e.key === 'ArrowLeft') { e.preventDefault(); navigateCard(-1) }
              }}
            >
              <img src={activity.image} alt={activity.title} draggable={false} />
              <div className="swipe-photo-shade" />
              <div className="swipe-card-top">
                <span aria-label={`Place ${index + 1} of ${deck.length}`}>{String(index + 1).padStart(2, '0')} <i>/ {String(deck.length).padStart(2, '0')}</i></span>
                <button aria-label={saved ? 'Remove current place from saved' : 'Save current place'} aria-pressed={saved} disabled={exiting} onClick={() => {
                  onToggleSaved(activity.id)
                  setNotice(saved ? 'Removed from saved.' : 'Place saved.')
                }}><Icon name={saved ? 'check' : 'bookmark'} size={20} /></button>
              </div>
              <div className="swipe-card-copy">
                <span className="swipe-window">{seasonalLabel(activity)}</span>
                <h2>{DESTINATIONS[destinationOf(activity)]?.city ?? activity.country}</h2>
                <h3>{activity.title}</h3>
                <p>{activity.summary}</p>
                <div className="swipe-detail-row">
                  <span><Icon name="calendar" size={15} />{activity.date}</span>
                  <button disabled={exiting} onClick={() => onOpenActivity(activity.id)} aria-label={`Details about ${activity.title}`}>Details <Icon name="arrow" size={17} /></button>
                </div>
              </div>
            </article>
          </div>
        ) : (
          <div className="swipe-finished">
            <Icon name="compass" size={30} />
            <h2>No places in this category.</h2>
            <button className="j-primary" onClick={() => onPosition({ category: 'For everyone', index: 0 })}>See all places</button>
          </div>
        )}
        <span className="swipe-status" role="status" aria-live="polite">{notice}</span>
      </div>
    </PageScaffold>
  )
}
