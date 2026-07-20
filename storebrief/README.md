# StoreBrief

Your Shopify store, explained in plain English. A free weekly brief — sales,
what changed, what to do about it — with a paid tier later. Full decision
record and market evidence: `../research/SHOPIFY-APP-WEDGE.md`.

## Architecture

```
Shopify Admin API ──▶ lib/shopify.ts   (adapter: map orders, drop test/cancelled)
                          │
                          ▼
                     lib/metrics.ts    (engine: every number computed, never guessed)
                          │
              ┌───────────┴───────────┐
              ▼                       ▼
        lib/render.ts           lib/writer.ts   (optional AI rephrase — Claude,
        (deterministic          numeric guardrail: any number not derivable
         plain-text brief)      from the data ⇒ fall back to the template)
              │                       │
              └───────────┬───────────┘
                          ▼
                     lib/email.ts     (weekly HTML email, all inputs escaped)
```

Design rule carried over from NeverMiss: **numbers live in code; the AI only
rephrases.** `tests/writer.test.ts` proves an invented or re-rounded number
forces the deterministic fallback.

## Status

- [x] Metrics engine + tests (windows, baselines, slumps, best day, suggestion)
- [x] 4-week momentum trend + streak detection ("up 3 weeks in a row")
- [x] Repeat-customer tracking (identified vs returning orders)
- [x] AI writer + numeric guardrail + no-key fallback
- [x] Shopify adapter (`ORDERS_QUERY`, test/cancelled exclusion, customer ids,
      cursor pagination) — validated against real Escape-store data via the
      Shopify MCP connector; fetch 4 windows (`ordersSinceFilter`) for the trend
- [x] Weekly HTML email renderer (stats, sparkline, slump alert, action)
- [ ] App shell: OAuth, mandatory GDPR webhooks, Billing API, listing —
      **blocked on a Shopify Partner account** (18+ ToS; guardian-held)

## Running

```
npm test                      # 4 suites, no network, no keys needed
npm run typecheck
npx tsx scripts/brief-from-json.ts <orders.json> [windowDays] [shopName] [currency]
npx tsx scripts/render-email-sample.ts [out.html]
```

`ANTHROPIC_API_KEY` enables the AI rewrite; without it every brief uses the
deterministic template, which is always correct.
