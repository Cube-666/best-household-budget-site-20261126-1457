// HomeLedger's router and event wiring. Pages are hash routes so every
// section is a link; one delegated handler covers the buttons, and the
// forms below add, edit and delete real data.
//
//   #/                Dashboard
//   #/transactions    Transactions
//   #/budget          Budget
//   #/goals           Savings goals
//   #/plan            Plan & templates
//
// window.__shotReady is false while a page renders and true once it is on
// screen, so a screenshot script knows when to capture.

import { CATEGORIES, INCOME_CATEGORIES, TEMPLATES } from './data.js';
import {
  addGoal,
  addToGoal,
  addTransaction,
  applyTemplate,
  deleteTransaction,
  loadState,
  resetDemo,
  saveState,
  setBudget,
} from './store.js';
import { budgetPage, dashboard, goalsPage, notFound, planPage, transactionsPage } from './views.js';

const app = document.getElementById('app');
let state = loadState();
let txFilter = { kind: 'all', category: '', q: '' };

function toast(message) {
  let note = document.getElementById('toast');
  if (!note) {
    note = document.createElement('p');
    note.id = 'toast';
    note.setAttribute('role', 'status');
    document.body.appendChild(note);
  }
  note.textContent = message;
  note.classList.add('show');
  window.clearTimeout(note._timer);
  note._timer = window.setTimeout(() => note.classList.remove('show'), 2600);
}

function currentRoute() {
  const hash = location.hash || '#/';
  if (hash === '#/' || hash === '#') return 'dashboard';
  if (hash.startsWith('#/transactions')) return 'transactions';
  if (hash.startsWith('#/budget')) return 'budget';
  if (hash.startsWith('#/goals')) return 'goals';
  if (hash.startsWith('#/plan')) return 'plan';
  return 'missing';
}

function render() {
  window.__shotReady = false;
  const route = currentRoute();
  const titles = {
    dashboard: 'HomeLedger — Household Budget Planner',
    transactions: 'Transactions | HomeLedger',
    budget: 'Budget | HomeLedger',
    goals: 'Savings Goals | HomeLedger',
    plan: 'Plan & Templates | HomeLedger',
    missing: 'Not found | HomeLedger',
  };
  document.title = titles[route];
  document.querySelectorAll('nav a').forEach((a) => {
    a.classList.toggle('active', a.dataset.route === route);
  });
  if (route === 'dashboard') app.innerHTML = dashboard(state);
  else if (route === 'transactions') app.innerHTML = transactionsPage(state, txFilter);
  else if (route === 'budget') app.innerHTML = budgetPage(state);
  else if (route === 'goals') app.innerHTML = goalsPage(state);
  else if (route === 'plan') app.innerHTML = planPage(state);
  else app.innerHTML = notFound();
  window.scrollTo(0, 0);
  window.__shotReady = true;
}

function rerender() {
  state = loadState();
  render();
}

// Switch to the month the button names (the button is disabled when there
// is no earlier or later month with transactions).
function goToMonth(target) {
  const months = [...new Set(state.transactions.map((t) => t.date.slice(0, 7)))].sort();
  if (target && months.includes(target)) {
    state.month = target;
    saveState(state);
    render();
  }
}

document.addEventListener('click', (event) => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const action = button.dataset.action;
  if (action === 'month') goToMonth(button.dataset.month);
  if (action === 'delete-tx') {
    const row = state.transactions.find((t) => t.id === button.dataset.id);
    if (row && window.confirm(`Delete "${row.description}" (${row.amount.toFixed(2)})?`)) {
      deleteTransaction(state, button.dataset.id);
      rerender();
      toast('Transaction deleted.');
    }
  }
  if (action === 'apply-template') {
    const template = TEMPLATES.find((t) => t.id === button.dataset.template);
    if (!template) return;
    if (window.confirm(`Use the "${template.name}" plan? Your current budgets, goals and transactions will be replaced.`)) {
      state = applyTemplate(state, template);
      txFilter = { kind: 'all', category: '', q: '' };
      location.hash = '#/';
      render();
      toast(`Loaded the ${template.name} plan.`);
    }
  }
  if (action === 'reset-demo') {
    if (window.confirm('Reset to the demo household? Your edits will be lost.')) {
      state = resetDemo();
      txFilter = { kind: 'all', category: '', q: '' };
      location.hash = '#/';
      render();
      toast('Demo household restored.');
    }
  }
  if (action === 'export-data') {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'homeledger-backup.json';
    a.click();
    URL.revokeObjectURL(url);
    toast('Backup downloaded.');
  }
});

// Forms are wired after each render, since the page HTML is rebuilt.
document.addEventListener('submit', (event) => {
  event.preventDefault();
  const form = event.target;
  const data = new FormData(form);
  if (form.id === 'add-tx') {
    const kind = data.get('kind');
    const category = data.get('category');
    const amount = Number(data.get('amount'));
    if (!amount || amount <= 0) return;
    addTransaction(state, {
      date: data.get('date'),
      description: String(data.get('description')).trim(),
      category,
      kind,
      amount: Math.round(amount * 100) / 100,
    });
    rerender();
    toast('Transaction added.');
  }
  if (form.classList.contains('budget-edit')) {
    setBudget(state, form.dataset.category, data.get('limit'));
    rerender();
    toast('Budget limit saved.');
  }
  if (form.classList.contains('goal-add')) {
    const amount = Number(data.get('amount'));
    if (!amount || amount <= 0) return;
    addToGoal(state, form.dataset.goal, amount);
    rerender();
    toast('Funds added to the goal.');
  }
  if (form.id === 'add-goal') {
    addGoal(state, String(data.get('name')).trim(), data.get('target'));
    rerender();
    toast('Goal created.');
  }
});

// Transaction filters re-render the list as they change.
document.addEventListener('change', (event) => {
  const el = event.target;
  if (el.id === 'filter-kind') {
    txFilter.kind = el.value;
    render();
  }
  if (el.id === 'filter-category') {
    txFilter.category = el.value;
    render();
  }
  if (el.id === 'tx-kind') {
    const select = document.getElementById('tx-category');
    if (!select) return;
    const list = el.value === 'income' ? INCOME_CATEGORIES : CATEGORIES;
    select.innerHTML = list.map((c) => `<option value="${c.id}">${c.label}</option>`).join('');
  }
  if (el.id === 'import-file' && el.files && el.files[0]) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(String(reader.result));
        if (!Array.isArray(imported.transactions) || !imported.budgets) throw new Error('bad file');
        state = imported;
        saveState(state);
        txFilter = { kind: 'all', category: '', q: '' };
        location.hash = '#/';
        render();
        toast('Data imported.');
      } catch {
        toast('That file is not a HomeLedger backup.');
      }
    };
    reader.readAsText(el.files[0]);
  }
});

document.addEventListener('input', (event) => {
  if (event.target.id === 'filter-q') {
    txFilter.q = event.target.value;
    const list = document.querySelector('.tx-list');
    if (list) render();
  }
});

window.addEventListener('hashchange', render);
render();
