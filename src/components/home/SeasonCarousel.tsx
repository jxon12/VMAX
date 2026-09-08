import { seasonStories } from '../../data/homeData'
import { Icon } from '../ui/Icon'

type SeasonCarouselProps = {
  onSelect: (id: string) => void
  onExpand: () => void
}

export function SeasonCarousel({ onSelect, onExpand }: SeasonCarouselProps) {
  return (
    <section className="story-section" aria-labelledby="story-heading">
      <div className="section-heading">
        <h2 id="story-heading">This season</h2>
        <button className="soft-arrow" aria-label="See all seasonal stories" onClick={onExpand}>
          <Icon name="arrow" size={18} />
        </button>
      </div>
      <div className="story-rail">
        {seasonStories.map((story) => (
          <button
            className="story-card"
            key={story.title}
            onClick={() => onSelect(story.id)}
            aria-label={story.title.replace('\n', ' ')}
          >
            <img src={story.image} alt="" />
            <span>{story.title.split('\n').map((line) => <span key={line}>{line}<br /></span>)}</span>
            {story.badge && <em>{story.badge}</em>}
          </button>
        ))}
      </div>
    </section>
  )
}
