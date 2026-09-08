import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { Trip } from '../../types/trips'
import { BottomNavigation, type NavDestination } from '../navigation/BottomNavigation'
import { VMaxAssistantSheet } from '../sheets/VMaxAssistantSheet'
import { OrbTransition } from '../ui/OrbTransition'
import { Toast } from '../ui/Toast'
import { useOrbTransition } from '../../hooks/useOrbTransition'
import { useAppNavigation } from '../../state/AppContext'
import type { AssistantAction } from '../../domain/assistant'

type PageScaffoldProps = {
  label: string
  children: ReactNode
  notice: string
  activeNav?: NavDestination
  className?: string
  onNavigate: (destination: NavDestination) => void
  onAssistantPlan: (prompt?: string) => void
  assistantTrip?: Trip
  onAssistantReview?: (kind: AssistantAction) => void
  journeyAssistant?: boolean
}

export function PageScaffold({
  label,
  children,
  notice,
  activeNav,
  className = '',
  onNavigate,
  onAssistantPlan,
  journeyAssistant = false,
  assistantTrip,
  onAssistantReview,
}: PageScaffoldProps) {
  const orb = useOrbTransition()
  const navigation = useAppNavigation()
  const pendingPlan = useRef<(() => void) | null>(null)
  useEffect(() => {
    if (orb.phase === 'idle' && pendingPlan.current) {
      const run = pendingPlan.current
      pendingPlan.current = null
      run()
    }
  }, [orb.phase])
  const [hasSeenAssistantDemo, setHasSeenAssistantDemo] = useState(() => { try { return localStorage.getItem('vmax-assistant-seen') === 'yes' } catch { return false } })

  return (
    <main className="app-stage">
      <section className={`phone-shell app-lens ${className}`} aria-label={label}>
        {children}
        <BottomNavigation
          orbRef={orb.navOrbRef}
          orbHidden={orb.navOrbHidden}
          activeItem={activeNav ?? navigation?.active}
          onAskVMax={orb.open}
          onNavigate={navigation?.navigate ?? onNavigate}
        />
        <OrbTransition flight={orb.flight} />
        <Toast message={notice} />
        {orb.phase !== 'idle' && (
          <VMaxAssistantSheet
            trip={assistantTrip ?? navigation?.assistantTrip}
            departureAirport={navigation?.departureAirport}
            onUpdateTrip={navigation?.updateAssistantTrip}
            onReview={navigation?.review || onAssistantReview ? kind => { pendingPlan.current = () => (navigation?.review ?? onAssistantReview)?.(kind); orb.close() } : undefined}
            phase={orb.phase}
            orbRef={orb.assistantOrbRef}
            orbGhost={orb.assistantOrbGhost}
            initialView={hasSeenAssistantDemo ? 'assistant' : 'demo'}
            onDemoSeen={() => { setHasSeenAssistantDemo(true); try { localStorage.setItem('vmax-assistant-seen','yes') } catch { /* Session fallback. */ } }}
            onClose={orb.close}
            onPlan={(prompt) => { pendingPlan.current = () => (navigation?.plan ?? onAssistantPlan)(prompt); orb.close() }}
          />
        )}
      </section>
    </main>
  )
}
