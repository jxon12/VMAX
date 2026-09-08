import type { ReactNode } from 'react'

export type IconName =
  | 'arrow'
  | 'bookmark'
  | 'calendar'
  | 'chevron'
  | 'clock'
  | 'close'
  | 'compass'
  | 'check'
  | 'document'
  | 'filter'
  | 'home'
  | 'leaf'
  | 'mic'
  | 'pause'
  | 'plane'
  | 'phone'
  | 'pin'
  | 'play'
  | 'search'
  | 'sparkles'
  | 'sun'
  | 'wallet'
  | 'wheelchair'
  | 'user'
  | 'users'
  | 'video'

const paths: Record<IconName, ReactNode> = {
  arrow: <><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,
  bookmark: <path d="M6 4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21l-6-3.7L6 21z"/>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>,
  chevron: <path d="m7 9 5 5 5-5"/>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  close: <><path d="m6 6 12 12"/><path d="m18 6-12 12"/></>,
  compass: <><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2.1 4.9-4.9 2.1 2.1-4.9z"/></>,
  check: <path d="m5 12 4.2 4.2L19 6.5"/>,
  document: <><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v5h5M9 13h6M9 17h6"/></>,
  filter: <><path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/></>,
  home: <><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10M9 20v-6h6v6"/></>,
  leaf: <><path d="M20 4C12 4 6.5 7.5 6.5 13c0 3 2 5 5 5 5.5 0 8.5-6 8.5-14Z"/><path d="M4 20c3.5-5 7-8 12-10"/></>,
  mic: <><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M9 21h6"/></>,
  pause: <><path d="M9 7v10M15 7v10"/></>,
  plane: <><path d="M3 12.5 21 5l-5.5 14-3.2-5.6L7 11.1z"/><path d="m12.3 13.4 3.2-3.2"/></>,
  phone: <path d="M5.2 3.8 8.5 3l2.1 4.7-2 1.4a15 15 0 0 0 6.3 6.3l1.4-2 4.7 2.1-.8 3.3a2.7 2.7 0 0 1-2.8 2.1C9.7 20.2 3.8 14.3 3.1 6.6A2.7 2.7 0 0 1 5.2 3.8Z"/>,
  pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
  play: <path d="m9 7 8 5-8 5z"/>,
  search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
  sparkles: <><path d="m12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2z"/><path d="m18.5 14 .7 2.3 2.3.7-2.3.7-.7 2.3-.7-2.3-2.3-.7 2.3-.7zM5 13l.8 2.2L8 16l-2.2.8L5 19l-.8-2.2L2 16l2.2-.8z"/></>,
  sun: <><circle cx="12" cy="12" r="3.5"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42"/></>,
  wallet: <><path d="M4 6.5h14A2 2 0 0 1 20 8.5v10A2 2 0 0 1 18 20H4a2 2 0 0 1-2-2V6.5A2.5 2.5 0 0 1 4.5 4H17"/><path d="M15 11h6v5h-6a2.5 2.5 0 0 1 0-5Z"/></>,
  wheelchair: <><circle cx="10" cy="4.5" r="2"/><path d="M10 7v6h5l3 5M10 10H6M9 13a5 5 0 1 0 4 7"/></>,
  user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
  video: <><rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3z"/></>,
}

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
        {paths[name]}
      </g>
    </svg>
  )
}
