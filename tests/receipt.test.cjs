const { test } = require('node:test')
const assert = require('node:assert/strict')
const r = require('../.test-build/domain/receipt.js')

test('portion units support a quarter, half, quarter pizza and exclude non-diners', () => {
  assert.deepEqual(r.allocateCents(6400, [1, 2, 1, 0]), [1600, 3200, 1600, 0])
})
test('rounding never creates or loses a cent', () => {
  assert.deepEqual(r.allocateCents(1000, [1, 1, 1]), [334, 333, 333])
  for (let cents = 1; cents < 999; cents += 7) {
    const allocation = r.allocateCents(cents, [0, 3, 1, 2])
    assert.equal(allocation.reduce((sum, amount) => sum + amount, 0), cents)
    assert.equal(allocation[0], 0)
  }
})
test('invalid amounts and unassigned diners are blocked', () => {
  for (const value of ['-1', '1.001', 'NaN', '', '0', 'Infinity', '1e3']) assert.equal(r.amountToCents(value), null)
  assert.equal(r.amountToCents('12.10'), 1210)
  assert.throws(() => r.allocateCents(100, [0, 0]))
  assert.throws(() => r.allocateCents(100, [1, -1]))
  assert.throws(() => r.allocateCents(100, [NaN, 1]))
  assert.throws(() => r.allocateCents(100, [0.25, 1]))
})
test('receipt edits update exact individual expenses and preserve a stable receipt identity', () => {
  const members = ['a', 'b', 'c', 'd'].map(id => ({ id, name: id }))
  const receipt = { id: 'meal', title: 'Sample dinner', paidBy: 'b', items: [
    { id: 'pizza', label: 'Pizza', amount: '64.00', weights: { a: 1, b: 2, c: 1, d: 0 } },
    { id: 'water', label: 'Water', amount: '4.00', weights: { a: 1, b: 0, c: 1, d: 0 } },
  ] }
  let expenses = r.receiptExpenses(receipt, members)
  assert.deepEqual(expenses.map(e => e.amount), [18, 32, 18])
  assert.ok(expenses.every(e => e.receiptId === 'meal' && e.paidBy === 'b'))
  receipt.items[0].weights = { a: 1, b: 1, c: 1, d: 1 }
  const updated = r.receiptExpenses(receipt, members)
  expenses = [...expenses.filter(e => e.receiptId !== receipt.id), ...updated]
  assert.equal(expenses.length, 4)
  assert.deepEqual(expenses.map(e => e.amount), [18, 16, 18, 16])
  assert.equal(expenses.reduce((sum, e) => sum + Math.round(e.amount * 100), 0), 6800)
})
