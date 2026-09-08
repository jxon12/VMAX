import type { Expense } from '../types/trips'

export type ReceiptItem = { id: string; label: string; amount: string; weights: Record<string, number> }
export type ReceiptDraft = { id: string; title: string; paidBy: string; items: ReceiptItem[] }

export function amountToCents(value: string): number | null {
  if (!/^\d+(?:\.\d{1,2})?$/.test(value.trim())) return null
  const [whole, fractional = ''] = value.trim().split('.')
  const cents = Number(whole) * 100 + Number(fractional.padEnd(2, '0'))
  return Number.isSafeInteger(cents) && cents > 0 && cents <= 100000000 ? cents : null
}

/** Largest-remainder allocation: exact cents, stable member-order ties. */
export function allocateCents(cents: number, weights: number[]): number[] {
  if (!Number.isSafeInteger(cents) || cents < 0 || weights.some(w => !Number.isSafeInteger(w) || w < 0 || w > 100)) throw new Error('Invalid amount or portion units')
  const units = weights.reduce((sum, weight) => sum + weight, 0)
  if (!units) throw new Error('Choose at least one diner')
  const allocations = weights.map(weight => Math.floor(cents * weight / units))
  const order = weights.map((weight, index) => ({ index, remainder: (cents * weight) % units }))
    .sort((a, b) => b.remainder - a.remainder || a.index - b.index)
  const remaining = cents - allocations.reduce((sum, amount) => sum + amount, 0)
  for (let index = 0; index < remaining; index++) allocations[order[index].index]++
  return allocations
}

export function calculateReceipt(items: ReceiptItem[], memberIds: string[]) {
  const errors: string[] = []
  const totals: Record<string, number> = Object.fromEntries(memberIds.map(id => [id, 0]))
  const lines: { itemId: string; cents: number; allocations: number[] }[] = []
  if (!items.length) errors.push('Add at least one item.')
  if (!memberIds.length) errors.push('Add a trip member before splitting a receipt.')
  items.forEach((item, index) => {
    const label = item.label.trim() || `Item ${index + 1}`
    const cents = amountToCents(item.amount)
    if (!item.label.trim()) errors.push(`Name item ${index + 1}.`)
    if (cents === null) errors.push(`${label}: enter a positive amount with up to two decimal places.`)
    try {
      const allocations = allocateCents(cents ?? 0, memberIds.map(id => item.weights[id] ?? 0))
      if (cents !== null) {
        lines.push({ itemId: item.id, cents, allocations })
        memberIds.forEach((id, memberIndex) => { totals[id] += allocations[memberIndex] })
      }
    } catch { errors.push(`${label}: assign 0–100 whole portion units and include at least one diner.`) }
  })
  return { errors, totals, lines, totalCents: lines.reduce((sum, line) => sum + line.cents, 0) }
}

export function receiptExpenses(receipt: ReceiptDraft, members: { id: string; name: string }[]): Expense[] {
  const result = calculateReceipt(receipt.items, members.map(member => member.id))
  if (!receipt.title.trim() || !members.some(member => member.id === receipt.paidBy) || result.errors.length) throw new Error('Review the receipt before saving')
  return members.flatMap(member => result.totals[member.id] > 0 ? [{
    id: `${receipt.id}:${member.id}`, receiptId: receipt.id,
    title: `${receipt.title.trim()} · ${member.name}`, amount: result.totals[member.id] / 100,
    category: 'Food' as const, paidBy: receipt.paidBy, splitWith: [member.id],
  }] : [])
}
