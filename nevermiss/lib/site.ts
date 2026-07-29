/**
 * Central site configuration.
 * Contact details are read from public env vars so we can point the CTA at a
 * real WhatsApp number / email without touching component code.
 */

const rawWa = process.env.NEXT_PUBLIC_WA_NUMBER ?? "27000000000";
// Normalise to digits only for wa.me links (no +, spaces, or dashes).
const waNumber = rawWa.replace(/[^\d]/g, "");

export const site = {
  name: "NeverMiss",
  tagline: "The AI front desk that never misses a lead.",
  description:
    "NeverMiss replies to every WhatsApp enquiry in seconds — day or night — qualifies it, quotes a ballpark, and books the job. Stop losing work to whoever answers first.",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "hello@nevermiss.app",
  waNumber,
  demoMessage: "Hi, I run a service business and want to see NeverMiss capture a lead.",
} as const;

/** Click-to-chat WhatsApp link with a prefilled message. */
export function whatsappLink(message: string = site.demoMessage): string {
  return `https://wa.me/${site.waNumber}?text=${encodeURIComponent(message)}`;
}

export function mailtoLink(subject = "NeverMiss demo"): string {
  return `mailto:${site.email}?subject=${encodeURIComponent(subject)}`;
}

/**
 * Absolute origin for links that leave the page — share URLs and OG image tags
 * must be absolute or WhatsApp, X and iMessage won't render the preview.
 * Set NEXT_PUBLIC_SITE_URL in production; Vercel's own URL is the fallback.
 */
export function siteOrigin(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");
  const vercel = process.env.NEXT_PUBLIC_VERCEL_URL ?? process.env.VERCEL_URL;
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, "").replace(/\/+$/, "")}`;
  return "http://localhost:3000";
}

export function absoluteUrl(path: string): string {
  return `${siteOrigin()}${path.startsWith("/") ? path : `/${path}`}`;
}
