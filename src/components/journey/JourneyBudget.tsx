import { useState } from 'react'
import type { Expense, ExpenseCategory, Trip } from '../../types/trips'
import { money, tripBudget, tripSpent, uid } from '../../domain/trips'
import { calculateReceipt, receiptExpenses, type ReceiptDraft, type ReceiptItem } from '../../domain/receipt'
import { Icon } from '../ui/Icon'
import { BottomSheet } from '../ui/BottomSheet'
import '../../styles/journey-utility.css'
import '../../styles/journey-utilities-glass.css'

const categories: ExpenseCategory[] = ['Stay', 'Food', 'Transport', 'Activities']
const colors = ['#a6b9ee', '#edb694', '#7ed3c5', '#b6a6ec']
const sampleId = 'sample-pizza-receipt'

function makeSample(trip: Trip): ReceiptDraft {
  const weights = (kind: 'pizza' | 'water') => Object.fromEntries(trip.members.map((member, index) => [member.id,
    trip.members.length < 3 ? 1 : kind === 'pizza' ? [1, 2, 1][index] ?? 0 : [1, 0, 1][index] ?? 0,
  ]))
  return { id: sampleId, title: 'Pizza dinner (sample)', paidBy: trip.members[1]?.id ?? trip.members[0]?.id ?? '', items: [
    { id: 'pizza', label: 'Margherita pizza', amount: '64.00', weights: weights('pizza') },
    { id: 'water', label: 'Water', amount: '4.00', weights: weights('water') },
  ] }
}
function portionLabel(units: number, total: number) {
  if (!units || !total || !Number.isInteger(units)) return units ? 'Review units' : 'Not included'
  const gcd = (a: number, b: number): number => b ? gcd(b, a % b) : a
  const divisor = gcd(units, total)
  return units === total ? 'Whole item' : `${units / divisor}/${total / divisor} of item`
}

