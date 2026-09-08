import { Icon } from '../ui/Icon'
import { VMaxLogo } from '../ui/VMaxLogo'

type HomeHeaderProps = {
  onBrandClick: () => void
  onCreateTrip: () => void
  onSearch?: () => void
  members?: { id: string; name: string }[]
}

export function HomeHeader({ onBrandClick, onCreateTrip, onSearch, members }: HomeHeaderProps) {
  return (
    <header className="topbar">
      <button className="wordmark" type="button" aria-label="V-MAX" onClick={onBrandClick}>
        <VMaxLogo className="wordmark-logo" />
      </button>
      <div className="header-actions">
        {members ? <button className="home-header-group lens-glass" aria-label="Open travel group" onClick={onCreateTrip}><span className="home-mini-members" aria-hidden="true">{members.slice(0,2).map(m => <i key={m.id}>{m.name.charAt(0)}</i>)}</span><Icon name="users" size={18}/></button> : <button className="round-button create-trip-button lens-glass" aria-label="Create a trip" onClick={onCreateTrip}>
          <Icon name="users" size={19} /><span className="mini-plus">+</span>
        </button>}
        {onSearch && <button className="round-button" aria-label="Search" onClick={onSearch}>
          <Icon name="search" size={21} />
        </button>}
      </div>
    </header>
  )
}
