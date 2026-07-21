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
- [x] Busiest time of day (timezone-aware 3-hour blocks, ≥2 orders)
- [x] Best-week detection (🏆) + suggestion brain: restock winner, win-back
      past customers, celebrate best week, slump, push winner — priority-ordered
- [x] "Why sales moved" decomposition (order-count vs basket-size effects,
      summing exactly to the change) — Shopify shows charts, never the why
- [x] Stock-out forecast (velocity-based days-left on top sellers, via
      optional `inventory` input)
- [x] WhatsApp-formatted brief (`renderWhatsAppText`) — guardrail-checked
- [x] WhatsApp delivery module (`lib/whatsapp.ts`, Twilio) — handles the Meta
      24-hour-window rule (proactive sends are template-gated); injectable
      transport so tests verify the payload without the network
- [x] AI writer + numeric guardrail + no-key fallback
- [x] Shopify adapter (`ORDERS_QUERY`, test/cancelled exclusion, customer ids,
      cursor pagination) — validated against real Escape-store data via the
      Shopify MCP connector; fetch 4 windows (`ordersSinceFilter`) for the trend
- [x] Weekly HTML email renderer (stats, sparkline, slump alert, action)
- [x] Marketing landing page (`web/index.html`) — self-contained, both themes,
      with a live in-browser demo that runs a JS port of the engine
- [ ] App shell: OAuth, mandatory GDPR webhooks, Billing API, listing —
      **blocked on a Shopify Partner account** (18+ ToS; guardian-held)

## Landing page

`web/index.html` is a complete, self-contained sales page (no build step, no
external assets). The `<!-- ARTIFACT-BODY-START/END -->` markers bracket the
inner body for publishing as a Claude Artifact; the file also serves as-is from
any static host. The live demo ports `computeBrief` / `renderBriefText` /
`renderWhatsAppText` to vanilla JS so the numbers on the page are computed, not
mocked.

## Running

```
npm test                      # 4 suites, no network, no keys needed
npm run typecheck
npx tsx scripts/brief-from-json.ts <orders.json> [windowDays] [shopName] [currency]
npx tsx scripts/render-email-sample.ts [out.html]
```

`ANTHROPIC_API_KEY` enables the AI rewrite; without it every brief uses the
deterministic template, which is always correct.
