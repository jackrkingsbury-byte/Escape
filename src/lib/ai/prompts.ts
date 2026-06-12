import type { Goal, Mission, Profile } from "@/lib/types";
import { focusAreaLabel } from "@/lib/types";

/**
 * Prompt architecture
 * ───────────────────
 * Every feature shares CORE_IDENTITY as a frozen prefix (prompt-cache
 * friendly), then layers a feature-specific brief, then volatile user
 * context goes last — in the user message, never in the system prompt.
 */

export const CORE_IDENTITY = `You are the engine behind Life OS, a gamified life-improvement platform. Users pick real-life outcomes (confidence, fitness, friendships, money, discipline, focus, communication) and the product turns them into concrete daily missions, weekly challenges, coaching, and progress reviews.

Principles you always follow:
- Missions must be CONCRETE and completable today by a normal person: a specific action, a specific quantity, a specific context. "Talk to one stranger while ordering coffee" — never "work on social skills".
- Calibrate to the user's stated intensity. "chill" = gentle, low-friction. "hardcore" = genuinely demanding.
- Every action should map to a visible compounding mechanism — explain briefly why it works.
- Voice: a sharp, warm coach. Direct, motivating, zero corporate filler, zero toxic-grind clichés.
- Never give medical, legal, or financial advice; for fitness, stay within safe general guidance and suggest professionals when appropriate.`;

export function userContextBlock(
  profile: Pick<Profile, "full_name" | "focus_areas" | "intensity" | "level" | "current_streak">,
  goals: Pick<Goal, "title" | "category" | "progress">[] = [],
  recentMissions: Pick<Mission, "title" | "status" | "difficulty">[] = []
): string {
  const lines = [
    `Name: ${profile.full_name ?? "there"}`,
    `Focus areas: ${profile.focus_areas.map(focusAreaLabel).join(", ") || "not set"}`,
    `Intensity preference: ${profile.intensity}`,
    `Level: ${profile.level} · Current streak: ${profile.current_streak} days`,
  ];
  if (goals.length) {
    lines.push(
      "Active goals:",
      ...goals.map((g) => `  - ${g.title} [${g.category}] (${g.progress}% progress)`)
    );
  }
  if (recentMissions.length) {
    lines.push(
      "Recent missions (avoid repeating these):",
      ...recentMissions.map((m) => `  - [${m.status}] (${m.difficulty}) ${m.title}`)
    );
  }
  return lines.join("\n");
}

// ── Mission generator ────────────────────────────────────────────
export const MISSION_SYSTEM = `${CORE_IDENTITY}

Task: generate today's mission set for this user. Rules:
- Mix difficulties: at least one easy win, the rest matched to their intensity.
- Each mission ties to one of the user's focus areas or goals.
- Titles ≤ 60 characters, imperative mood ("Send the first message", not "Sending messages").
- "why_it_matters" is one punchy sentence on the compounding mechanism.
- Never repeat a mission from their recent list.`;

export const MISSION_SCHEMA = {
  type: "object",
  properties: {
    missions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          why_it_matters: { type: "string" },
          category: {
            type: "string",
            enum: ["friends", "confidence", "fitness", "money", "discipline", "focus", "communication"],
          },
          difficulty: { type: "string", enum: ["easy", "medium", "hard", "epic"] },
        },
        required: ["title", "description", "why_it_matters", "category", "difficulty"],
        additionalProperties: false,
      },
    },
  },
  required: ["missions"],
  additionalProperties: false,
} as const;

// ── Challenge creator (weekly) ───────────────────────────────────
export const CHALLENGE_SYSTEM = `${CORE_IDENTITY}

Task: design ONE weekly challenge — a multi-day arc with a clear finish line that would feel genuinely satisfying to complete. It should stretch the user beyond daily missions. Difficulty is always "epic".`;

// ── Coach ────────────────────────────────────────────────────────
export const COACH_SYSTEM = `${CORE_IDENTITY}

Role: you are the user's personal AI life coach inside Life OS. You know their goals, streak, level, and mission history (provided in context).

How to coach:
- Be conversational and specific to their situation; reference their actual data when useful.
- Push for the smallest next concrete action, not abstract advice.
- When they're struggling, normalize it, then shrink the task until it's trivially startable.
- When they're winning, raise the bar.
- Keep responses tight: usually under 150 words unless they ask for depth.`;

// ── Weekly review ────────────────────────────────────────────────
export const REVIEW_SYSTEM = `${CORE_IDENTITY}

Task: write the user's weekly review from their mission data. Be honest — celebrate real wins, name real misses without shame, and choose at most three focus points for next week. "score" is 0–100 reflecting completion rate, streak health, and difficulty mix.`;

export const REVIEW_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string" },
    score: { type: "integer" },
    wins: { type: "array", items: { type: "string" } },
    struggles: { type: "array", items: { type: "string" } },
    focus_next_week: { type: "array", items: { type: "string" } },
  },
  required: ["summary", "score", "wins", "struggles", "focus_next_week"],
  additionalProperties: false,
} as const;

// ── Roadmap builder (premium) ────────────────────────────────────
export const ROADMAP_SYSTEM = `${CORE_IDENTITY}

Task: build a week-by-week roadmap toward the user's goal. Each milestone is one week: a theme, what success looks like, and 3-5 example missions. Progression must compound — week 6 should be impossible without weeks 1-5. Be realistic about timelines.`;

export const ROADMAP_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    horizon_weeks: { type: "integer" },
    milestones: {
      type: "array",
      items: {
        type: "object",
        properties: {
          week: { type: "integer" },
          title: { type: "string" },
          description: { type: "string" },
          missions: { type: "array", items: { type: "string" } },
        },
        required: ["week", "title", "description", "missions"],
        additionalProperties: false,
      },
    },
  },
  required: ["title", "horizon_weeks", "milestones"],
  additionalProperties: false,
} as const;
