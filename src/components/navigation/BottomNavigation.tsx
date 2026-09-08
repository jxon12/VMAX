import type { RefObject } from 'react'
import { Icon } from '../ui/Icon'
import { Orb } from '../ui/Orb'
import '../../styles/navigation.css'
export type NavDestination = 'home' | 'discover' | 'trips' | 'saved' | 'profile'
type Props = { orbRef: RefObject<HTMLSpanElement | null>; orbHidden: boolean; onAskVMax: () => void; activeItem?: NavDestination; onNavigate: (destination: NavDestination) => void }
export function BottomNavigation({orbRef,orbHidden,activeItem,onAskVMax,onNavigate}:Props){
  const profileActive = activeItem === 'profile' || activeItem === 'saved'
  return <nav className="bottom-nav" aria-label="Primary navigation">
    <button className={activeItem==='home'?'active':''} aria-label="Home" aria-current={activeItem==='home'?'page':undefined} onClick={()=>onNavigate('home')}><Icon name="home"/><small>Home</small></button>
    <button className={activeItem==='trips'?'active':''} aria-label="Journeys" aria-current={activeItem==='trips'?'page':undefined} onClick={()=>onNavigate('trips')}><Icon name="compass"/><small>Journey</small></button>
    <button className="orb-button" aria-label="Ask V-MAX" onClick={onAskVMax}><Orb ref={orbRef} hidden={orbHidden}/><small>V-MAX</small></button>
    <button className={profileActive?'active':''} aria-label="Profile" aria-current={profileActive?'page':undefined} onClick={()=>onNavigate('profile')}><Icon name="user"/><small>Profile</small></button>
  </nav>
}
