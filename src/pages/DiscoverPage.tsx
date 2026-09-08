import { useMemo } from 'react'
import { ActivityCard } from '../components/discovery/ActivityCard'
import { FilterBar, type DiscoverFilters, type FilterKey } from '../components/discovery/FilterBar'
import { PageScaffold } from '../components/layout/PageScaffold'
import type { NavDestination } from '../components/navigation/BottomNavigation'
import { Icon } from '../components/ui/Icon'
import { activities } from '../data/discoveryData'
import { useTransientNotice } from '../hooks/useTransientNotice'
import '../styles/pages.css'
import { destinationOf, inSeason } from '../domain/trips'
import '../styles/discovery-lens.css'
export type DiscoverState = { filters: DiscoverFilters; query: string; filtersOpen: boolean }

type DiscoverPageProps = {
  tripDestination?: string
  browse: DiscoverState
  onBrowseChange: (value: DiscoverState) => void
  savedIds: Set<string>
  onBack: () => void
  onOpenActivity: (id: string) => void
  onToggleSaved: (id: string) => void
}

export function DiscoverPage({ tripDestination, browse, onBrowseChange, savedIds, onBack, onOpenActivity, onToggleSaved }: DiscoverPageProps) {
  const { filters, filtersOpen, query } = browse
  const setQuery = (query: string) => onBrowseChange({ ...browse, query })
  const { notice, setNotice } = useTransientNotice()

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return activities.filter((activity) => {
      const destination = tripDestination?.toLowerCase()
      const matchesTrip = !destination || destinationOf(activity) === destination
      const matchesBrowseMode = Boolean(destination) || activity.seasonal !== false
      const matchesSearch = !normalized || `${activity.title} ${activity.location} ${activity.country} ${activity.mood} ${activity.summary} ${activity.audiences.join(' ')} ${activity.mobilityTags.join(' ')} ${activity.dietaryTags.join(' ')}`.toLowerCase().includes(normalized)
      const matchesFilter =
        (!filters.season || (filters.season === 'In season now' ? inSeason(activity) : filters.season === 'Coming up' ? !inSeason(activity) : activity.id === 'shanghai-disney-10')) &&
        (!filters.mood || activity.mood === filters.mood) &&
        (!filters.mobility || activity.mobilityTags.includes(filters.mobility)) &&
        (!filters.dietary || activity.dietaryTags.includes(filters.dietary)) &&
        (!filters.family || activity.audiences.includes(filters.family as 'Family' | 'Older travellers' | 'Young & trending')) &&
        (!filters.budget || activity.budgetTier === filters.budget)
      return matchesTrip && matchesBrowseMode && matchesSearch && matchesFilter
    })
  }, [filters, query, tripDestination])

  const updateFilter = (key: FilterKey, value: string) => {
    onBrowseChange({ ...browse, filters: { ...filters, [key]: filters[key] === value ? undefined : value } })
  }
  const activeFilterCount = Object.values(filters).filter(Boolean).length

  const navigate = (destination: NavDestination) => {
    if (destination === 'discover') return
    setNotice(`${destination === 'saved' ? 'Saved places' : 'Profile'} is coming next`)
  }

  return (
    <PageScaffold className="discovery-lens-shell" label="Discover" notice={notice} activeNav="discover" onNavigate={navigate} onAssistantPlan={() => setNotice('V-MAX is tailoring these recommendations')}>
      <div className="standard-page discover-page discovery-lens-page">
        <header className="discovery-lens-heading">
          <button className="page-back" aria-label="Back" onClick={onBack}><Icon name="arrow" /></button>
          <div><h1>{tripDestination ? `Explore ${tripDestination[0].toUpperCase()}${tripDestination.slice(1)}` : 'Discover'}</h1><p>{tripDestination ? 'For this journey · choose your day next' : 'The right place. The right moment.'}</p></div>
        </header>
        <div className="discover-toolbar">
          <label className="discover-search"><Icon name="search" size={18} /><input aria-label="Search places, moods or activities" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Place, mood or activity" /></label>
          <button className={`discover-filter-trigger ${filtersOpen ? 'open' : ''} ${activeFilterCount ? 'active' : ''}`} aria-label={filtersOpen ? 'Close filters' : 'Open filters'} aria-expanded={filtersOpen} onClick={() => onBrowseChange({ ...browse, filtersOpen: !filtersOpen })}><Icon name="filter" size={19} />{activeFilterCount > 0 && <span>{activeFilterCount}</span>}</button>
        </div>
        {filtersOpen && <div className="discover-filter-drawer"><FilterBar values={filters} onChange={updateFilter} onClear={() => onBrowseChange({ ...browse, filters: {} })} /></div>}
        <div className="discover-list">
          {visible.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              layout="ticket"
              saved={savedIds.has(activity.id)}
              onOpen={() => onOpenActivity(activity.id)}
              onToggleSaved={() => onToggleSaved(activity.id)}
            />
          ))}
        </div>
        {visible.length === 0 && <div className="empty-state"><p>No places match those filters in this destination.</p><button className="j-secondary" onClick={() => onBrowseChange({ filters: {}, query: '', filtersOpen: false })}>Clear search & filters</button></div>}
        {!tripDestination && <p className="discovery-demo-note">Seasonal inspiration · September demo</p>}
      </div>
    </PageScaffold>
  )
}
