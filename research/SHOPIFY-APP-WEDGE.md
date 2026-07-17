# The Shopify App Wedge — Decision & 90-Day Commitment

## The decision (switch #3 — the last one without market data)
We build **StoreBrief**: an AI app on the Shopify App Store that turns a
merchant's store data into a **plain-English weekly brief** — what sold, what
changed, what to do next — plus an "ask your store anything" box. Trust is
**structural**: it comes from the Shopify platform, app reviews, and read-only
permissions — not from the founder's age or ads.

**Commitment: 90 days on this direction. No further pivots without real market
data (installs, reviews, revenue).**

## Why this wedge (evidence, 2026)
- **Demand gap is documented.** 98.1% of Shopify stores have no dedicated
  analytics app — the single biggest category gap
  ([StoreInspect, 376K stores analyzed](https://storeinspect.com/report/state-of-shopify)).
  Six categories show review density 2.7x+ the store average — merchants
  searching and not finding ([GapQuery](https://www.gapquery.com/blog/shopify-high-demand-low-supply)).
- **The incumbent weakness is pricing dishonesty.** In analytics/reporting,
  36% of "free tier" apps lock everything behind ~$147/mo plans; merchants
  install, hit the paywall in week one, and churn
  ([GapQuery guide](https://www.gapquery.com/guides/shopify-app-ideas)).
  → Our wedge attack: a **genuinely useful free tier, forever** (the weekly
  brief), with a cheap honest Pro tier.
- **Underbuilt list for 2026 includes "Shopify-specific analytics dashboards"
  and commerce-tuned AI** ([GapQuery](https://www.gapquery.com/guides/shopify-app-ideas)).
- **Platform economics:** 0% Shopify revenue share on the first $1M; billing
  handled by Shopify (no Yoco integration needed); merchants self-install
  ([earlier research](GROWTH-WITHOUT-OUTREACH.md)).
- **Realistic funnel to respect:** ~3% install rate from listing views, ~5%
  paid conversion, ~10%/mo churn
  ([Week One Labs benchmarks](https://weekonelabs.com/blog/shopify-app-revenue-benchmarks-2026/)).
  This is a compounding grind, not a jackpot.

## Why THIS app first (and not subscriptions/POD, which show bigger gaps)
- **Read-only = low blast radius.** An analytics app can't break checkout,
  lose orders, or mis-bill. Perfect first app for earning 5-star reviews.
- **Claude-native.** Turning order/product data into clear insight text is
  exactly what we already know how to build (agent + guardrails patterns).
- POD needs a fulfillment network; subscriptions apps break on billing edge
  cases and punish new developers. Both are round-2 material, not round-1.

## Product spec (MVP)
- **Onboard:** merchant installs from App Store → grants read scopes
  (orders, products) → picks brief day/time.
- **The Weekly Brief (free forever):** plain-English email + in-app page:
  top movers, slumping products, best day, AOV change, one concrete
  suggestion. Written by Claude from Admin GraphQL data, with our guardrails
  discipline (no invented numbers — every figure computed in code, Claude
  only words the story).
- **Pro ($9/mo, honest):** daily brief, anomaly alerts ("sales dropped 40%
  vs typical Tuesday"), "ask your store anything" chat, 12-month lookback.
- **Never:** fake free tier, dark-pattern paywalls, write access.

## Stack
Shopify app template (Remix) + Shopify CLI, Admin GraphQL API (read scopes),
Shopify Billing API for the Pro plan, Claude API for narrative, hosted on
Vercel/Fly. Numbers computed deterministically in code; Claude narrates only.

## What carries over from NeverMiss
Agent architecture, guardrails philosophy (deterministic checks around the
LLM), test-first safety suite, Next/React skills, the deploy pipeline.
NeverMiss itself stays parked and live.

## 90-day plan
- **Weeks 1–3 — Build:** scaffold via Shopify CLI on a dev store; ingest
  orders/products; deterministic metrics module (+tests); Claude brief
  writer (+guardrails); brief page + email; Billing API Pro plan.
- **Week 4 — Submission:** Built-for-Shopify checklist, GDPR webhooks,
  listing (screenshots, demo video — we already know how to produce these),
  submit. Review takes ~1–2 weeks; iterate on feedback.
- **Weeks 5–13 — The review flywheel:** launch free tier wide; in-app
  review prompt after the 2nd brief; answer every support message same-day;
  ship weekly improvements from feedback; content = "what we learned from X
  stores' data" posts. Target by day 90: **50+ installs, 10+ reviews,
  first paid conversions.**

## Founder prerequisites (one-time, with a parent/guardian)
- Free **Shopify Partner account** (18+ ToS — guardian-held, like
  Meta/Anthropic).
- **Anthropic API key** — still required; every AI product we build needs it.

## Kill/continue criteria at day 90
- Continue hard: ≥50 installs and reviews ≥4.5 avg.
- Fix and persist: installs but weak activation → iterate onboarding.
- Only if <10 installs after real listing optimization + 8 weeks live do we
  reassess — with data, not vibes.
