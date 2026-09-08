import { Icon } from './Icon'
import type { ReactNode } from 'react'

type PageHeaderProps = {
  title: string
  subtitle?: string
  onBack: () => void
  action?: ReactNode
}

export function PageHeader({ title, subtitle, onBack, action }: PageHeaderProps) {
  return (
    <header className="page-header">
      <button className="page-back" aria-label="Back" onClick={onBack}><Icon name="arrow" /></button>
      <div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>
      <div className="page-header-action">{action}</div>
    </header>
  )
}
