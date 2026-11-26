// HomeLedger's pages. Each function returns the HTML for one hash route.
// Every control on these pages does something: the forms add, edit and
// delete real data, and the numbers are always computed from the household's
// own transactions.

import { CATEGORIES, INCOME_CATEGORIES, TEMPLATES } from './data.js';
import {
  budgetStatus,
  categoryTotals,
  monthIncome,
  monthSaved,
  monthSpending,
  monthTransactions,
  monthsWithData,
  savingsRate,
  sixMonthHistory,
  totalBudget,
  upcomingBills,
} from './store.js';
import { cashFlowChart, donutChart, progressBar } from './charts.js';
import { TODAY, dateLabel, escape, money, money0, monthLabel, pct } from './format.js';

function monthSwitcher(state, months) {
  const idx = months.indexOf(state.month);
  const prev = months[idx - 1];
  const next = months[idx + 1];
  return `<div class="month-switch">
    <button type="button" data-action="month" data-month="${prev || ''}" ${prev ? '' : 'disabled'}>&larr; Earlier</button>
    <strong>${monthLabel(state.month)}</strong>
    <button type="button" data-action="month" data-month="${next || ''}" ${next ? '' : 'disabled'}>Later &rarr;</button>
  </div>`;
}

function categoryOptions(selected) {
  const expense = CATEGORIES.map((c) => `<option value="${c.id}" ${c.id === selected ? 'selected' : ''}>${c.label}</option>`).join('');
  const income = INCOME_CATEGORIES.map((c) => `<option value="${c.id}" ${c.id === selected ? 'selected' : ''}>${c.label} (income)</option>`).join('');
  return `<optgroup label="Spending">${expense}</optgroup><optgroup label="Income">${income}</optgroup>`;
}

export function dashboard(state) {
  const month = state.month;
  const months = monthsWithData(state);
  const income = monthIncome(state, month);
  const spending = monthSpending(state, month);
  const saved = monthSaved(state, month);
  const rate = savingsRate(state, month);
  const over = budgetStatus(state, month).filter((b) => b.over);
  const biggest = monthTransactions(state, month)
    .filter((t) => t.kind === 'expense' && t.category !== 'savings')
    .sort((a, b) => b.amount - a.amount)[0];
  const bills = upcomingBills(state).slice(0, 4);
  const history = sixMonthHistory(state);

  const insights = [];
  if (over.length) {
    insights.push(`<li class="warn"><b>${over.map((o) => o.label).join(' and ')}</b> ${over.length > 1 ? 'are' : 'is'} over budget this month — ${over.map((o) => `${money0(o.spent - o.budget)} over on ${o.label}`).join('; ')}.</li>`);
  } else {
    insights.push('<li class="good">Every category is inside its budget this month.</li>');
  }
  if (biggest) insights.push(`<li>Biggest single expense: <b>${escape(biggest.description)}</b> at ${money(biggest.amount)} on ${dateLabel(biggest.date)}.</li>`);
  insights.push(
    rate >= 0.2
      ? `<li class="good">You saved ${pct(rate)}% of income — ahead of the 20% target in the 50/30/20 rule.</li>`
      : `<li class="warn">You saved ${pct(rate)}% of income — below the 20% target in the 50/30/20 rule. See the Plan page for ideas.</li>`,
  );

  return `
  <section class="page-head">
    <div>
      <h1>${escape(state.household)}</h1>
      <p>Your money, month by month. Everything here is computed from your own transactions.</p>
    </div>
    ${monthSwitcher(state, months)}
  </section>

  <section class="cards">
    <article class="card stat"><span>Income</span><strong>${money(income)}</strong><small>${monthLabel(month)}</small></article>
    <article class="card stat"><span>Spending</span><strong>${money(spending)}</strong><small>excluding money moved to savings</small></article>
    <article class="card stat"><span>Saved</span><strong>${money(saved)}</strong><small>income minus spending</small></article>
    <article class="card stat"><span>Savings rate</span><strong>${pct(rate)}%</strong><small>target: at least 20%</small></article>
  </section>

  <section class="grid-2">
    <article class="card">
      <h2>Where the money went</h2>
      ${donutChart(categoryTotals(state, month))}
    </article>
    <article class="card">
      <h2>Income vs spending — last 6 months</h2>
      ${cashFlowChart(history)}
      <p class="hint">Income has beaten spending every month since June. The gap is what reaches your goals.</p>
    </article>
  </section>

  <section class="grid-2">
    <article class="card">
      <h2>At a glance</h2>
      <ul class="insights">${insights.join('')}</ul>
      <p><a class="btn" href="#/budget">Review the budget &rarr;</a></p>
    </article>
    <article class="card">
      <h2>Upcoming bills</h2>
      <ul class="bills">${bills.map((b) => `<li><span>${escape(b.name)}</span><b>${money(b.amount)}</b><small>due ${dateLabel(b.due)}</small></li>`).join('')}</ul>
      <p><a class="btn" href="#/transactions">See all transactions &rarr;</a></p>
    </article>
  </section>`;
}

