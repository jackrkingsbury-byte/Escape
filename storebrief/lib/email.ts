import type { BriefData } from "./types";
import { money, suggestionText } from "./render";

/**
 * Weekly brief as a self-contained HTML email. Inline styles only, no external
 * assets — renders in every mail client. All merchant-provided strings are
 * escaped; a product titled "<script>" must never become markup in an inbox.
 */

export function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function changeChip(pct: number | null): string {
  if (pct === null) return `<span style="color:#6b7280;">new baseline</span>`;
  if (pct === 0) return `<span style="color:#6b7280;">flat</span>`;
  const up = pct > 0;
  const color = up ? "#16a34a" : "#dc2626";
  const arrow = up ? "&#9650;" : "&#9660;";
  return `<span style="color:${color};font-weight:bold;">${arrow} ${Math.abs(pct)}%</span>`;
}

function statRow(label: string, value: string, chip: string): string {
  return `<tr>
    <td style="padding:10px 0;color:#6b7280;font-size:14px;">${label}</td>
    <td style="padding:10px 0;text-align:right;font-size:16px;color:#111827;font-weight:bold;">${value}&nbsp;&nbsp;${chip}</td>
  </tr>`;
}

export function renderBriefEmailHtml(data: BriefData): string {
  const top = data.topProducts[0];
  const slump = data.slumpingProducts[0];

  const rows: string[] = [
    statRow("Sales", money(data, data.revenue), changeChip(data.revenueChangePercent)),
    statRow("Orders", String(data.orderCount), ""),
    statRow("Average order", money(data, data.averageOrderValue), changeChip(data.aovChangePercent)),
  ];
  if (top) {
    rows.push(
      statRow("Top seller", `${escapeHtml(top.title)} (${top.quantity} sold)`, ""),
    );
  }
  if (data.bestDay) {
    rows.push(statRow("Best day", escapeHtml(data.bestDay), ""));
  }

  const slumpBlock = slump
    ? `<div style="margin-top:18px;padding:14px 16px;background:#fef2f2;border-radius:8px;font-size:14px;color:#991b1b;">
        &#9888;&#65039; <b>${escapeHtml(slump.title)}</b> cooled off — down ${slump.dropPercent}%
        (from ${money(data, slump.previousRevenue)} to ${money(data, slump.revenue)}).
      </div>`
    : "";

  return `<div style="margin:0;padding:24px;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;">
    <div style="background:#0a0a0c;padding:22px 28px;">
      <span style="color:#4ade80;font-weight:bold;font-size:18px;">StoreBrief</span>
      <span style="color:#9ca3af;font-size:13px;float:right;padding-top:4px;">${escapeHtml(data.periodLabel)}</span>
    </div>
    <div style="padding:26px 28px;">
      <p style="margin:0 0 6px;font-size:20px;color:#111827;"><b>Hi ${escapeHtml(data.shopName)} &#128075;</b></p>
      <p style="margin:0 0 18px;font-size:14px;color:#6b7280;">Your last ${data.windowDays} days, in plain English.</p>
      <table style="width:100%;border-collapse:collapse;border-top:1px solid #e5e7eb;">${rows.join("")}</table>
      ${slumpBlock}
      <div style="margin-top:18px;padding:16px 18px;background:#f0fdf4;border-radius:8px;">
        <div style="font-size:12px;font-weight:bold;letter-spacing:1px;color:#16a34a;margin-bottom:6px;">&#128073; THIS WEEK</div>
        <div style="font-size:15px;color:#14532d;line-height:1.5;">${escapeHtml(suggestionText(data.suggestion))}</div>
      </div>
    </div>
    <div style="padding:16px 28px;background:#f9fafb;font-size:12px;color:#9ca3af;">
      Every number above is computed from your store's orders — never guessed.
    </div>
  </div>
</div>`;
}
