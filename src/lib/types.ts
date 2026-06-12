export type PlanTier = "free" | "premium";
export type MissionStatus = "active" | "completed" | "skipped" | "expired";
export type MissionDifficulty = "easy" | "medium" | "hard" | "epic";
export type MissionCadence = "daily" | "weekly";
export type GoalStatus = "active" | "achieved" | "archived";

export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  xp: number;
  level: number;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  onboarded: boolean;
  focus_areas: string[];
  intensity: "chill" | "standard" | "hardcore";
  plan: PlanTier;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: string | null;
  current_period_end: string | null;
  referral_code: string;
  referred_by: string | null;
  created_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string;
  status: GoalStatus;
  progress: number;
  target_date: string | null;
  created_at: string;
}

export interface Mission {
  id: string;
  user_id: string;
  goal_id: string | null;
  title: string;
  description: string | null;
  why_it_matters: string | null;
  category: string;
  cadence: MissionCadence;
  difficulty: MissionDifficulty;
  xp_reward: number;
  status: MissionStatus;
  source: string;
  due_date: string;
  completed_at: string | null;
  created_at: string;
}

export interface Achievement {
  code: string;
  title: string;
  description: string;
  icon: string;
  xp_reward: number;
  premium_only: boolean;
  sort_order: number;
}

export interface UserAchievement {
  user_id: string;
  achievement_code: string;
  unlocked_at: string;
}

export interface CoachMessage {
  id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface WeeklyReviewContent {
  summary: string;
  score: number;
  wins: string[];
  struggles: string[];
  focus_next_week: string[];
}

export interface RoadmapMilestone {
  week: number;
  title: string;
  description: string;
  missions: string[];
}

export interface RoadmapContent {
  milestones: RoadmapMilestone[];
}

export const FOCUS_AREAS = [
  { id: "friends", label: "Make more friends", icon: "🫂" },
  { id: "confidence", label: "Become more confident", icon: "🦁" },
  { id: "fitness", label: "Improve fitness", icon: "💪" },
  { id: "money", label: "Make money", icon: "💸" },
  { id: "discipline", label: "Build discipline", icon: "⚔️" },
  { id: "focus", label: "Stop procrastinating", icon: "🎯" },
  { id: "communication", label: "Improve communication", icon: "🗣️" },
] as const;

export type FocusAreaId = (typeof FOCUS_AREAS)[number]["id"];

export function focusAreaLabel(id: string): string {
  return FOCUS_AREAS.find((f) => f.id === id)?.label ?? id;
}
