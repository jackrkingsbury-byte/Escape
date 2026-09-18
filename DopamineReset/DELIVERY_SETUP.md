# How buyers get access after paying (Dopamine Reset)

There is **no access code**. Delivery = the buyer reaches `/pages/start` (the member
dashboard) after payment. Set up BOTH methods below so nobody ever gets lost.

Access URL: **https://escape-10081.myshopify.com/pages/start**

---

## ✅ Method 1 — Order-confirmation email button (DO THIS — works on every store)

Shopify always emails an order confirmation. Add an "Open your reset" button to it.

1. Shopify admin → **Settings → Notifications → Customer notifications → Order confirmation → Edit code**
2. Near the top of the email body, paste:

```html
<table role="presentation" width="100%" style="margin:18px 0"><tr><td align="center">
  <a href="https://escape-10081.myshopify.com/pages/start"
     style="background:#ff8a3d;color:#2a1400;font-weight:bold;padding:15px 32px;border-radius:999px;text-decoration:none;display:inline-block;font-family:Arial,sans-serif">
     ▶ Open your Dopamine Reset
  </a>
</td></tr></table>
```

3. **Save.** Done — every buyer now has a tappable access button on any device.

---

## ⚡ Method 2 — Zero-click redirect (instant, only if your checkout supports it)

1. Shopify admin → **Settings → Checkout**
2. Look for **"Order status page" → Additional scripts**.
   - If present: paste the contents of `order-status-redirect.html`, then **Save**.
   - If you DON'T see "Additional scripts": that's normal on newer checkouts — skip this, Method 1 covers you.

---

## Notes / honesty
- `/pages/start` is a **public page** — anyone with the link can open it. Fine for a cheap
  impulse product; not "locked." Ask if you want a simple access gate later.
- Progress saves **per-device** (browser localStorage). The email button lets buyers return
  on any device — that's why Method 1 matters most.
- **Test it:** do one real purchase and confirm you (a) get the email with the button and
  (b) land on the dashboard.
