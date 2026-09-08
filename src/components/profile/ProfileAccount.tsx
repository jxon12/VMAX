import { useId, useState, type FormEvent } from 'react'
import type { LocalProfile, ProfileDetails, ProfileErrors } from '../../types/profile'
import { cleanProfileDetails, profileErrors } from '../../domain/profile'
import { Icon } from '../ui/Icon'
import { BottomSheet } from '../ui/BottomSheet'
import '../../styles/profile-account.css'

type Props = {
  account: LocalProfile
  onSaveAccount: (details: ProfileDetails) => void
  onSetDemoSession: (active: boolean) => void
  onNotice: (message: string) => void
}

export function ProfileAccount({ account, onSaveAccount, onSetDemoSession, onNotice }: Props) {
  const [sheet, setSheet] = useState<'details' | 'session' | 'signout' | null>(null)
  const inDemo = account.session === 'demo'
  const initials = account.displayName.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(part => Array.from(part)[0]).join('').toUpperCase()

  return <section className="profile-account" aria-labelledby="profile-account-title">
    <div className="profile-account-identity">
      <div className="profile-account-avatar" aria-hidden="true">{initials || <Icon name="user" size={29}/>}<i/></div>
      <span className="profile-account-session"><i/>{inDemo ? 'Local demo session' : 'Guest · this device'}</span>
      <h2 id="profile-account-title">{account.displayName || <>Make it<br/>yours.</>}</h2>
      <p>{account.email || 'A personal profile for your next escape.'}</p>
      {account.email && <small>Email is not verified</small>}
    </div>

    <button className="profile-account-details lens-glass" onClick={() => setSheet('details')}>
      <span className="profile-account-row-icon"><Icon name="user" size={21}/></span>
      <span><strong>{account.displayName ? 'Personal details' : 'Create your profile'}</strong><small>{account.departureAirport ? `Home airport · ${account.departureAirport}` : 'Name, email & home airport'}</small></span>
      <Icon name="arrow" size={17}/>
    </button>
    <div className="profile-account-access">
      <span><Icon name={inDemo ? 'check' : 'users'} size={17}/>{inDemo ? 'Demo session only' : 'Bring your people together'}</span>
      <p>{inDemo ? 'No cloud account or verification is connected. Your information stays on this device.' : 'Real sign-in will verify who’s joining and keep shared journeys in sync. For now, you can preview the flow locally.'}</p>
      <button className={inDemo ? 'profile-account-signout' : 'profile-account-signin'} onClick={() => setSheet(inDemo ? 'signout' : 'session')}>{inDemo ? 'Sign out of demo' : 'Sign in · local demo'}<Icon name="arrow" size={16}/></button>
    </div>

    {(sheet === 'details' || sheet === 'session') && <AccountDetailsSheet key={sheet} account={account} sessionPreview={sheet === 'session'} onClose={() => setSheet(null)} onSave={(details, startSession) => {
      const emailChanged = inDemo && account.email !== details.email
      onSaveAccount(details)
      if (startSession) onSetDemoSession(true)
      setSheet(null)
      onNotice(startSession ? 'Local demo session started. No account was created and no email was sent.' : emailChanged ? 'Details saved. Email changed, so the local demo session has ended.' : 'Personal details saved on this device. Your name is updated in your journeys.')
    }}/>} 
    {sheet === 'signout' && <BottomSheet label="Sign out of local demo" className="profile-account-sheet" onDismiss={() => setSheet(null)}>
      <header><h2>Back to guest mode?</h2><button aria-label="Close sign-out preview" onClick={() => setSheet(null)}><Icon name="close" size={19}/></button></header>
      <p>Only the local session status changes. Your journeys, personal details and Agent permissions remain saved on this device.</p>
      <div className="profile-account-boundary"><Icon name="document" size={18}/><span>This is not a privacy lock. Someone using this browser can still view the saved information.</span></div>
      <button className="profile-account-submit" onClick={() => { onSetDemoSession(false); setSheet(null); onNotice('Signed out of the local demo. Journeys and personal details were kept.') }}>Sign out of demo</button>
      <button className="profile-account-cancel" onClick={() => setSheet(null)}>Keep this session</button>
    </BottomSheet>}
  </section>
}

