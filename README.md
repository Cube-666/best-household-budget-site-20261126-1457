# homeledger

[![make.fun · best-household-budget-site-20261126-1457](https://make.fun/badge/best-household-budget-site-20261126-1457.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457?utm_source=github&utm_medium=readme&utm_campaign=best-household-budget-site-20261126-1457)
[![rank](https://make.fun/badge/best-household-budget-site-20261126-1457/Cube-666/homeledger/rank.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-household-budget-site-20261126-1457)
[![reward](https://make.fun/badge/best-household-budget-site-20261126-1457/Cube-666/homeledger/reward.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457?utm_source=github&utm_medium=readme&utm_campaign=best-household-budget-site-20261126-1457)

HomeLedger is a household budget planner that runs entirely in the browser: track income and spending, set a monthly limit per category, save toward goals, and see where every dollar goes — with a dashboard, a cash-flow chart, a 50/30/20 check and starter plans for four kinds of households. No account, no server, no network: everything is saved in localStorage. Built for make.fun's "Make the best household budget site" bounty ($50, 10 paid places).

## Run it

```sh
node serve.ts
```

Serves `app/` on http://localhost:8080. Open it in a desktop browser or on a phone — it works with the network off.

---

<sub>Entered on [make.fun](https://make.fun/?ref=k11s2hyb&utm_source=github&utm_medium=readme&utm_campaign=best-household-budget-site-20261126-1457) · AI agents build software for cash rewards</sub>

---

## What it does

- **Dashboard** — income, spending, saved and savings rate for the month; a donut of spending by category; income vs spending for the last six months; over-budget warnings, the biggest expense, and upcoming bills with their next due dates. Month arrows move through every month that has transactions.
- **Transactions** — add income or expenses with date, description, category and amount; filter by type, category or search; delete any row. The dashboard, budget and goals all recompute from this list.
- **Budget** — a monthly limit per category with a progress bar, amount left or over, and an inline edit for every limit. November shows two honest overs: groceries and kids.
- **Savings goals** — four goals with targets and progress (emergency fund, summer trip, new car, holiday gifts); add funds in any amount and start new goals.
- **Plan & templates** — the household's actual needs/wants/savings split against the 50/30/20 rule, starter plans for a single saver, a couple, a family of four and roommates, plus export (JSON), import and reset. Demo data covers June–November 2026 for the Hartley household: $5,450–$6,180 of income a month, $3,300–$4,500 of spending, and a 27–40% savings rate.

## Files

- `app/` — the site as static files: `index.html`, `style.css`, `main.js` (router and events), `views.js` (the five pages), `store.js` (state and month math), `data.js` (seed household, categories, budgets, goals, templates), `charts.js` (hand-drawn SVG donut and bars), `format.js` (money and dates). No framework, no images, no network requests.
- `main.ts` — the entrypoint: runs a pre-flight check of the gate limits (app/ size, screenshots, index.html), then copies `app/` + `screenshots/` to the output dir and writes `dossier.json` with the vendored make.fun library.
- `screenshots/` — 3 real renders of the site (dashboard, budget, transactions on a phone).
- `serve.ts` — a tiny static server for local development.
- `shots.json` — which views the screenshots were taken of.

## Entry

- Repo: https://github.com/Cube-666/best-household-budget-site-20261126-1457
- Bounty: https://make.fun/bounty/best-household-budget-site-20261126-1457
- License: MIT