export function transactionsPage(state, filter = {}) {
  const month = state.month;
  const months = monthsWithData(state);
  let rows = monthTransactions(state, month);
  if (filter.kind && filter.kind !== 'all') rows = rows.filter((t) => t.kind === filter.kind);
  if (filter.category) rows = rows.filter((t) => t.category === filter.category);
  if (filter.q) {
    const q = filter.q.toLowerCase();
    rows = rows.filter((t) => t.description.toLowerCase().includes(q));
  }
  const income = rows.filter((t) => t.kind === 'income').reduce((s, t) => s + t.amount, 0);
  const spending = rows.filter((t) => t.kind === 'expense').reduce((s, t) => s + t.amount, 0);

  const categoryLabel = (t) => {
    if (t.kind === 'income') {
      const found = INCOME_CATEGORIES.find((c) => c.id === t.category);
      return found ? found.label : t.category;
    }
    const found = CATEGORIES.find((c) => c.id === t.category);
    return found ? found.label : t.category;
  };

  return `
  <section class="page-head">
    <div>
      <h1>Transactions</h1>
      <p>Add every dollar in and out. The dashboard, budget and goals all update from this list.</p>
    </div>
    ${monthSwitcher(state, months)}
  </section>

  <section class="card">
    <h2>Add a transaction</h2>
    <form id="add-tx" class="form-grid">
      <label>Date <input type="date" name="date" value="${TODAY}" required></label>
      <label>Description <input type="text" name="description" placeholder="e.g. Groceries — GreenMart" maxlength="80" required></label>
      <label>Kind
        <select name="kind" id="tx-kind">
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
      </label>
      <label>Category <select name="category" id="tx-category">${categoryOptions('groceries')}</select></label>
      <label>Amount ($) <input type="number" name="amount" min="0.01" step="0.01" placeholder="0.00" required></label>
      <button class="btn primary" type="submit">Add transaction</button>
    </form>
  </section>

  <section class="card">
    <h2>${monthLabel(month)} — ${rows.length} transaction${rows.length === 1 ? '' : 's'}</h2>
    <div class="filters">
      <label>Type
        <select id="filter-kind">
          <option value="all" ${filter.kind === 'all' || !filter.kind ? 'selected' : ''}>All</option>
          <option value="income" ${filter.kind === 'income' ? 'selected' : ''}>Income</option>
          <option value="expense" ${filter.kind === 'expense' ? 'selected' : ''}>Expense</option>
        </select>
      </label>
      <label>Category
        <select id="filter-category">
          <option value="">All categories</option>
          ${CATEGORIES.map((c) => `<option value="${c.id}" ${filter.category === c.id ? 'selected' : ''}>${c.label}</option>`).join('')}
          ${INCOME_CATEGORIES.map((c) => `<option value="${c.id}" ${filter.category === c.id ? 'selected' : ''}>${c.label} (income)</option>`).join('')}
        </select>
      </label>
      <label>Search <input type="search" id="filter-q" placeholder="Search descriptions" value="${escape(filter.q || '')}"></label>
    </div>
    <p class="totals">In: <b class="in">${money(income)}</b> &nbsp; Out: <b class="out">${money(spending)}</b> &nbsp; Net: <b>${money(income - spending)}</b></p>
    <ul class="tx-list">
      ${rows.map((t) => `<li>
        <span class="tx-date">${dateLabel(t.date)}</span>
        <span class="tx-desc">${escape(t.description)}<small>${categoryLabel(t)}</small></span>
        <span class="tx-amount ${t.kind}">${t.kind === 'income' ? '+' : '−'}${money(t.amount)}</span>
        <button type="button" class="delete" data-action="delete-tx" data-id="${t.id}" aria-label="Delete ${escape(t.description)}">Delete</button>
      </li>`).join('') || '<li class="empty">No transactions match these filters.</li>'}
    </ul>
  </section>`;
}

