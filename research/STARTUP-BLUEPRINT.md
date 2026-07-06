# TradeFlow — Startup Blueprint

*The AI quote-to-cash operating system for South African trade & service SMEs. WhatsApp-native. Yoco-powered. Built by one founder with Claude.*

> Companion to `OPPORTUNITY-RESEARCH.md` (the evidence and scoring behind choosing this). This document is the build + go-to-market + financial plan for the winner. Figures marked **[Est.]** are modelled assumptions, not facts — pressure-test them in-market.

---

## 16. Startup Blueprint

### 16.1 Product vision
Every service business lives or dies on two moments: **winning the job** (a fast, professional quote) and **getting paid** (deposit + balance, without begging). TradeFlow owns both, inside the app the customer already uses all day — WhatsApp — and settles the money on rails they trust — Yoco. Start as the fastest way for a plumber to quote and get paid; become the operating system for the trade.

**One-sentence pitch:** *"Send a voice note, get a professional quote, and get paid on WhatsApp — in 60 seconds."*

### 16.2 The killer workflow (the wedge — must feel like magic)
1. Tradesperson opens WhatsApp (or the TradeFlow web app) and **sends a voice note or text**: *"Install two 150-litre geysers and replace 15 metres of 22mm copper pipe for Jane Dlamini in Sandton."*
2. TradeFlow (Claude) returns a **structured, itemised quote** — materials + labour, priced from the tradesperson's **price book** — with low-confidence items flagged for a tap-to-confirm.
3. One tap → **branded PDF quote** + a pre-written WhatsApp message to the client.
4. Client taps **Accept** → TradeFlow issues a **deposit invoice with a Yoco pay-link**.
5. On job completion, the balance invoice goes out; **automated reminders** (WhatsApp) chase it at +3/+7/+14 days until paid; proof-of-payment JPEGs are **auto-matched**.
6. The job, client, and cash status are **logged** — the beginning of the OS.

**Target: under 60 seconds** from voice note to send-ready quote.

