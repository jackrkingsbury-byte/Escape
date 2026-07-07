import type { BusinessRow } from "@/lib/supabase/types";

/** The business context the reply agent needs to answer in the owner's voice. */
export interface BusinessProfile {
  name: string;
  vertical?: string | null;
  city?: string | null;
  timezone: string;
  tone?: string | null;
  hours?: unknown;
  serviceArea?: string | null;
  faq?: unknown;
  priceRanges?: unknown;
}

export interface ConversationTurn {
  role: "customer" | "business";
  text: string;
}

/** Structured result the agent returns for every inbound message. */
export interface AgentResult {
  reply_text: string;
  intent: "quote_request" | "booking" | "question" | "complaint" | "spam" | "other";
  qualification: {
    job_type?: string;
    location?: string;
    urgency?: string;
    timing?: string;
    budget_signal?: string;
  };
  suggested_slots: string[];
  estimated_value: number;
  confidence: "high" | "low";
  needs_human: boolean;
  internal_note: string;
}

export type AgentOutcome =
  | { ok: true; result: AgentResult }
  | { ok: false; error: string };

/** Derive the agent profile from a stored business row. */
export function profileFromBusiness(b: BusinessRow): BusinessProfile {
  return {
    name: b.name,
    vertical: b.vertical,
    city: b.city,
    timezone: b.timezone,
    tone: b.tone,
    hours: b.hours,
    serviceArea: b.service_area,
    faq: b.faq,
    priceRanges: b.price_ranges,
  };
}

/** A sensible demo profile so the "Test the AI" box works before onboarding. */
export const DEMO_PROFILE: BusinessProfile = {
  name: "Sipho's Plumbing",
  vertical: "plumbing",
  city: "Cape Town",
  timezone: "Africa/Johannesburg",
  tone: "friendly, professional, down-to-earth South African tradesperson",
  hours: { mon_fri: "07:00-17:00", sat: "08:00-13:00", emergencies: "24/7" },
  serviceArea: "Cape Town northern suburbs",
  faq: [
    { q: "Do you do after-hours?", a: "Yes, for emergencies like burst geysers and pipes." },
    { q: "Do you charge a call-out fee?", a: "A small call-out applies, waived if you book the job." },
  ],
  priceRanges: [
    { item: "Geyser replacement (150L)", range: "R4,500 - R7,000" },
    { item: "Burst pipe repair", range: "R850 - R2,500" },
    { item: "Blocked drain", range: "R650 - R1,800" },
    { item: "Tap / mixer replacement", range: "R450 - R1,200" },
  ],
};