function AccountDetailsSheet({ account, sessionPreview, onClose, onSave }: { account: LocalProfile; sessionPreview: boolean; onClose: () => void; onSave: (details: ProfileDetails, startSession: boolean) => void }) {
  const [draft, setDraft] = useState<ProfileDetails>({ displayName: account.displayName, email: account.email, departureAirport: account.departureAirport })
  const [errors, setErrors] = useState<ProfileErrors>({})
  const [acknowledged, setAcknowledged] = useState(false)
  const [ackError, setAckError] = useState(false)
  const prefix = useId()
  const patch = (field: keyof ProfileDetails, value: string) => { setDraft(current => ({ ...current, [field]: value })); setErrors(current => ({ ...current, [field]: undefined })) }
  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const next = cleanProfileDetails(draft)
    const nextErrors = profileErrors(next, sessionPreview)
    setErrors(nextErrors)
    setAckError(sessionPreview && !acknowledged)
    if (Object.keys(nextErrors).length || (sessionPreview && !acknowledged)) {
      const firstField = nextErrors.displayName ? 'name' : nextErrors.email ? 'email' : nextErrors.departureAirport ? 'airport' : 'ack'
      document.getElementById(`${prefix}-${firstField}`)?.focus()
      return
    }
    onSave(next, sessionPreview)
  }

  return <BottomSheet label={sessionPreview ? 'Local sign-in preview' : 'Edit personal details'} className="profile-account-sheet" onDismiss={onClose}>
    <header><h2>{sessionPreview ? <>Sign-in,<br/>a local preview.</> : <>The person<br/>behind the plans.</>}</h2><button aria-label={sessionPreview ? 'Close sign-in preview' : 'Close personal details'} onClick={onClose}><Icon name="close" size={19}/></button></header>
    <p>{sessionPreview ? 'Try the account experience with sample details. No registration, identity check or email delivery takes place.' : 'Use sample information. Your name appears in your journeys, and your airport can prefill flight comparisons. Your email is not shared with the group.'}</p>
    {sessionPreview && <div className="profile-account-demo-label"><Icon name="play" size={14}/><span>Prototype only · no real authentication</span></div>}
    <form className="profile-account-form" onSubmit={save} noValidate>
      <label htmlFor={`${prefix}-name`}>Display name<input id={`${prefix}-name`} value={draft.displayName} maxLength={40} autoComplete="off" placeholder="Alex" aria-invalid={!!errors.displayName} aria-describedby={errors.displayName ? `${prefix}-name-error` : `${prefix}-name-help`} onChange={event => patch('displayName', event.target.value)}/><small id={`${prefix}-name-help`}>Updates only you, never another traveller.</small>{errors.displayName && <em id={`${prefix}-name-error`} role="alert">{errors.displayName}</em>}</label>
      <label htmlFor={`${prefix}-email`}>Email<span>{sessionPreview ? 'Sample required for this preview' : 'Optional · not verified'}</span><input id={`${prefix}-email`} type="email" inputMode="email" value={draft.email} maxLength={254} autoComplete="off" autoCapitalize="none" spellCheck={false} placeholder="alex@example.com" aria-invalid={!!errors.email} aria-describedby={errors.email ? `${prefix}-email-error` : undefined} onChange={event => patch('email', event.target.value)}/>{errors.email && <em id={`${prefix}-email-error`} role="alert">{errors.email}</em>}</label>
      <label htmlFor={`${prefix}-airport`}>Home departure airport<span>Optional · three-letter code</span><input id={`${prefix}-airport`} value={draft.departureAirport} maxLength={3} autoComplete="off" autoCapitalize="characters" spellCheck={false} placeholder="KUL" aria-invalid={!!errors.departureAirport} aria-describedby={errors.departureAirport ? `${prefix}-airport-error` : `${prefix}-airport-help`} onChange={event => patch('departureAirport', event.target.value.toUpperCase())}/><small id={`${prefix}-airport-help`}>Saved as a preference, not a verified airport or booking.</small>{errors.departureAirport && <em id={`${prefix}-airport-error`} role="alert">{errors.departureAirport}</em>}</label>
      {sessionPreview && <label className="profile-account-ack"><input id={`${prefix}-ack`} type="checkbox" checked={acknowledged} onChange={event => { setAcknowledged(event.target.checked); setAckError(false) }}/><span>I understand this is a local demo, not a real account.</span></label>}
      {ackError && <p className="profile-account-error" role="alert">Confirm that you understand the demo before continuing.</p>}
      {!sessionPreview && account.session === 'demo' && <p className="profile-account-form-note">Changing your email ends the local demo session. Your journeys are kept.</p>}
      <button className="profile-account-submit" type="submit">{sessionPreview ? 'Start local demo session' : 'Save personal details'}<Icon name={sessionPreview ? 'arrow' : 'check'} size={17}/></button>
      <button className="profile-account-cancel" type="button" onClick={onClose}>{sessionPreview ? 'Continue as guest' : 'Cancel'}</button>
    </form>
  </BottomSheet>
}