### 16.3 MVP scope (60-day wedge) — in vs. explicitly out
| Capability | MVP? |
|---|---|
| Voice-note / text → structured quote (Claude) | ✅ In |
| Editable line items + live totals + VAT | ✅ In |
| Personal **price book** (materials + labour rates) | ✅ In — the moat |
| Branded PDF quote | ✅ In |
| Send via WhatsApp + share link | ✅ In |
| Client **Accept**, deposit invoice, **Yoco pay-link** | ✅ In |
| Automated payment reminders + proof-of-payment matching | ✅ In |
| Quote/invoice status tracking + duplicate | ✅ In |
| Job scheduling / calendar | ⏳ Phase 2 |
| Team seats / roles | ⏳ Phase 2 |
| SARS-ready books / VAT reports | ⏳ Phase 3 (annexes Research §12 bet #2) |
| CRM pipeline, client portal, multi-trade templates | ❌ Out at launch |

**Guardrail:** if a feature doesn't make a quote *faster*, *more accurate*, or *more likely to be paid*, it's not in the MVP.

### 16.4 Wedge → OS-for-the-niche expansion map
Quote-to-cash (wedge) → **jobs + clients** (light CRM emerges) → **scheduling + team** → **compliance docs** (electrical CoC, solar SSEG) → **SARS-ready books** → **adjacent trades** (swap the price book). Each layer raises switching cost; payments + price-book data are the anchor.

### 16.5 Pages / screens (build checklist)
1. **Onboarding wizard** (~2 min): business name, logo, contact, VAT on/off, default labour rate(s), payment terms, connect Yoco. Optional: paste/upload a rough price list (or concierge-built).
2. **Home** — big **+ New Quote**; recent quotes with status pills (Draft / Sent / Viewed / Accepted / Paid); week stats (quotes sent, value, paid).
3. **New Quote (core)** — voice/text input; auto-filled customer; editable materials/labour table with confidence flags; live totals; Save / Preview / Send.
4. **Quote preview / PDF** — branded render; download + copy link.
5. **Send** — WhatsApp message draft + share link.
6. **Invoices & payments** — deposit/balance invoices, Yoco pay-links, reminder timeline, proof-of-payment inbox.
7. **Price book** — editable materials + labour; auto-grows from quotes.
8. **Clients / jobs** — list + detail + duplicate.
9. **Settings / billing** — profile, VAT, terms, Yoco, subscription.

### 16.6 Tech stack for a solo founder (cheap, fast, learnable)
- **AI engine:** Claude API (Opus/Sonnet) for quote parsing & drafting; keep Claude Pro for building. Voice notes → text via a speech-to-text API (or Claude-compatible transcription), then Claude for structuring.
- **Front end:** a lightweight React/Next.js web app (mobile-first) — or start even leaner with a WhatsApp-first flow so there's *no app to install*.
- **Messaging:** WhatsApp Business API via a provider (Infobip / Meta Cloud API) for inbound voice notes and outbound quotes/reminders.
- **Payments:** **Yoco** payment links / online checkout for deposits & balances (the founder already has Yoco); Stitch/Ozow as EFT alternatives later.
- **Backend/data:** a managed BaaS (Supabase/Firebase) — auth, Postgres, storage for PDFs/logos. PDF generation via a serverless function.
- **Hosting:** Vercel/Netlify (front end) + serverless functions; all usage-based, near-zero fixed cost.
- **Why this stack:** every piece is API-driven and learnable solo; Claude does the hard NLP so you don't build/train ML.

### 16.7 Claude prompts (core "job text → quote" engine)
**System prompt (sketch):**
```
You are TradeFlow's quoting engine for South African trade businesses.
Given (a) a job description (text or transcribed voice note) and (b) the
tradesperson's PRICE_BOOK (materials with unit prices; labour tasks with
hours and hourly rate) and BUSINESS_PROFILE (VAT %, currency ZAR, terms),
produce a structured quote.

Rules:
- Extract customer name/location if present.
- Break the job into MATERIALS and LABOUR line items.
- Price each item from PRICE_BOOK when a confident match exists.
- If no match, estimate a sensible default and set "confidence":"low" with
  a short "assumption" note (e.g. "assumed 22mm copper — please confirm").
- NEVER silently invent a price the user can't see; every line is editable.
- Compute subtotal, VAT, total, and suggested deposit (per terms).
- Output STRICT JSON only, matching the schema. Currency = ZAR.
```
**Structured-output schema (sketch):**
```json
{
  "customer": {"name": "", "location": "", "contact": ""},
  "materials": [{"item":"","qty":0,"unit":"","unit_price":0,"line_total":0,"confidence":"high|low","assumption":""}],
  "labour":    [{"task":"","hours":0,"rate":0,"line_total":0,"confidence":"high|low","assumption":""}],
  "subtotal":0,"vat":0,"total":0,"suggested_deposit":0,
  "clarifying_questions": ["..."]
}
```
**Worked example (input):** *"Install 2 geysers 150L and replace 15m of 22mm copper pipe, client Jane in Sandton."*
**Output (abridged):** materials → `2 × 150L geyser`, `~15m 22mm copper pipe + fittings`; labour → `geyser install ×2`, `pipe replacement`; any unpriced item flagged `confidence:"low"`; totals + suggested deposit computed; `clarifying_questions: ["Is the existing geyser electric or solar?"]`.

Reminder/collection prompt: a second, smaller Claude prompt drafts polite, escalating WhatsApp reminders in the tradesperson's voice, and classifies an uploaded proof-of-payment image as matching/likely/unclear.

### 16.8 Pricing & packaging (ZAR + USD)
Anchor to outcome — *"win more jobs, get paid ~16 days sooner"* [Fact — Chaser] — not "an invoice app."

| Plan | Price [Est.] | For | Includes |
|---|---|---|---|
| **Starter (free)** | R0 | Trying it | 5 quotes/mo, branded PDF, send via WhatsApp |
| **Pro** | **R299/mo (~$16)** | Owner-operator | Unlimited quotes, price book, Yoco pay-links, auto-reminders, proof-of-payment matching |
| **Team** | **R699/mo (~$38)** | 2–8 staff | Everything + multiple users, shared price book, job scheduling |

- **Payments upside:** a small platform fee on payments processed through TradeFlow (or a Yoco revenue-share partnership) adds usage revenue on top of subscriptions — the embedded-payments retention edge from Research §1.
- **Free tier is deliberate** — it matches the free SA incumbents (PopPay/payPod) on price while the AI quoting + get-paid loop is the reason to upgrade to Pro.
- **14-day Pro trial**, no card. **Founder deal** for the first 10: lifetime discount for feedback + a testimonial.

### 16.9 Go-to-market: sales, marketing, customer acquisition
**The hook (a 60-second live demo):** paste a real job → a branded quote pops out → "now your client pays the deposit from this WhatsApp." Show, don't tell.

**Channels (founder-led, in priority order):**
1. **Local, in-person / WhatsApp:** plumbing & electrical WhatsApp/Facebook groups; hardware/plumbing wholesalers (leave a flyer, partner) — trades already gather there.
2. **Direct outreach:** DM/call plumbers & electricians on Google Maps / local directories with the demo.
3. **Referrals:** every happy tradesperson knows five more; build a referral reward.
4. **Content:** short before/after videos ("quote in 60 seconds") on the platforms trades scroll.

**Concierge onboarding (the unlock):** for early users, **build their price book for them** (from a photo of a scribbled rate sheet). Removes the only real setup friction and turns a trial into a daily habit.

### 16.10 First 10 → first 100 customers
- **First 10 (days 1–45):** hand-pick reachable plumbers/electricians; concierge-onboard; success metric = *they send a real quote that wins a real job*. Convert on the founder deal.
- **First 100 (months 2–9):** double down on whichever channel converted; formalise referrals; add supplier/wholesaler partnerships; publish testimonials + demo clips; introduce the **payments** revenue line once volume flows.

### 16.11 Financial model (illustrative — all [Est.])
- **Costs per active user/mo:** Claude API + WhatsApp messaging + storage ≈ low tens of rand at MVP scale; near-zero fixed infra (serverless).
- **Blended ARPU target:** ~R400/mo (~$22) = Pro/Team mix + small payments take.
- **Unit economics:** CAC is mostly *time* early (founder-led) → very low cash CAC; if vertical embedding holds churn to ~3–4%/mo [Fact benchmark — LeadEdge], LTV comfortably exceeds cash CAC. Gross margin high (software + thin payments).
- **Path to $10M ARR (≈R185M/yr):** ~38,000 paying SMEs at ~R400/mo. SA alone: 2.67M SMEs [Fact — StatsSA] → needs ~1.4% penetration of paying SMEs; realistic only *with* geographic expansion for the full $10M, but **R1–3M ARR in-country within ~3 years is a credible base case** [Est.].
- **Milestones:** R50k MRR (~130 paying) → validates PMF; R500k MRR (~1,250 paying) → hire support/eng; then expand markets.

### 16.12 Risks & mitigations
| Risk | Mitigation |
|---|---|
| Yoco AI (Q3 2026) competes | Go vertical-deep fast; partner on payment rails; own voice-note→quote |
| Free invoicers cap WTP | Sell the *outcome* (win jobs, get paid faster), not invoices; AI quoting is the paywall |
| SME churn | Embed price-book + payments = switching cost; concierge onboarding drives activation |
| Solo distribution grind | One trade, one town first; referrals + wholesaler partners |
| AI mis-prices a job | Every line editable + confidence flags; never auto-send without a human tap |
| Payment/regulatory limits | Ride Yoco/Stitch rails (don't become a PSP prematurely) |

---

## 17. 90-Day Execution Plan

**Weeks 1–2 — Foundations & discovery.** Interview 10–15 plumbers/electricians (confirm the pain, pricing, objections). Set up Claude API, WhatsApp Business API sandbox, Yoco, Supabase. Ship the price-book data model + the core prompt returning valid JSON on 20 real job descriptions.

**Weeks 3–5 — Build the wedge.** New Quote (voice/text → editable quote), branded PDF, WhatsApp send, deposit invoice + Yoco pay-link, reminders. Dogfood end-to-end on real quotes.

**Weeks 6–7 — Concierge onboard first 5.** Build their price books for them; get each to send one real quote to a real client. Fix whatever blocks a first *sent* quote. Instrument activation (first quote sent within 48h).

**Weeks 8–10 — Convert & learn.** Move trials to paid on the founder deal; ship proof-of-payment matching; tighten the 60-second flow. Target: **first 3–5 paying customers**.

**Weeks 11–13 — Referral engine.** Ask every user for one referral; publish 2–3 demo/testimonial clips; approach one wholesaler. Target: **~10 paying customers** and a repeatable acquisition channel identified.

**North-star metric all quarter:** % of signups who **send a real quote to a real client within 48h**.

---

## 18. 3-Year Growth Plan

**Year 1 — Own one trade in one region.** Nail plumbing/electrical quote-to-cash. Add scheduling + team (Phase 2). Reach ~R50–150k MRR [Est.]. Turn on the payments revenue line. Build the referral + wholesaler-partner motion.

**Year 2 — Expand trades & deepen the OS.** Add adjacent trades (HVAC, builders, solar w/ compliance docs) by swapping price books. Ship **SARS-ready books/VAT** (annexes Research §12 bet #2) — the deepest moat and a Team-tier upsell. Grow to ~R500k–R1M MRR [Est.]. First 1–2 support/eng hires.

**Year 3 — Go regional, build the moat.** Expand to another WhatsApp+mobile-money market (rest of Africa; then evaluate LatAm/SEA where the pattern repeats). Layer network effects (client-facing quote/pay links seed new tradespeople) and switching costs (payments + price-book + books). Target trajectory toward the venture-scale ARR band, with the option — if the payments layer scales — to become the SME's primary money OS.

**Moat trajectory:** vertical price-book data (accuracy compounds) → embedded payments (retention) → compliance + books (lock-in) → multi-trade + multi-market (scale). Each layer is a reason a tradesperson never leaves.

---

*Build order reminder:* one trade, one killer loop (voice note → quote → paid), concierge onboarding, outcome-based pricing. Resist every other feature until paying customers ask for the same thing repeatedly.
