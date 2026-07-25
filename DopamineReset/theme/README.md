# Dopamine Reset — Shopify theme

A custom, single-product Shopify theme built to impulse-sell the **Dopamine
Reset** (7-day program to quit cheap dopamine and feel good again). Dark, warm,
energetic, conversion-first. Read `../STORE_PLAN.md` for the strategy and the
zero-click redirect setup.

## Install

1. Zip the **contents** of this `theme/` folder (top level must contain
   `layout/`, `templates/`, `sections/`, `assets/`, `config/`, `locales/`):
   ```bash
   cd DopamineReset/theme && zip -r ../dopamine-reset-theme.zip . -x '*.DS_Store'
   ```
2. Shopify Admin → **Online Store → Themes → Add theme → Upload zip file**.
3. **Customize** to edit copy, prices, and images — every section is editable.

## Connect your product (for instant checkout + auto-redirect)

In the **Pricing** section settings, link each option block to a Shopify product.
Once linked, the real price and a working checkout button render automatically.
Then set up the zero-click redirect from `../order-status-redirect.html`
(see `../STORE_PLAN.md`).

Create the products as **digital** (uncheck "requires shipping"):
- **The Reset** — R99 (keep it marked "Launch price")
- **Reset + Lifetime Toolkit** — R149

## Homepage sections (in order)

| Section | Purpose |
|---|---|
| hero.liquid | "Quit cheap dopamine. Feel good in 7 days." + price CTA + scarcity |
| transformation.liquid | Cheap dopamine vs real dopamine |
| quiz.liquid | "How fried is your dopamine?" 10-second test, pushes to buy |
| features.liquid | What's inside the 7-day reset |
| bonus-stack.liquid | Value stack (R774 to R99) |
| pricing.liquid | The Reset (R99) + Lifetime Toolkit (R149) |
| testimonials.liquid | Social proof |
| guarantee.liquid | 7-day money-back |
| faq.liquid | Objection handling |
| final-cta.liquid | Closing pitch |

## Other files

- layout/theme.liquid — shell, fonts, asset includes.
- sections/site-header.liquid / site-footer.liquid (+ their *-group.json).
- sections/main-*.liquid — product, collection, cart, page, search, blog, article, 404.
- assets/base.css — design system (warm "dopamine" palette).
- assets/theme.js — reveal-on-scroll, mobile nav, FAQ, quiz engine, scarcity.
- config/ — theme-editor settings. locales/en.default.json — UI strings.

## Editing the quiz

**Quiz** section → "Quiz data (advanced)". Each option's `weight` must be
`starter`, `pro`, or `circle`; highest total wins and shows that result card.

## Note

Customer-account templates are placeholders — the store runs on guest checkout
+ auto-redirect, so accounts aren't needed.
