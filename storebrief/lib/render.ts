import type { BriefData, Suggestion } from "./types";

/**
 * Deterministic plain-English renderer. This is the no-AI fallback (the app
 * works with zero API keys) and the reference wording the AI may improve on.
 */

export function money(data: BriefData, n: number): string {
  return `${data.currency}${n.toLocaleString("en-ZA", { maximumFractionDigits: 2 })}`;
}

function changePhrase(pct: number | null): string {
  if (pct === null) return "up from nothing last period";
  if (pct === 0) return "flat vs last period";
  return pct > 0 ? `up ${pct}% on last period` : `down ${Math.abs(pct)}% on last period`;
}

/** "2 more orders added R500; bigger baskets added R100." — or null when there's nothing to explain. */
export function whyText(data: BriefData): string | null {
  const d = data.revenueChangeDrivers;
  if (!d || (d.ordersEffect === 0 && d.aovEffect === 0)) return null;
  const parts: string[] = [];
  const orderDelta = Math.abs(data.orderCount - data.previousOrderCount);
  if (d.ordersEffect !== 0) {
    parts.push(
      `${orderDelta} ${d.ordersEffect > 0 ? "more" : "fewer"} order${orderDelta === 1 ? "" : "s"} ${
        d.ordersEffect > 0 ? "added" : "cost you"
      } ${money(data, Math.abs(d.ordersEffect))}`,
    );
  }
  if (d.aovEffect !== 0) {
    parts.push(
      `${d.aovEffect > 0 ? "bigger" : "smaller"} baskets ${
        d.aovEffect > 0 ? "added" : "cost you"
      } ${money(data, Math.abs(d.aovEffect))}`,
    );
  }
  return parts.join("; ") + ".";
}

export function suggestionText(s: Suggestion): string {
  switch (s.code) {
    case "no_sales_share_store":
      return "No sales this period — share your store link somewhere new this week (a WhatsApp status or a post) to get eyes on it.";
    case "restock_winner":
      return `"${s.productTitle}" is selling fast — restock now, you have about ${s.count} day${s.count === 1 ? "" : "s"} of stock left at this pace.`;
    case "investigate_slump":
      return `"${s.productTitle}" slowed right down — check its stock, price, and photos, or run a small promo to revive it.`;
    case "win_back_customers":
      return `${s.count} people have bought from you before but none came back this week — message them (a simple "new stock just landed" works wonders).`;
    case "celebrate_best_week":
      return `Best week of the month! Do more of exactly what you did: keep "${s.productTitle}" in stock and repeat this week's posts.`;
    case "push_top_product_on_best_day":
      return `"${s.productTitle}" is your winner and ${s.bestDay} is your best day — schedule a post or promo for it this ${s.bestDay}.`;
    case "push_top_product":
      return `"${s.productTitle}" is your winner — give it more visibility this week (feature it on your homepage or socials).`;
    case "keep_momentum":
      return "Steady week — keep doing what you're doing, and consider testing one new product photo or headline.";
  }
}

export function renderBriefText(data: BriefData): string {
  const lines: string[] = [];
  lines.push(`Hi ${data.shopName} 👋 Here's your last ${data.windowDays} days (${data.periodLabel}):`);
  lines.push("");
  lines.push(
    `💰 Sales: ${money(data, data.revenue)} from ${data.orderCount} order${
      data.orderCount === 1 ? "" : "s"
    } — ${changePhrase(data.revenueChangePercent)}.`,
  );
  lines.push(
    `🧾 Average order: ${money(data, data.averageOrderValue)} (${changePhrase(data.aovChangePercent)}).`,
  );

  const why = whyText(data);
  if (why) {
    lines.push(`💡 Why: ${why}`);
  }
  const top = data.topProducts[0];
  if (top) {
    lines.push(
      `⭐ Top seller: "${top.title}" — ${top.quantity} sold for ${money(data, top.revenue)}.`,
    );
  }
  const risk = data.stockRisks[0];
  if (risk) {
    lines.push(
      `📦 Stock alert: "${risk.title}" has ${risk.unitsLeft} left — about ${risk.daysLeft} day${
        risk.daysLeft === 1 ? "" : "s"
      } at this pace.`,
    );
  }
  const slump = data.slumpingProducts[0];
  if (slump) {
    lines.push(
      `⚠️ Cooling off: "${slump.title}" dropped ${slump.dropPercent}% (from ${money(
        data,
        slump.previousRevenue,
      )} to ${money(data, slump.revenue)}).`,
    );
  }
  if (data.bestDay) {
    lines.push(`📅 Best day: ${data.bestDay} (${money(data, data.bestDayRevenue)}).`);
  }
  if (data.bestHours) {
    lines.push(`⏰ Busiest time: ${data.bestHours}.`);
  }
  if (data.isBestWeek) {
    lines.push(`🏆 Your best week of the last 4.`);
  }
  const streak = data.trendStreak;
  if (streak.weeks >= 2) {
    lines.push(
      streak.direction === "up"
        ? `📈 Momentum: revenue up ${streak.weeks} weeks in a row.`
        : `📉 Heads-up: revenue down ${streak.weeks} weeks in a row.`,
    );
  }
  if (data.identifiedOrderCount !== null && data.returningOrderCount !== null) {
    lines.push(
      `🔁 Repeat customers: ${data.returningOrderCount} of ${data.identifiedOrderCount} orders.`,
    );
  }
  lines.push("");
  lines.push(`👉 This week: ${suggestionText(data.suggestion)}`);
  return lines.join("\n");
}

/**
 * WhatsApp-formatted variant: same facts, *bold* markers, tighter lines.
 * Shopify will never send a merchant their numbers on WhatsApp — we will.
 */
export function renderWhatsAppText(data: BriefData): string {
  const lines: string[] = [];
  lines.push(`*${data.shopName}* — week of ${data.periodLabel} 📊`);
  lines.push("");
  lines.push(
    `💰 *${money(data, data.revenue)}* from ${data.orderCount} order${
      data.orderCount === 1 ? "" : "s"
    } (${changePhrase(data.revenueChangePercent)})`,
  );
  const why = whyText(data);
  if (why) lines.push(`💡 ${why}`);
  const top = data.topProducts[0];
  if (top) lines.push(`⭐ Top: *${top.title}* — ${top.quantity} sold`);
  const risk = data.stockRisks[0];
  if (risk) lines.push(`📦 *Restock ${risk.title}* — ${risk.unitsLeft} left, ~${risk.daysLeft}d`);
  if (data.trendStreak.weeks >= 2) {
    lines.push(
      data.trendStreak.direction === "up"
        ? `📈 Up *${data.trendStreak.weeks} weeks* in a row`
        : `📉 Down ${data.trendStreak.weeks} weeks in a row`,
    );
  }
  lines.push("");
  lines.push(`👉 ${suggestionText(data.suggestion)}`);
  return lines.join("\n");
}