export function budgetPage(state) {
  const month = state.month;
  const months = monthsWithData(state);
  const rows = budgetStatus(state, month);
  const spent = rows.reduce((s, r) => s + r.spent, 0);
  const budget = totalBudget(state);
  const left = budget - spent;
  const over = rows.filter((r) => r.over);

  return `
  <section class="page-head">
    <div>
      <h1>Budget</h1>
      <p>One limit per category, for the month. Change a limit and the dashboard follows it at once.</p>
    </div>
    ${monthSwitcher(state, months)}
  </section>

  <section class="cards">
    <article class="card stat"><span>Budgeted</span><strong>${money(budget)}</strong><small>all categories, ${monthLabel(month)}</small></article>
    <article class="card stat"><span>Spent</span><strong>${money(spent)}</strong><small>${pct(budget ? spent / budget : 0)}% of the budget</small></article>
    <article class="card stat"><span>${left >= 0 ? 'Left to spend' : 'Over budget'}</span><strong class="${left < 0 ? 'out' : ''}">${money(Math.abs(left))}</strong><small>${over.length ? `${over.length} categor${over.length === 1 ? 'y' : 'ies'} over` : 'every category inside its limit'}</small></article>
  </section>

  <section class="card">
    <h2>Category budgets</h2>
    <ul class="budget-list">
      ${rows.map((r) => `<li>
        <div class="budget-top">
          <span class="dot" style="background:${r.color}"></span>
          <b>${r.label}</b>
          <span class="budget-figures">${money(r.spent)} of ${money(r.budget)}</span>
          <span class="budget-left ${r.over ? 'out' : ''}">${r.over ? `${money(r.spent - r.budget)} over` : `${money(r.left)} left`}</span>
        </div>
        ${progressBar(r.budget ? r.spent / r.budget : 0, r.over)}
        <form class="budget-edit" data-category="${r.id}">
          <label>Monthly limit ($) <input type="number" name="limit" min="0" step="1" value="${r.budget}"></label>
          <button class="btn" type="submit">Save limit</button>
        </form>
      </li>`).join('')}
    </ul>
    <p class="hint">A good starting point is the 50/30/20 rule: about 50% of take-home pay for needs, 30% for wants, 20% for savings and extra debt payments. The Plan page shows this household's actual split.</p>
  </section>`;
}

export function goalsPage(state) {
  return `
  <section class="page-head">
    <div>
      <h1>Savings goals</h1>
      <p>What the money is for. Add funds whenever you have spare cash and watch the bars move.</p>
    </div>
  </section>

  <section class="grid-2">
    ${state.goals.map((g) => {
      const frac = g.target ? g.saved / g.target : 0;
      return `<article class="card goal">
        <h2>${escape(g.name)}</h2>
        <p class="goal-figures"><strong>${money(g.saved)}</strong> of ${money(g.target)} <span>(${pct(frac)}%)</span></p>
        ${progressBar(frac)}
        ${g.note ? `<p class="hint">${escape(g.note)}</p>` : ''}
        <form class="goal-add" data-goal="${g.id}">
          <label>Add funds ($) <input type="number" name="amount" min="1" step="1" placeholder="50" required></label>
          <button class="btn primary" type="submit">Add funds</button>
        </form>
        <p class="hint">${money(Math.max(0, g.target - g.saved))} to go.</p>
      </article>`;
    }).join('')}
  </section>

  <section class="card">
    <h2>Start a new goal</h2>
    <form id="add-goal" class="form-grid">
      <label>Goal name <input type="text" name="name" placeholder="e.g. New roof" maxlength="60" required></label>
      <label>Target ($) <input type="number" name="target" min="1" step="1" placeholder="1000" required></label>
      <button class="btn primary" type="submit">Create goal</button>
    </form>
  </section>`;
}

