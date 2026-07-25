# ESCAPE — Shopify Store Plan

The strategy and structure behind the custom theme in `EscapeStore/theme/`.
Read this first, then upload the theme.

---

## 1. Who actually buys ESCAPE

ESCAPE is not a course — it's an **identity purchase**. The buyer is a
**16–25 year old who feels stuck**, scrolls too much, compares themselves to
everyone, and secretly believes they're capable of more. They are not buying
"37 lessons + a habit tracker." They're buying **who they'll be in 90 days**.

The store's entire job is to sell three things:

1. **Transformation** — the after-version of themselves.
2. **Status** — being the kind of person who escaped.
3. **Momentum** — a win *today*, not someday.

Pricing is in **ZAR (R)** — South-Africa-first, matching the existing Yoco flow.

---

## 2. The psychology levers (the "dopamine" the store is built on)

| Lever | How the theme uses it |
|-------|----------------------|
| **Identity over features** | Headlines sell *"Become someone who escapes,"* not feature lists. |
| **Tiered anchoring** | 3 plans. The middle (PRO) is badged *Most Popular* and visually largest. ~70% should land here. |
| **Stacked bonuses** | A "stack it up, then look at the price" section that totals the value far above the price. Highest-leverage conversion block on the page. |
| **Instant gratification** | "Your first win unlocks the second you join." Dopamine = immediate payoff. |
| **Real scarcity** | You hand out finite access codes — "X spots left this cohort" is literally true. |
| **Risk reversal** | "7 days. Hate it? Full refund." Kills the last objection. |
| **Social proof / streaks** | Member counts, streaks, certificates, testimonials. Momentum is contagious. |
| **The quiz** | "Which Escape Are You?" — a game, not a sales page. Ends by recommending a plan. Converts cold traffic. |

---

## 3. Product & tier structure

Create these as **3 products** (or 1 product with 3 variants) in Shopify Admin.
The theme's pricing section maps to these.

### Tier 1 — ESCAPE Starter · **R149**
Entry point, low friction.
- The full ESCAPE core course (all modules + daily dares)
- Habit tracker + notebook
- Certificate of completion

### Tier 2 — ESCAPE PRO ⭐ *Most Popular* · **R299** (anchor here)
Where most buyers should land.
- Everything in Starter
- The 5 Bonus Kits
- Weekly Review system + My Stats
- "Letter to Future You" + "10 things you actually want"
- Priority email support

### Tier 3 — INNER CIRCLE (Lifetime) · **R599**
Premium, status, biggest bonus stack.
- Everything in PRO
- **Grade Forge bundled in** (your study/grades product) — the differentiator
- Lifetime access + every future drop
- Founding-member badge on certificate

> **The bundle play:** ESCAPE (life) + Grade Forge (grades) sold together as
> *"Level up your whole life"* is your unique offer — nobody else sells the combo.

---

## 4. How buyers get access (delivery) — recommended setup

**Keep your proven unlock flow. Don't rebuild the course inside Shopify.**

```
Buyer pays on Shopify  →  Shopify auto-emails a unique ESCAPE access code
                       →  Buyer enters it on your existing Netlify site to unlock
```

Why: Shopify handles payments, receipts, tax, and abandoned-cart recovery; your
existing access-code unlock (already built and converting) stays untouched.

**To wire it up:**
1. Make each tier a **digital product** (uncheck "requires shipping").
2. Install a unique-code delivery app — **Sky Pilot**, **Single**, or
   **Order Delivery** (any app that assigns *one unique code per order*).
3. Paste your codes from `access-codes.txt` into the app's code pool.
4. Set the post-purchase email to deliver the code + a link to the ESCAPE site.

Result: fully automated. A sale at 3am still delivers instantly.

---

## 5. Page structure (matches the theme sections)

1. **Hero** — identity headline + "Take the 60-second quiz" + "See plans"
2. **Two kinds of people** — the transformation contrast
3. **Quiz** — "Which Escape Are You?" → recommends a tier
4. **What you get** — feature grid
5. **Bonus stack** — value totals far above price
6. **Pricing** — the 3 tiers, PRO anchored
7. **Testimonials / social proof**
8. **Guarantee** — risk reversal
9. **FAQ**
10. **Final CTA**

---

## 6. How to install the theme

1. Zip the contents of `EscapeStore/theme/` (the folder must contain
   `layout/`, `templates/`, `sections/`, etc. at the top level of the zip).
2. Shopify Admin → **Online Store → Themes → Add theme → Upload zip file**.
3. Click **Customize** to edit copy, prices, and images per section — every
   section is configurable in the theme editor.
4. Create the 3 products above and link them in the Pricing section settings.

See `theme/README.md` for the file-by-file breakdown.
