# QuoteFlow AI — Product Blueprint

*The exact software to build first, and how to get the first 10 paying customers in 90 days.*

---

## 1. Executive summary

**One line:** A trade pro types a plain-English job — *"Install 2 geysers and replace 15m of copper pipe"* — and QuoteFlow AI produces a professional, branded quote (materials + labour + total), a PDF, and a ready-to-send email/WhatsApp message. In under 60 seconds.

**Who it's for:** Small trade businesses (1–8 people) — starting with **plumbers and HVAC/geyser installers** — who currently quote by hand on WhatsApp, spreadsheets, or paper.

**Why it wins:**
- They already pay for software, so there's budget.
- Quoting is slow, inconsistent, and the #1 reason they lose jobs (slow replies lose the customer).
- It saves ~2 hours a day and helps them *win more work* — the two things that actually open wallets.
- It's one obvious job done brilliantly, not a confusing "everything app."

**The 90-day goal:** Not the biggest product — the one with the clearest path to real customers. **10 paying trade businesses by day 90.**

**What we are deliberately NOT building first:** CRM, full invoicing, scheduling, client portal, "AI assistant." Those come *after* QuoteFlow is loved. (See §8 and §11.)

---

## 2. The customer

### Beachhead: pick ONE trade to start
Start with **plumbers and geyser/HVAC installers**. Reasons: high volume of small-to-mid jobs, repeatable materials (pipe, fittings, geysers, valves), and a strong "reply fast or lose the job" dynamic. Once QuoteFlow works for them, the same engine extends to electricians and roofers with a different price book.

### The persona: "Sipho, the owner-operator"
- Runs a 1–4 person plumbing business.
- Gets 5–15 job enquiries a week via WhatsApp and phone.
- Quotes in the evening after a full day on the tools — or forgets, and loses the job.
- His quotes look inconsistent (a number in a WhatsApp text vs. a rough note). Professional-looking quotes win more jobs and justify higher prices.
- No developer, no ops person. If a tool isn't dead simple, he won't use it.

### The pain, precisely
1. **Slow:** quoting eats evenings and weekends; slow replies = lost jobs.
2. **Inconsistent:** prices vary by mood/memory; margins leak.
3. **Unprofessional:** a WhatsApp number doesn't build trust or justify premium pricing.
4. **No follow-up:** he doesn't know which quotes were opened, accepted, or ghosted.

QuoteFlow attacks #1–#3 directly on day one, and #4 with quote status tracking.

---

## 3. The killer workflow (this must feel like magic)

The entire product succeeds or fails on this one loop. Everything else is supporting cast.

1. **Input** — Sipho taps **New Quote** and types, pastes (from WhatsApp), or *speaks* the job:
   > "Install 2 geysers, 150L each, and replace about 15m of 22mm copper pipe. Customer: Jane Dlamini, Sandton."
2. **Parse** — QuoteFlow reads it and builds structured **line items** using *his own price book*:
   - 2 × 150L geyser (materials)
   - ~15m × 22mm copper pipe + fittings (materials)
   - Labour: geyser install ×2, pipe replacement (hours × his rate)
3. **Review & tweak** — Every line is editable. Quantities, prices, and labour hours are adjustable inline. Low-confidence items are flagged for a quick check. Live total updates as he edits. VAT applied per his settings.
4. **Brand & preview** — One tap generates a clean, branded PDF with his logo, business details, terms, and quote number.
5. **Send** — A pre-written, professional email/WhatsApp message is ready: *"Hi Jane, thanks for the opportunity — please find your quote attached…"* He sends, or copies a share link.
6. **Track** — The quote shows as **Sent**, then **Viewed**, then **Accepted / Declined**.

**Target: under 60 seconds from typing the job to a send-ready quote.** That's the whole pitch: *"Quote any job in 60 seconds."*

---

## 4. Every page / screen (MVP)

Build these eight, in this order. Nothing else in the MVP.

### 4.1 Onboarding & business profile
First-run wizard, ~2 minutes:
- Business name, logo upload, contact details, service area.
- Default **labour rate(s)** (e.g. standard hourly, call-out fee).
- **VAT** on/off + rate; currency.
- Payment terms & quote validity (e.g. "valid 30 days," "50% deposit").
- Optional: import/paste a rough price list (or skip — we build it *with* them; see §9 concierge onboarding).
- **Outcome:** enough to produce a correct, branded quote immediately.

### 4.2 Home / dashboard
- Big primary button: **+ New Quote**.
- Recent quotes list with status pills: **Draft / Sent / Viewed / Accepted / Declined**.
- Simple top-line stats: quotes this week, value sent, acceptance rate.
- Nothing more — this screen exists to get him into New Quote fast.

### 4.3 New Quote *(the core — spend 60% of build effort here)*
- **Free-text input box** front and centre. Supports type, paste, and voice-to-text.
- Customer fields (name, contact, address) — auto-filled from the text where possible.
- **AI-parsed line items** appear as an editable table:
  | Item | Type | Qty | Unit price | Line total |
  - Inline editing of every field; add/delete/reorder rows.
  - Separate **Materials** and **Labour** sections.
  - **Confidence flags** on uncertain items (e.g. "assumed 22mm — check") the user can confirm/clear.