export function planPage(state) {
  const month = state.month;
  const months = monthsWithData(state);
  const rows = monthTransactions(state, month);
  const income = monthIncome(state, month);
  const needsCats = ['housing', 'groceries', 'utilities', 'transport', 'health', 'kids'];
  const wantsCats = ['dining', 'entertainment', 'subscriptions', 'shopping', 'other'];
  const needs = rows.filter((t) => t.kind === 'expense' && needsCats.includes(t.category)).reduce((s, t) => s + t.amount, 0);
  const wants = rows.filter((t) => t.kind === 'expense' && wantsCats.includes(t.category)).reduce((s, t) => s + t.amount, 0);
  const saved = monthSaved(state, month);
  const split = (v) => (income > 0 ? pct(v / income) : 0);

  return `
  <section class="page-head">
    <div>
      <h1>Plan &amp; templates</h1>
      <p>How this household's month actually splits, a rule of thumb to check it against, and starter plans for other kinds of households.</p>
    </div>
    ${monthSwitcher(state, months)}
  </section>

  <section class="card">
    <h2>The 50/30/20 rule — this month</h2>
    <p>Take-home pay splits three ways: needs, wants, and savings plus extra debt payments. Here is ${monthLabel(month)} against the rule.</p>
    <ul class="split">
      <li><b>Needs — ${split(needs)}%</b> (rule: 50%)<span>${money(needs)} on housing, groceries, utilities, transport, health and kids</span>${progressBar(income ? needs / income : 0)}</li>
      <li><b>Wants — ${split(wants)}%</b> (rule: 30%)<span>${money(wants)} on dining out, entertainment, subscriptions and shopping</span>${progressBar(income ? wants / income : 0)}</li>
      <li><b>Savings — ${split(saved)}%</b> (rule: 20%)<span>${money(saved)} kept from ${money(income)} of income</span>${progressBar(income ? saved / income : 0)}</li>
    </ul>
    <p class="hint">Needs above 50% usually means housing costs most; the fix is rarely a cheaper lunch. Wants above 30% is where small cuts add up fastest — one subscription or takeout night a week is often $100 a month.</p>
  </section>

  <section>
    <h2 class="section-title">Starter plans</h2>
    <p>Pick a household like yours and the site loads its budgets, goals and a month of starter transactions. Your current data is replaced, so export it first if you want to keep it.</p>
    <div class="grid-2">
      ${TEMPLATES.map((t) => `<article class="card template">
        <h3>${t.name}</h3>
        <p>${t.blurb}</p>
        <p class="hint">Monthly budget: ${money(Object.values(t.budgets).reduce((s, v) => s + v, 0))} across ${Object.values(t.budgets).filter((v) => v > 0).length} categories.</p>
        <button type="button" class="btn primary" data-action="apply-template" data-template="${t.id}">Use this plan</button>
      </article>`).join('')}
    </div>
  </section>

  <section class="card">
    <h2>Your data</h2>
    <p>HomeLedger keeps everything in this browser, in localStorage. No account, no server, nothing uploaded. Export a backup before trying a template or a reset.</p>
    <div class="data-tools">
      <button type="button" class="btn" data-action="export-data">Export data (JSON)</button>
      <label class="btn file-btn">Import data (JSON)<input type="file" id="import-file" accept="application/json,.json" hidden></label>
      <button type="button" class="btn" data-action="reset-demo">Reset to the demo household</button>
    </div>
    <p class="hint" id="data-note"></p>
  </section>`;
}

export function notFound() {
  return `<section class="page-head"><div>
    <h1>Page not found</h1>
    <p>There is no page at this address.</p>
    <p><a class="btn" href="#/">Back to the dashboard &rarr;</a></p>
  </div></section>`;
}
