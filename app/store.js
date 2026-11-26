// HomeLedger's state: one household's budget, kept in localStorage so the
// site works with the network off and remembers edits between visits.
// Nothing here ever leaves the browser.

import { CATEGORIES, SEED_BILLS, SEED_BUDGETS, SEED_GOALS, SEED_TRANSACTIONS } from './data.js';
import { TODAY } from './format.js';

const KEY = 'homeledger-v1';
const LATEST_MONTH = '2026-11';

function seedState() {
  return {
    month: LATEST_MONTH,
    household: 'The Hartley household',
    transactions: SEED_TRANSACTIONS.map((row, i) => ({
      id: `seed-${i}`,
      date: row[0],
      description: row[1],
      category: row[2],
      kind: row[3],
      amount: row[4],
    })),
    budgets: { ...SEED_BUDGETS },
    goals: SEED_GOALS.map((g) => ({ ...g })),
    bills: SEED_BILLS.map((b) => ({ ...b })),
  };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return seedState();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.transactions) || !parsed.budgets) return seedState();
    return parsed;
  } catch {
    return seedState();
  }
}

export function saveState(state) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function resetDemo() {
  const fresh = seedState();
  saveState(fresh);
  return fresh;
}

let counter = 0;
export function uid() {
  counter += 1;
  return `t${Date.now().toString(36)}${counter}`;
}

// ---- Month math -----------------------------------------------------------

export function monthsWithData(state) {
  const months = new Set(state.transactions.map((t) => t.date.slice(0, 7)));
  return [...months].sort();
}

export function monthTransactions(state, month) {
  return state.transactions
    .filter((t) => t.date.slice(0, 7) === month)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

export function monthIncome(state, month) {
  return monthTransactions(state, month)
    .filter((t) => t.kind === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
}

// Spending leaves out money moved to savings: that is saved, not spent.
export function monthSpending(state, month) {
  return monthTransactions(state, month)
    .filter((t) => t.kind === 'expense' && t.category !== 'savings')
    .reduce((sum, t) => sum + t.amount, 0);
}

export function monthSaved(state, month) {
  return monthIncome(state, month) - monthSpending(state, month);
}

export function savingsRate(state, month) {
  const income = monthIncome(state, month);
  if (income <= 0) return 0;
  return Math.max(0, monthSaved(state, month) / income);
}

// Spending by category for a month, biggest first, with each category's
// colour for the charts.
export function categoryTotals(state, month) {
  const totals = new Map();
  for (const t of monthTransactions(state, month)) {
    if (t.kind !== 'expense' || t.category === 'savings') continue;
    totals.set(t.category, (totals.get(t.category) || 0) + t.amount);
  }
  return CATEGORIES.filter((c) => totals.has(c.id)).map((c) => ({
    ...c,
    spent: totals.get(c.id),
    budget: state.budgets[c.id] || 0,
  }));
}

export function budgetStatus(state, month) {
  return CATEGORIES.filter((c) => (state.budgets[c.id] || 0) > 0).map((c) => {
    const spent = monthTransactions(state, month)
      .filter((t) => t.kind === 'expense' && t.category === c.id)
      .reduce((sum, t) => sum + t.amount, 0);
    const budget = state.budgets[c.id];
    return { ...c, spent, budget, left: budget - spent, over: spent > budget };
  });
}

export function totalBudget(state) {
  return Object.values(state.budgets).reduce((sum, v) => sum + (Number(v) || 0), 0);
}

// Six months of income / spending for the cash-flow chart.
export function sixMonthHistory(state) {
  const months = monthsWithData(state).slice(-6);
  return months.map((m) => ({
    month: m,
    income: monthIncome(state, m),
    spending: monthSpending(state, m),
  }));
}

// Each recurring bill's next due date after today, soonest first.
export function upcomingBills(state) {
  const [ty, tm, td] = TODAY.split('-').map(Number);
  return state.bills
    .map((b) => {
      let year = ty;
      let month = tm;
      if (b.day < td) month += 1;
      if (month > 12) {
        month = 1;
        year += 1;
      }
      const due = `${year}-${String(month).padStart(2, '0')}-${String(b.day).padStart(2, '0')}`;
      return { ...b, due };
    })
    .sort((a, b) => (a.due < b.due ? -1 : 1));
}

// ---- Edits ---------------------------------------------------------------

export function addTransaction(state, tx) {
  const entry = { id: uid(), ...tx };
  state.transactions.push(entry);
  saveState(state);
  return entry;
}

export function deleteTransaction(state, id) {
  state.transactions = state.transactions.filter((t) => t.id !== id);
  saveState(state);
}

export function setBudget(state, categoryId, amount) {
  state.budgets[categoryId] = Math.max(0, Number(amount) || 0);
  saveState(state);
}

export function addToGoal(state, goalId, amount) {
  const goal = state.goals.find((g) => g.id === goalId);
  if (!goal) return;
  goal.saved = Math.max(0, goal.saved + (Number(amount) || 0));
  saveState(state);
}

export function addGoal(state, name, target) {
  const goal = { id: uid(), name, target: Math.max(1, Number(target) || 1), saved: 0, note: '' };
  state.goals.push(goal);
  saveState(state);
  return goal;
}

export function applyTemplate(state, template) {
  const fresh = seedState();
  fresh.household = template.name;
  fresh.budgets = { ...template.budgets };
  fresh.goals = template.goals.map((g) => ({ ...g }));
  fresh.transactions = template.transactions.map((row, i) => ({
    id: `tpl-${template.id}-${i}`,
    date: row[0],
    description: row[1],
    category: row[2],
    kind: row[3],
    amount: row[4],
  }));
  fresh.month = LATEST_MONTH;
  saveState(fresh);
  return fresh;
}