- **Live totals**: subtotal, VAT, grand total, deposit (if set).
- Buttons: **Save draft**, **Preview**, **Send**.

### 4.4 Quote preview / branded PDF
- Faithful render of the final quote: logo, business + customer details, line items, totals, terms, quote number & date, validity.
- **Download PDF** and **Copy share link**.
- One-tap back to edit.

### 4.5 Send
- Pre-written, editable **email draft** with the PDF attached.
- **WhatsApp / share link** option (a hosted quote the customer opens on their phone; viewing flips status to *Viewed*).
- After sending, quote moves to **Sent**.

### 4.6 Quotes list & detail
- Filter by status; search by customer.
- Detail view: full quote, timeline (created → sent → viewed → accepted/declined), **Duplicate** (huge time-saver for repeat jobs), **Mark accepted/declined**.

### 4.7 Materials & rates catalog — the **price book** (the moat)
- Editable list of his common materials with prices, and his labour rates/tasks (e.g. "geyser install = 3h").
- Grows automatically: items created during quoting can be saved back to the catalog.
- **Why it's the moat:** the more he uses QuoteFlow, the more his pricing lives here. That's real switching cost and it makes every future quote faster and more accurate. This is what turns a nice demo into a sticky product.

### 4.8 Settings / account / billing
- Edit business profile, rates, VAT, terms, logo.
- Subscription & billing (plan, card, invoices).
- Team seats (Team plan).

---

## 5. Every feature — in-scope vs. explicitly out

Keeping this table honest is how we avoid the "everything app" trap.

| Feature | MVP? | Notes |
|---|---|---|
| Free-text → structured quote (AI) | ✅ In | The core. |
| Voice input (speak the job) | ✅ In | Big "wow" on site; cheap to add via device dictation. |
| Editable line items + live totals | ✅ In | Trust comes from easy editing. |
| Personal **price book** / rates catalog | ✅ In | The moat & accuracy engine. |
| Branded PDF | ✅ In | Table-stakes for "professional." |
| Email draft + WhatsApp/share link | ✅ In | Meets trades where they already are. |
| Quote status tracking (sent/viewed/accepted) | ✅ In | Cheap, drives follow-up & retention. |
| Duplicate quote | ✅ In | Repeat jobs = daily value. |
| VAT / deposit / terms | ✅ In | Correctness, not optional for real quotes. |
| Full invoicing + payments | ⏳ Phase 2 | Fast-follow (§8). |
| Job scheduling / calendar | ⏳ Phase 2 | Fast-follow (§8). |
| CRM (contacts, pipeline) | ❌ Out (for now) | A "customers" list emerges naturally later. |
| Client portal | ❌ Out | The share link is enough at first. |
| "AI assistant" chat | ❌ Out | Vague; no clear job-to-be-done yet. |
| Accounting integrations | ❌ Out | Only after paying customers ask. |
| Multi-trade templates | ❌ Out at launch | Add electricians/roofers once plumbing works. |

**Rule of thumb:** if a feature doesn't make a quote faster, more accurate, or more likely to be accepted, it's not in the MVP.

---

## 6. How the AI works (in plain English)

You don't need to invent anything exotic. The engine is:

1. **Read the job text** and extract the *intent*: what's being installed/repaired, quantities, sizes, materials, and customer details.
2. **Match to the user's price book first.** If "150L geyser" exists in his catalog, use *his* price and *his* labour time. This is what makes quotes trustworthy — they're built from his real numbers, not a guess.
3. **Fall back to sensible defaults** when something isn't in his catalog, and **flag it** ("assumed standard 22mm copper — please confirm"). The user confirms or corrects, and it's remembered.
4. **Assemble** materials + labour + VAT + terms into the structured quote.
5. **Learn quietly:** confirmed items and corrected prices flow back into the price book, so accuracy compounds with use.

**Design principles that keep it defensible:**
- **Never silently invent a price** — show the number and let the user see/edit it.
- **Confidence flags over false precision** — it's fine to say "check this."
- **His data, his prices** — the AI's job is speed and structure; the *numbers* belong to the tradesperson. This is exactly why it's trustworthy where a generic AI chatbot is not.

Practically: a single strong LLM call (Claude) with his price book and business profile as context, returning structured line items, gets you most of the way. No custom ML, no training needed to start.

---

## 7. Pricing

Anchor to value: *"QuoteFlow saves you ~2 hours a day and helps you win more jobs."* Against that, a monthly subscription is trivial. Price on the outcome, not on "it's AI."

| Plan | Price (guide) | For | Includes |
|---|---|---|---|
| **Solo** | ~$29–39 / R499 per month | Owner-operators (1 user) | Unlimited quotes, price book, branded PDF, send + tracking |
| **Team** | ~$79–99 / R1,299 per month | Small firms (up to ~5 seats) | Everything in Solo + multiple users, shared price book, team stats |

