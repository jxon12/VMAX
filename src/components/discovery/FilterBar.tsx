import { useState } from 'react'
import { Icon } from '../ui/Icon'

export type FilterKey = 'season' | 'mood' | 'mobility' | 'dietary' | 'family' | 'budget'
export type DiscoverFilters = Partial<Record<FilterKey, string>>

const groups: Array<{ key: FilterKey; label: string; options: string[] }> = [
  { key: 'season', label: 'Season', options: ['In season now', 'Coming up', 'Year-long event'] },
  { key: 'mood', label: 'Mood', options: ['Nature', 'Culture', 'Adventure'] },
  { key: 'mobility', label: 'Mobility', options: ['Step-free', 'Low walking', 'Seating available'] },
  { key: 'dietary', label: 'Dietary', options: ['Vegetarian', 'Halal-friendly', 'Allergy-aware'] },
  { key: 'family', label: 'Travellers', options: ['Family', 'Older travellers', 'Young & trending'] },
  { key: 'budget', label: 'Budget', options: ['Free', 'Value', 'Premium'] },
]

type FilterBarProps = {
  values: DiscoverFilters
  onChange: (key: FilterKey, value: string) => void
  onClear: () => void
}

export function FilterBar({ values, onChange, onClear }: FilterBarProps) {
  const [openKey, setOpenKey] = useState<FilterKey | null>(null)
  const activeGroup = groups.find((group) => group.key === openKey)
  const activeCount = Object.values(values).filter(Boolean).length

  return (
    <div className="filters" aria-label="Discover filters">
      <div className="filter-bar">
        {groups.map((group) => (
          <button
            className={values[group.key] ? 'active' : ''}
            key={group.key}
            aria-expanded={openKey === group.key}
            onClick={() => setOpenKey((current) => current === group.key ? null : group.key)}
          >
            <span>{values[group.key] ?? group.label}</span>
            <Icon name="chevron" size={14} />
          </button>
        ))}
        {activeCount > 0 && <button className="clear-filter" onClick={onClear}>Clear {activeCount}</button>}
      </div>
      {activeGroup && (
        <div className="filter-options" aria-label={`${activeGroup.label} options`}>
          <p>{activeGroup.label}</p>
          <div>
            {activeGroup.options.map((option) => (
              <button
                className={values[activeGroup.key] === option ? 'selected' : ''}
                aria-pressed={values[activeGroup.key] === option}
                key={option}
                onClick={() => { onChange(activeGroup.key, option); setOpenKey(null) }}
              >{option}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