export function JourneyBudget({ trip, onUpdate }: { trip: Trip; onUpdate: (update: (trip: Trip) => Trip) => void }) {
  const [editing, setEditing] = useState<Expense | null>(null)
  const [removed, setRemoved] = useState<Expense | null>(null)
  const [receipt, setReceipt] = useState<ReceiptDraft | null>(null)
  const [removedReceipt, setRemovedReceipt] = useState<{ receipt: ReceiptDraft; expenses: Expense[] } | null>(null)
  const [status, setStatus] = useState('')
  const [showAllExpenses, setShowAllExpenses] = useState(false)
  const spent = tripSpent(trip), total = tripBudget(trip), left = total - spent
  const savedSample = trip.receipts?.find(item => item.id === sampleId)
  const memberIds = trip.members.map(member => member.id)
  const split = receipt ? calculateReceipt(receipt.items, memberIds) : null
  const receiptValid = !!receipt && !!split && !split.errors.length && !!receipt.title.trim() && memberIds.includes(receipt.paidBy)
  const savedReceipt = receipt && trip.receipts?.some(item => item.id === receipt.id)
  const expenseRows = [
    ...(trip.receipts ?? []).map(record => ({ type: 'receipt' as const, record })),
    ...trip.expenses.filter(expense => !expense.receiptId || !trip.receipts?.some(record => record.id === expense.receiptId)).map(record => ({ type: 'expense' as const, record })),
  ]
  const balances = trip.members.map(member => {
    let cents = 0
    trip.expenses.forEach(expense => {
      const amount = Math.round(expense.amount * 100)
      if (expense.paidBy === member.id) cents += amount
      const index = expense.splitWith.indexOf(member.id)
      if (index >= 0) cents -= Math.floor(amount / expense.splitWith.length) + (index < amount % expense.splitWith.length ? 1 : 0)
    })
    return { ...member, balance: cents / 100 }
  })
  const openReceipt = (value: ReceiptDraft) => setReceipt({ ...value, items: value.items.map(item => ({ ...item, weights: { ...item.weights } })) })
  const updateItem = (id: string, changes: Partial<ReceiptItem>) => setReceipt(value => value && ({ ...value, items: value.items.map(item => item.id === id ? { ...item, ...changes } : item) }))
  const saveReceipt = () => {
    if (!receiptValid || !receipt) return
    const next = { ...receipt, title: receipt.title.trim(), items: receipt.items.map(item => ({ ...item, label: item.label.trim() })) }
    const expenses = receiptExpenses(next, trip.members)
    onUpdate(value => ({ ...value, receipts: [...(value.receipts ?? []).filter(item => item.id !== next.id), next],
      expenses: [...value.expenses.filter(expense => expense.receiptId !== next.id && !(next.id === sampleId && expense.id.startsWith('scan-pizza-'))), ...expenses],
    }))
    setRemovedReceipt(null)
    setStatus(`${savedReceipt ? 'Updated' : 'Saved'} ${next.title}. Group balances include the confirmed split.`)
    setReceipt(null)
  }

  return <section className="j-panel jr-budget ju-budget jg-budget">
    <header className="jg-utility-heading"><div><h2>Keep it fair.</h2><p>One budget. Everyone in the picture.</p></div></header>
    <section className="jg-budget-summary" aria-label="Group budget summary"><div className="j-budget-total"><span>{left < 0 ? 'Over budget' : 'Group budget remaining'}</span><strong className={left < 0 ? 'negative' : ''}>{money(Math.abs(left))}</strong><div className="j-budget-track"><i style={{ width: `${total > 0 ? Math.min(100, spent / total * 100) : 0}%` }} /></div><div className="jg-budget-figures"><p><span>Recorded</span><strong>{money(spent)}</strong></p><p><span>Group budget</span><strong>{money(total)}</strong></p></div></div>
      <button className={`jr-scan-card jg-receipt-entry ${savedSample ? 'saved' : ''}`} onClick={() => openReceipt(savedSample ?? makeSample(trip))}>
        <span className="jr-scan-icon"><Icon name={savedSample ? 'check' : 'document'} size={21} /></span>
        <span><strong>{savedSample ? 'Review your receipt split' : 'Split a receipt'}</strong><p>{savedSample ? savedSample.title : 'Try a sample · choose who had what'}</p></span><Icon name="arrow" size={18} />
      </button>
    </section>
    {status && <p className="ju-status" role="status"><Icon name="check" size={15} />{status}</p>}
    <div className="jg-utility-section-heading"><h3>Expenses</h3><button onClick={() => setEditing({ id: uid(), title: '', amount: 0, category: 'Food', paidBy: trip.members[0]?.id ?? '', splitWith: memberIds })}>＋ Add expense</button></div>
    {!trip.expenses.length && <p className="j-muted">Nothing recorded yet. Add what’s actually been paid.</p>}
    <div className="jg-expenses-card"><div className="j-expense-list">
      {expenseRows.slice(0, showAllExpenses ? expenseRows.length : 4).map(row => {
        if (row.type === 'receipt') {
          const record = row.record
          const entries = trip.expenses.filter(expense => expense.receiptId === record.id)
          return <button key={`receipt-${record.id}`} onClick={() => openReceipt(record)}><span><strong>{record.title}</strong><small>{trip.members.find(member => member.id === record.paidBy)?.name} paid · {entries.length} diners · edit portions</small></span><b>{money(entries.reduce((sum, expense) => sum + expense.amount, 0))}</b></button>
        }
        const expense = row.record
        return <button key={`expense-${expense.id}`} onClick={() => setEditing({ ...expense, splitWith: [...expense.splitWith] })}><span><strong>{expense.title}</strong><small>{trip.members.find(member => member.id === expense.paidBy)?.name} paid · split {expense.splitWith.length} {expense.splitWith.length === 1 ? 'way' : 'ways'}</small></span><b>{money(expense.amount)}</b></button>
      })}
    </div>
    {expenseRows.length > 4 && <button className="jg-expand-expenses" aria-expanded={showAllExpenses} onClick={() => setShowAllExpenses(value => !value)}>{showAllExpenses ? 'Show less' : `See all ${expenseRows.length} expenses`}<Icon name="chevron" size={15} /></button>}
    <details className="jg-category-disclosure"><summary><span>Spending by category</span><Icon name="chevron" size={15} /></summary><div className="j-budget-categories">{categories.map((category, index) => {
      const amount = trip.expenses.filter(expense => expense.category === category).reduce((sum, expense) => sum + expense.amount, 0)
      return <div key={category}><p><span><i style={{ background: colors[index] }} />{category}</span><strong>{money(amount)}</strong></p><div><i style={{ width: `${spent ? amount / spent * 100 : 0}%`, background: colors[index] }} /></div></div>
    })}</div></details></div>
    {removed && <p className="j-warning" role="status">Expense removed. <button className="j-text-button" onClick={() => { onUpdate(value => ({ ...value, expenses: [...value.expenses.filter(expense => expense.id !== removed.id), removed] })); setRemoved(null) }}>Undo</button></p>}
    {removedReceipt && <p className="j-warning" role="status">Receipt removed. <button className="j-text-button" onClick={() => { onUpdate(value => ({ ...value, receipts: [...(value.receipts ?? []).filter(record => record.id !== removedReceipt.receipt.id), removedReceipt.receipt], expenses: [...value.expenses.filter(expense => expense.receiptId !== removedReceipt.receipt.id), ...removedReceipt.expenses] })); setRemovedReceipt(null) }}>Undo</button></p>}
    <div className="jg-utility-section-heading"><h3>Group balance</h3><span>No payments sent</span></div>
    <div className="j-glass j-balances jg-balance-card">{balances.map(member => <div key={member.id}><span><i className="j-avatar" style={{ background: member.color }}>{member.name[0]}</i>{member.id === 'you' ? 'You' : member.name}</span><span className="jg-balance-amount"><strong className={member.balance < 0 ? 'negative' : member.balance > 0 ? 'positive' : ''}>{money(Math.abs(member.balance))}</strong><small>{member.balance < 0 ? 'Owes the group' : member.balance > 0 ? 'To receive' : 'Settled up'}</small></span></div>)}</div>
    <details className="jg-utility-note"><summary>How this adds up<Icon name="chevron" size={15} /></summary><p>Balances use recorded expenses only; planned activity estimates are separate. {left >= 0 ? `${money(left / Math.max(1, trip.travellers))} per person remains in the group budget.` : 'Review expenses or adjust the budget in Trip settings.'} This prototype does not book or transfer money.</p></details>

    {receipt && split && <BottomSheet label="Review receipt and portions" className="j-sheet ju-receipt-sheet jg-utility-sheet" onDismiss={() => setReceipt(null)}>
      <header><div><p className="j-eyebrow">YOU REVIEW. V-MAX DOES THE MATH.</p><h2>Who had what?</h2></div><button aria-label="Close receipt without saving" onClick={() => setReceipt(null)}><Icon name="close" /></button></header>
      <p className="ju-sample-note"><Icon name="document" size={16} /><span>Illustrative receipt · MYR<br /><small>No camera or OCR connected. Items and portions below are editable, not detected facts.</small></span></p>
      <form onSubmit={event => { event.preventDefault(); saveReceipt() }}>
        <div className="ju-receipt-details"><label className="field-label">Receipt name<input value={receipt.title} maxLength={70} required onChange={event => setReceipt({ ...receipt, title: event.target.value })} /></label><label className="field-label">Paid by<select value={receipt.paidBy} onChange={event => setReceipt({ ...receipt, paidBy: event.target.value })}>{trip.members.map(member => <option key={member.id} value={member.id}>{member.name}</option>)}</select></label></div>
        <p className="ju-portion-help">Give each diner portion units. <strong>1 : 2 : 1 means ¼ : ½ : ¼.</strong> Use 0 for anyone who didn’t join.</p>
        <div className="ju-receipt-items">{receipt.items.map((item, index) => {
          const units = memberIds.reduce((sum, id) => sum + (item.weights[id] ?? 0), 0)
          return <fieldset className="ju-receipt-item" key={item.id}><legend>Item {index + 1}</legend>
            <div className="ju-item-fields"><label className="field-label">Item<input aria-label={`Item ${index + 1} name`} required value={item.label} maxLength={60} onChange={event => updateItem(item.id, { label: event.target.value })} /></label><label className="field-label">MYR<input aria-label={`Item ${index + 1} amount in MYR`} required type="number" min="0.01" max="1000000" step="0.01" inputMode="decimal" value={item.amount} onChange={event => updateItem(item.id, { amount: event.target.value })} /></label></div>
            {trip.members.map(member => <label className="ju-portion-row" key={member.id}><span className="j-avatar" style={{ background: member.color }}>{member.name[0]}</span><span><strong>{member.name}</strong><small>{portionLabel(item.weights[member.id] ?? 0, units)}</small></span><input aria-label={`${member.name} portion units for ${item.label || `item ${index + 1}`}`} type="number" inputMode="numeric" min="0" max="100" step="1" required value={Number.isNaN(item.weights[member.id]) ? '' : item.weights[member.id] ?? 0} onChange={event => updateItem(item.id, { weights: { ...item.weights, [member.id]: event.target.value === '' ? NaN : Number(event.target.value) } })} /></label>)}
            <button className="ju-remove-item" type="button" onClick={() => setReceipt({ ...receipt, items: receipt.items.filter(value => value.id !== item.id) })}>Remove item</button>
          </fieldset>
        })}</div>
        <button type="button" className="j-secondary ju-add-item" onClick={() => setReceipt({ ...receipt, items: [...receipt.items, { id: uid(), label: '', amount: '', weights: Object.fromEntries(memberIds.map(id => [id, 1])) }] })}>＋ Add item, tax or fee</button>
        {!!split.errors.length && <p className="ju-validation" role="alert">{split.errors[0]}</p>}
        <section className="ju-split-summary" aria-label="Split preview" aria-live="polite"><h3>Your split</h3>{trip.members.map(member => <div key={member.id}><span>{member.name}</span><strong>{money(split.totals[member.id] / 100)}</strong></div>)}<div className="ju-split-total"><span>{split.errors.length ? 'Valid items subtotal' : 'Total · every cent accounted for'}</span><strong>{money(split.totalCents / 100)}</strong></div></section>
        <details className="jg-utility-note"><summary>How the split is calculated<Icon name="chevron" size={15} /></summary><p>If a cent cannot divide evenly, it goes to the largest fractional share, then member order. Saving updates expenses and group balances; no payments are sent.</p></details>
        <button className="j-primary" disabled={!receiptValid}>{savedReceipt ? 'Update' : 'Save'} {money(split.totalCents / 100)} split<Icon name="check" size={17} /></button>
      </form>
      {savedReceipt && <button className="j-text-danger" onClick={() => { const saved = trip.receipts?.find(record => record.id === receipt.id); if (!saved) return; setRemovedReceipt({ receipt: saved, expenses: trip.expenses.filter(expense => expense.receiptId === receipt.id) }); onUpdate(value => ({ ...value, receipts: (value.receipts ?? []).filter(record => record.id !== receipt.id), expenses: value.expenses.filter(expense => expense.receiptId !== receipt.id) })); setReceipt(null); setStatus('') }}>Remove this receipt</button>}
    </BottomSheet>}

    {editing && <BottomSheet label="Expense details" className="j-sheet" onDismiss={() => setEditing(null)}><header><h2>Keep it fair.</h2><button aria-label="Close expense" onClick={() => setEditing(null)}><Icon name="close" /></button></header><form onSubmit={event => {
      event.preventDefault()
      if (editing.title.trim() && Number.isFinite(editing.amount) && editing.amount > 0 && editing.amount <= 1000000 && editing.splitWith.length && memberIds.includes(editing.paidBy)) {
        onUpdate(value => ({ ...value, expenses: [...value.expenses.filter(expense => expense.id !== editing.id), { ...editing, title: editing.title.trim(), amount: Math.round(editing.amount * 100) / 100 }] })); setEditing(null)
      }
    }}><label className="field-label">What was it for?<input required value={editing.title} maxLength={90} onChange={event => setEditing({ ...editing, title: event.target.value })} /></label><label className="field-label">Amount · MYR<input required type="number" min="0.01" max="1000000" step="0.01" inputMode="decimal" value={editing.amount || ''} onChange={event => setEditing({ ...editing, amount: Number(event.target.value) })} /></label><div className="setup-date-grid"><label className="field-label">Category<select value={editing.category} onChange={event => setEditing({ ...editing, category: event.target.value as ExpenseCategory })}>{categories.map(category => <option key={category}>{category}</option>)}</select></label><label className="field-label">Paid by<select value={editing.paidBy} onChange={event => setEditing({ ...editing, paidBy: event.target.value })}>{trip.members.map(member => <option key={member.id} value={member.id}>{member.name}</option>)}</select></label></div><fieldset><legend>Split equally between</legend>{trip.members.map(member => <label className="j-check-row" key={member.id}><input type="checkbox" checked={editing.splitWith.includes(member.id)} onChange={() => setEditing({ ...editing, splitWith: editing.splitWith.includes(member.id) ? editing.splitWith.filter(id => id !== member.id) : [...editing.splitWith, member.id] })} />{member.name}</label>)}</fieldset><button className="j-primary" disabled={!editing.title.trim() || !Number.isFinite(editing.amount) || editing.amount <= 0 || !editing.splitWith.length}>Save expense</button></form>{trip.expenses.some(expense => expense.id === editing.id) && <button className="j-text-danger" onClick={() => { setRemoved(editing); onUpdate(value => ({ ...value, expenses: value.expenses.filter(expense => expense.id !== editing.id) })); setEditing(null) }}>Remove expense</button>}</BottomSheet>}
  </section>
}
