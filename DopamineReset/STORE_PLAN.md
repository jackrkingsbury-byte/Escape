# Dopamine Reset — Shopify Store Plan

The strategy behind the impulse-buy store in `DopamineReset/theme/`.

---

## The product

**Dopamine Reset** — a 7-day, 10-min-a-day protocol that rewires a fried
reward system so real life feels good again. One painful problem (foggy,
flat, can't-stop-scrolling), one clear promise (feel good in 7 days), cheap,
instant. That's what makes it an *impulse* buy — unlike a "movement," people
type their card in for a specific result, fast.

**Audience:** 16–25, chronically online, secretly knows their attention and
mood are shot. Priced in ZAR (R).

---

## Why this beats a "movement"

| Movement (hard to sell) | Product (easy to sell) |
|---|---|
| "Build a life you don't need to escape from" | "Feel good again in 7 days" |
| Vague outcome, long commitment | One specific result, one week |
| Premium price, lots of thinking | R199, buy on impulse |
| Sell the identity | Sell the relief |

---

## The offer

| Option | Price | What |
|---|---|---|
| **The Reset** ⭐ *Launch price* | **R199** | Full 7-day protocol + fast guide + urge toolkit + real-dopamine menu + tracker |
| **Reset + Lifetime Toolkit** | **R299** | Everything + monthly top-up resets + advanced protocols + all future updates |

Keep it to **one hero CTA** ("Start the reset — R199") repeated down the page.
The R299 is just an anchor/upsell — most buyers take the R199.

The conversion levers (all built into the theme):
- **Scarcity** — "Only N resets left at the R199 launch price."
- **Bonus stack** — totals R774, you pay R199.
- **The 10-second test** — "How fried is your dopamine?" pulls people in, then
  every result pushes them to buy.
- **Guarantee** — 7-day money-back kills the risk.
- **Instant gratification** — auto-redirect into Day 1 the second they pay.

---

## Delivery: zero-click auto-redirect (no email)

Exactly what you asked for — Shopify settles the payment, then the buyer is
auto-redirected to your access page. No email step.

**Setup:**
1. Create the product(s) in Shopify Admin as **digital** (uncheck "requires
   shipping"). Link them in the theme's **Pricing** section so the buy button
   goes straight to checkout.
2. Build/host your **access page** (the actual Day-1 content) — a page on this
   store, or wherever you keep it. You said you'll link it yourself.
3. Open `order-status-redirect.html`, set `ACCESS_URL` to that page, and paste
   the whole snippet into **Settings → Checkout → Order status page →
   Additional scripts → Save.**

Now: pay → order-status page → auto-redirect into the reset. Zero clicks.

> Note: Shopify is gradually moving "Additional scripts" toward Checkout
> Extensions. If your plan has already switched, use a free "redirect after
> checkout" app (Releasit / ReConvert) and point it at the same `ACCESS_URL` —
> the effect is identical.

---

## Install the theme

```bash
cd DopamineReset/theme && zip -r ../dopamine-reset-theme.zip . -x '*.DS_Store'
```
Shopify Admin → **Online Store → Themes → Add theme → Upload zip file** →
**Customize** to tweak copy/prices. See `theme/README.md` for the file map.
