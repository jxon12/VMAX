import { createContext, useContext, type ReactNode } from 'react'
import type { NavDestination } from '../components/navigation/BottomNavigation'
import type { Trip } from '../types/trips'
import type { AssistantAction } from '../domain/assistant'

export type AppNavigation = { navigate: (to: NavDestination) => void; plan: (prompt?: string) => void; active?: NavDestination; assistantTrip?: Trip; review?: (action: AssistantAction) => void; updateAssistantTrip?: (update: (trip: Trip) => Trip) => void; departureAirport?: string }
const Context = createContext<AppNavigation | null>(null)
export const AppNavigationProvider = ({ value, children }: { value: AppNavigation; children: ReactNode }) => <Context.Provider value={value}>{children}</Context.Provider>
export const useAppNavigation = () => useContext(Context)
