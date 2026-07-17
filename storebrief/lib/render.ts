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

export function suggestionText(s: Suggestion): string {
  switch (s.code) {
    case "no_sales_share_store":
      return "No sales this period — share your store link somewhere new this week (a WhatsApp status or a post) to get eyes on it.";
    case "investigate_slump":
      return `"${s.productTitle}" slowed right down — check its stock, price, and photos, or run a small promo to revive it.`;
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

  const top = data.topProducts[0];
  if (top) {
    lines.push(
      `⭐ Top seller: "${top.title}" — ${top.quantity} sold for ${money(data, top.revenue)}.`,
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
  lines.push("");
  lines.push(`👉 This week: ${suggestionText(data.suggestion)}`);
  return lines.join("\n");
}
