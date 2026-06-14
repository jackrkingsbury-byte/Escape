-- ═══════════════════════════════════════════════════════════════
-- Life OS — Database Schema
-- Run via Supabase CLI (`supabase db push`) or the SQL editor.
-- ═══════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- ── Enums ───────────────────────────────────────────────────────
create type plan_tier as enum ('free', 'premium');
create type mission_status as enum ('active', 'completed', 'skipped', 'expired');
create type mission_difficulty as enum ('easy', 'medium', 'hard', 'epic');
create type mission_cadence as enum ('daily', 'weekly');
create type goal_status as enum ('active', 'achieved', 'archived');
create type referral_status as enum ('pending', 'converted');

-- ── Profiles ────────────────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique,
  full_name text,
  avatar_url text,
  -- Progression
  xp bigint not null default 0,
  level int not null default 1,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  last_activity_date date,
  -- Onboarding
  onboarded boolean not null default false,
  focus_areas text[] not null default '{}',
  intensity text not null default 'standard', -- chill | standard | hardcore
  -- Billing (Paystack)
  plan plan_tier not null default 'free',
  paystack_customer_code text unique,
  paystack_subscription_code text,
  paystack_email_token text,
  subscription_status text,
  current_period_end timestamptz,
  -- Referrals
  referral_code text unique not null default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  referred_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Goals (chosen outcomes) ─────────────────────────────────────
create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text,
  category text not null, -- friends | confidence | fitness | money | discipline | focus | communication
  status goal_status not null default 'active',
  progress int not null default 0 check (progress between 0 and 100),
  target_date date,
  created_at timestamptz not null default now()
);
create index goals_user_idx on public.goals (user_id, status);

-- ── Missions ────────────────────────────────────────────────────
create table public.missions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  goal_id uuid references public.goals (id) on delete set null,
  title text not null,
  description text,
  why_it_matters text,
  category text not null,
  cadence mission_cadence not null default 'daily',
  difficulty mission_difficulty not null default 'medium',
  xp_reward int not null default 25,
  status mission_status not null default 'active',
  source text not null default 'ai', -- ai | manual | challenge_pack
  due_date date not null default current_date,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);
create index missions_user_day_idx on public.missions (user_id, due_date, status);

-- ── XP ledger ───────────────────────────────────────────────────
create table public.xp_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount int not null,
  reason text not null, -- mission_complete | achievement | streak_bonus | referral
  ref_id uuid,
  created_at timestamptz not null default now()
);
create index xp_events_user_idx on public.xp_events (user_id, created_at desc);

-- ── Achievements ────────────────────────────────────────────────
create table public.achievements (
  code text primary key,
  title text not null,
  description text not null,
  icon text not null default '🏆',
  xp_reward int not null default 50,
  premium_only boolean not null default false,
  sort_order int not null default 0
);

create table public.user_achievements (
  user_id uuid not null references public.profiles (id) on delete cascade,
  achievement_code text not null references public.achievements (code) on delete cascade,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, achievement_code)
);

-- ── AI coach conversation ───────────────────────────────────────
create table public.coach_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);
create index coach_messages_user_idx on public.coach_messages (user_id, created_at);

-- ── Weekly AI reviews ───────────────────────────────────────────
create table public.weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  week_start date not null,
  content jsonb not null, -- { summary, wins[], struggles[], focus_next_week[], score }
  created_at timestamptz not null default now(),
  unique (user_id, week_start)
);

-- ── AI roadmaps (premium) ───────────────────────────────────────
create table public.roadmaps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  goal_id uuid references public.goals (id) on delete cascade,
  title text not null,
  horizon_weeks int not null default 12,
  content jsonb not null, -- { milestones: [{week, title, description, missions[]}] }
  created_at timestamptz not null default now()
);

-- ── Referrals ───────────────────────────────────────────────────
create table public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.profiles (id) on delete cascade,
  referred_id uuid not null references public.profiles (id) on delete cascade,
  status referral_status not null default 'pending',
  created_at timestamptz not null default now(),
  unique (referred_id)
);

-- ── AI usage metering (free-tier limits) ────────────────────────
create table public.ai_usage (
  user_id uuid not null references public.profiles (id) on delete cascade,
  day date not null default current_date,
  mission_generations int not null default 0,
  coach_messages int not null default 0,
  primary key (user_id, day)
);

-- ═══════════════════════════════════════════════════════════════
-- Row Level Security
-- ═══════════════════════════════════════════════════════════════
alter table public.profiles enable row level security;
alter table public.goals enable row level security;
alter table public.missions enable row level security;
alter table public.xp_events enable row level security;
alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;
alter table public.coach_messages enable row level security;
alter table public.weekly_reviews enable row level security;
alter table public.roadmaps enable row level security;
alter table public.referrals enable row level security;
alter table public.ai_usage enable row level security;

-- Profiles: read/update own row only (billing columns are guarded by trigger below)
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- Owner-only CRUD for user data
create policy "goals_all_own" on public.goals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "missions_all_own" on public.missions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "xp_select_own" on public.xp_events for select using (auth.uid() = user_id);
create policy "coach_all_own" on public.coach_messages for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "reviews_select_own" on public.weekly_reviews for select using (auth.uid() = user_id);
create policy "roadmaps_select_own" on public.roadmaps for select using (auth.uid() = user_id);
create policy "referrals_select_own" on public.referrals for select using (auth.uid() = referrer_id or auth.uid() = referred_id);
create policy "ai_usage_select_own" on public.ai_usage for select using (auth.uid() = user_id);

-- Achievement catalog is public-read
create policy "achievements_read_all" on public.achievements for select using (true);
create policy "user_achievements_select_own" on public.user_achievements for select using (auth.uid() = user_id);

