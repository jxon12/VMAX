export type SeasonStory = {
  id: string
  title: string
  image: string
  badge?: string
}

export const seasonStories: SeasonStory[] = [
  { id: 'iceland-aurora', title: 'Iceland\nNorthern Lights', image: '/images/iceland-aurora.png', badge: 'Coming soon' },
  { id: 'shanghai-disney-10', title: 'Shanghai Disney\n10th Birthday', image: '/images/shanghai-disney-10.jpg' },
  { id: 'arashiyama-morning', title: 'Kyoto\nGentle Autumn', image: '/images/arashiyama-morning.png' },
  { id: 'tokyo-ginkgo-accessible', title: 'Tokyo\nStep-free Ginkgo', image: '/images/tokyo-ginkgo-crowd.jpg' },
]

export const searchMoods = ['child-friendly', 'traveling with older family', 'walking tolerance', 'slow & scenic', 'food-first']
