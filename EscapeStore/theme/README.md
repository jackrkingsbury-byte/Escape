# ESCAPE — Shopify theme

A custom, single-purpose Shopify theme built to sell the ESCAPE course (and the
ESCAPE + Grade Forge bundle). Dark, cinematic, conversion-first. Read
`../STORE_PLAN.md` for the strategy behind it.

## Install

1. Zip the **contents** of this `theme/` folder so the archive's top level
   contains `layout/`, `templates/`, `sections/`, `assets/`, `config/`, `locales/`.
   ```bash
   cd EscapeStore/theme && zip -r ../escape-theme.zip . -x '*.DS_Store'
   ```
2. Shopify Admin → **Online Store → Themes → Add theme → Upload zip file**.
3. **Customize** to edit copy, prices, and images — every section is editable.

## Connect your products (for instant checkout)

In **Pricing tiers** section settings, link each tier block to a Shopify product.
When linked, the price and a working buy button render automatically. Leave a
tier unlinked to use a plain link instead.

Create 3 digital products (uncheck "requires shipping"):
- **ESCAPE Starter** — R149
- **ESCAPE PRO** — R299 (mark the tier "most popular")
- **Inner Circle** — R599 (bundles Grade Forge)

Then add a unique-code delivery app (Sky Pilot / Single / Order Delivery) and
paste your access codes so each order auto-emails one. See `../STORE_PLAN.md §4`.

## Homepage sections (in order)

| Section file | Purpose |
|---|---|
| `hero.liquid` | Identity headline, dual CTA, scarcity badge, trust stats |
| `transformation.liquid` | "Two kinds of people" before/after contrast |
| `quiz.liquid` | "Which Escape Are You?" — recommends a tier (JSON-configurable) |
| `features.liquid` | What's-inside grid |
| `bonus-stack.liquid` | Value stack that totals above the price |
| `pricing.liquid` | 3 tiers, PRO anchored, product-linked buy buttons |
| `testimonials.liquid` | Social proof |
| `guarantee.liquid` | 7-day risk reversal |
| `faq.liquid` | Objection handling |
| `final-cta.liquid` | Closing pitch |

## Other files

- `layout/theme.liquid` — document shell, fonts, asset includes.
- `sections/site-header.liquid` + `header-group.json` — sticky nav.
- `sections/site-footer.liquid` + `footer-group.json` — footer.
- `sections/main-*.liquid` — product, collection, cart, page, search, blog,
  article, 404 templates.
- `assets/base.css` — full design system.
- `assets/theme.js` — reveal-on-scroll, mobile nav, FAQ accordion, the quiz
  engine, scarcity counter. No dependencies.
- `config/settings_schema.json` — theme-editor global settings.
- `locales/en.default.json` — UI strings.

## Editing the quiz

Open the **Quiz** section in the theme editor → "Quiz data (advanced)". Each
option's `weight` must be `starter`, `pro`, or `circle`; the highest total wins
and shows that tier's result card.

## Known limitation

Customer-account templates (`templates/customers/*`) are placeholders — the store
is built around guest checkout + access-code delivery, so logged-in accounts
aren't needed. If you enable customer accounts, replace these with full forms.