-- Server (service role) bypasses RLS for: xp grants, reviews, roadmaps,
-- referrals, ai_usage writes, achievement unlocks, Paystack billing sync.

-- ═══════════════════════════════════════════════════════════════
-- Guard: clients cannot self-grant XP / plan / streaks via UPDATE
-- ═══════════════════════════════════════════════════════════════
create or replace function public.protect_profile_columns()
returns trigger language plpgsql security definer as $$
begin
  if current_setting('request.jwt.claim.role', true) = 'authenticated' then
    new.xp := old.xp;
    new.level := old.level;
    new.current_streak := old.current_streak;
    new.longest_streak := old.longest_streak;
    new.plan := old.plan;
    new.paystack_customer_code := old.paystack_customer_code;
    new.paystack_subscription_code := old.paystack_subscription_code;
    new.paystack_email_token := old.paystack_email_token;
    new.subscription_status := old.subscription_status;
    new.current_period_end := old.current_period_end;
    new.referral_code := old.referral_code;
    new.referred_by := old.referred_by;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_protect before update on public.profiles
  for each row execute function public.protect_profile_columns();

-- ═══════════════════════════════════════════════════════════════
-- Auto-create profile on signup
-- ═══════════════════════════════════════════════════════════════
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ═══════════════════════════════════════════════════════════════
-- complete_mission(): atomic XP grant + streak + level update.
-- Called with the user's own JWT (security definer validates owner).
-- ═══════════════════════════════════════════════════════════════
create or replace function public.complete_mission(p_mission_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_mission missions%rowtype;
  v_profile profiles%rowtype;
  v_xp int;
  v_streak_bonus int := 0;
  v_new_level int;
begin
  select * into v_mission from missions
   where id = p_mission_id and user_id = auth.uid() for update;
  if not found then
    raise exception 'mission not found';
  end if;
  if v_mission.status <> 'active' then
    raise exception 'mission is not active';
  end if;

  update missions set status = 'completed', completed_at = now() where id = p_mission_id;

  select * into v_profile from profiles where id = auth.uid() for update;

  -- Streak: increments once per new day of activity
  if v_profile.last_activity_date is null or v_profile.last_activity_date < current_date - 1 then
    v_profile.current_streak := 1;
  elsif v_profile.last_activity_date = current_date - 1 then
    v_profile.current_streak := v_profile.current_streak + 1;
    v_streak_bonus := least(v_profile.current_streak, 30) * 2;
  end if;

  v_xp := v_mission.xp_reward + v_streak_bonus;
  -- Level curve: level n requires 100 * n^1.5 cumulative XP
  v_new_level := greatest(1, floor(power((v_profile.xp + v_xp) / 100.0, 1.0 / 1.5))::int + 1);

  update profiles set
    xp = xp + v_xp,
    level = v_new_level,
    current_streak = v_profile.current_streak,
    longest_streak = greatest(longest_streak, v_profile.current_streak),
    last_activity_date = current_date
  where id = auth.uid();

  insert into xp_events (user_id, amount, reason, ref_id)
  values (auth.uid(), v_mission.xp_reward, 'mission_complete', p_mission_id);
  if v_streak_bonus > 0 then
    insert into xp_events (user_id, amount, reason, ref_id)
    values (auth.uid(), v_streak_bonus, 'streak_bonus', p_mission_id);
  end if;

  return jsonb_build_object(
    'xp_awarded', v_xp,
    'streak', v_profile.current_streak,
    'level', v_new_level,
    'total_xp', v_profile.xp + v_xp
  );
end;
$$;

revoke all on function public.complete_mission(uuid) from public;
grant execute on function public.complete_mission(uuid) to authenticated;

-- ═══════════════════════════════════════════════════════════════
-- Seed: achievement catalog
-- ═══════════════════════════════════════════════════════════════
insert into public.achievements (code, title, description, icon, xp_reward, premium_only, sort_order) values
  ('first_mission',    'First Blood',        'Complete your very first mission.',              '⚡', 50,  false, 1),
  ('streak_3',         'Warming Up',         'Hit a 3-day streak.',                            '🔥', 75,  false, 2),
  ('streak_7',         'On Fire',            'Hit a 7-day streak.',                            '🔥', 150, false, 3),
  ('streak_30',        'Unstoppable',        'Hit a 30-day streak.',                           '🌋', 500, false, 4),
  ('missions_10',      'Operator',           'Complete 10 missions.',                          '🎯', 100, false, 5),
  ('missions_50',      'Veteran',            'Complete 50 missions.',                          '🛡️', 300, false, 6),
  ('missions_200',     'Legend',             'Complete 200 missions.',                         '👑', 1000, false, 7),
  ('level_5',          'Rising Star',        'Reach level 5.',                                 '⭐', 100, false, 8),
  ('level_10',         'High Performer',     'Reach level 10.',                                '💫', 250, false, 9),
  ('first_goal',       'North Star',         'Set your first goal.',                           '🧭', 25,  false, 10),
  ('first_review',     'Self-Aware',         'Complete your first AI weekly review.',          '🪞', 75,  false, 11),
  ('referral_1',       'Recruiter',          'Bring a friend into Life OS.',                   '🤝', 200, false, 12),
  ('epic_mission',     'Epic Slayer',        'Complete an epic-difficulty mission.',           '🐉', 150, false, 13),
  ('roadmap_created',  'Architect',          'Build your first AI roadmap.',                   '🗺️', 100, true,  14),
  ('coach_devotee',    'Inner Circle',       'Have 100 conversations with your AI coach.',     '🧠', 300, true,  15),
  ('perfect_week',     'Perfect Week',       'Complete every daily mission 7 days straight.',  '💎', 400, true,  16);