Guidance:
- **14-day free trial**, no card up front (reduce friction for a busy tradesperson). Or a "your first 3 quotes free."
- **Founder / early-adopter deal** for the first 10 customers: discounted or locked-in lifetime rate in exchange for feedback and a testimonial (see §9).
- **Monthly, cancel anytime** — trades distrust lock-in contracts.
- Position *below* the pain: if inconsistent quoting loses even one $500 job a month, the tool pays for itself many times over. Say that plainly.
- Add invoicing/payments (Phase 2) as a reason to move up a tier later, not as a day-one paywall.

---

## 8. Phase 2 add-ons (near-term fast-follows)

Only start these once QuoteFlow's core loop is loved (see triggers in §11). They reuse everything already built.

### 8.1 Invoicing
- One tap: **Accepted quote → Invoice** (same line items, no re-entry).
- Add a **payment link** (e.g. Yoco/Stripe) so customers pay from their phone.
- Mark paid / partially paid; deposit invoices.
- *Why it's natural:* the quote already contains everything an invoice needs. This is the single most-requested fast-follow for trades and a clean reason to upgrade tiers.

### 8.2 Simple job scheduling
- Accepted quote → **scheduled job** on a lightweight calendar.
- Job statuses: Scheduled → In progress → Done.
- *Deliberately simple* — a calendar and statuses, not a full field-service platform.

Everything beyond these two waits for real, repeated customer demand.

---

## 9. 90-day plan to first 10 paying customers

The product to build is the one with the clearest path to real customers — so treat GTM as part of the build.

### The hook
**"I'll quote your next job in 60 seconds — watch."** A live demo where you paste a real job and a branded PDF pops out is the entire sell. Lead with the demo, not a feature list.

### Where to find them
- **Local trade WhatsApp/Facebook groups** (plumbing, HVAC) — where trades already hang out and complain about admin.
- **Merchants/suppliers** (plumbing wholesalers) — partner or leave flyers; their customers are your customers.
- **Direct outreach** to plumbers on Google Maps / local directories — DM or call with the 60-second demo.
- **Referrals** — every early user knows five other tradespeople.

### Concierge onboarding (the secret weapon)
For the first 10, **build their price book for them**. Get their rough rate list (even a photo of a scribbled page), enter it, and hand them a tool that already knows their prices. This removes the only real setup friction and turns a trial into a habit fast.

### Motion (founder-led, unscalable on purpose)
- Do things that don't scale: personal demos, WhatsApp support, ask what's missing.
- Offer the **founder deal** (§7) in exchange for weekly feedback + a testimonial.
- Watch the activation metric religiously: did they **send a real quote to a real customer**? That's the moment they're hooked.

### Weekly cadence (illustrative)
| Weeks | Focus | Target |
|---|---|---|
| 1–3 | Ship the core loop (New Quote → PDF → Send). Line up 15–20 warm leads. | MVP demoable |
| 4–6 | Concierge-onboard 3–5 trials. Fix whatever blocks a first sent quote. | 3–5 active trials |
| 7–9 | Convert trials to paid with the founder deal. Start referrals. | First 3–5 paying |
| 10–13 | Double down on the channel that worked. Referrals + supplier intros. | **10 paying** |

---

## 10. Success metrics

Watch these, in priority order:

1. **Activation:** % of signups who **send a real quote to a real customer** within 48h. (The single most important number.)
2. **Time-to-quote:** median seconds from New Quote to Send. Target: **< 60s**.
3. **Quote → accept rate:** are QuoteFlow quotes winning work? Rising = product is *making them money*.
4. **Week-4 retention:** are they still quoting through it a month in?
5. **The milestone:** **10 paying businesses by day 90.**

If activation is healthy but retention isn't, the problem is habit/value depth (→ price book, duplicate, tracking). If activation is weak, the core loop or onboarding is too hard — fix that before anything else.

---

## 11. Risks & the "don't build the everything app" guardrail

**The main risk is you.** The temptation to add CRM, scheduling, an AI assistant, and a client portal *before QuoteFlow is loved* is what kills this. Too many features → nobody understands it → too long to build → no customers.

**Guardrails:**
- **Say no by default.** Every feature request gets logged, not built. Build it only when *multiple paying* customers ask for the *same* thing.
- **The MVP is done when the core loop is delightful**, not when it's feature-complete.
- **One sentence must always be true:** a tradesperson sees it and instantly thinks *"this saves me two hours a day."* If a new feature muddies that sentence, don't ship it.

**Triggers to start Phase 2 (§8):**
- ✅ 10 paying customers, and
- ✅ Week-4 retention holding, and
- ✅ Repeated, unprompted requests for invoicing/scheduling from paying users.

Until all three are true, the answer is: **make the quote loop even better.**

---

### TL;DR
Build **QuoteFlow AI**: type a job → get a branded, accurate quote in 60 seconds → send and track it. Charge a simple monthly subscription anchored to "saves 2 hours a day." Get the first 10 plumbers by demoing the 60-second quote and building their price book for them. Resist every other feature until they beg for it.
