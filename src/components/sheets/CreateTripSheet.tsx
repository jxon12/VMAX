import { BottomSheet } from '../ui/BottomSheet'
import { Icon } from '../ui/Icon'

export type CreateTripStep = 'closed' | 'choose' | 'friends'

type CreateTripSheetProps = {
  step: Exclude<CreateTripStep, 'closed'>
  onStepChange: (step: CreateTripStep) => void
  onNotice: (message: string) => void
  onStartPlanning: (group: boolean) => void
}

export function CreateTripSheet({ step, onStepChange, onNotice, onStartPlanning }: CreateTripSheetProps) {
  const dismiss = () => onStepChange('closed')

  return (
    <BottomSheet label="Create a trip" onDismiss={dismiss} className="create-trip-sheet">
      {step === 'choose' ? (
        <>
          <p className="eyebrow">NEW JOURNEY</p>
          <h2>How would you like to plan?</h2>
          <p className="sheet-intro">Start with your preferences, or shape a draft around your group.</p>
          <div className="trip-choices">
            <button onClick={() => onStartPlanning(false)}>
              <span className="choice-icon"><Icon name="user" /></span>
              <span><strong>Plan a trip</strong><small>Built around your Travel DNA</small></span>
              <Icon name="arrow" />
            </button>
            <button className="friends-choice" onClick={() => onStepChange('friends')}>
              <span className="choice-icon"><Icon name="users" /></span>
              <span><strong>Plan with friends</strong><small>Set shared comfort and food preferences</small></span>
              <Icon name="arrow" />
            </button>
          </div>
        </>
      ) : (
        <>
          <button className="sheet-back" onClick={() => onStepChange('choose')}><Icon name="arrow" /> Back</button>
          <p className="eyebrow">PLAN WITH FRIENDS</p>
          <h2>Build one trip around everyone.</h2>
          <p className="sheet-intro">Choose mobility, dietary needs, pace and budget for the group. This prototype uses local demo members; real invitations and private member preferences are not connected yet.</p>
          <div className="member-preview">
            <span className="member-avatar">A</span>
            <span><strong>You</strong><small>Local prototype</small></span>
            <em>Draft</em>
          </div>
          <button className="invite-action" onClick={() => onNotice('Invitations need a backend. For now, rename demo members in Journey → Group.')}><Icon name="users" /> About group invitations</button>
          <button className="primary-action" onClick={() => onStartPlanning(true)}>Continue with my group <Icon name="arrow" /></button>
        </>
      )}
    </BottomSheet>
  )
}
