-- Run this once in the Supabase SQL Editor (Project > SQL Editor > New query)
-- after creating your project. See DEPLOY.md for the full setup walkthrough.
--
-- Safe to re-run: uses "create table if not exists" and "add column if not
-- exists" throughout, so running this again on an existing database (e.g.
-- after pulling an update to this file) just adds whatever is missing.

create extension if not exists "uuid-ossp";

create table if not exists players (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists games (
  id uuid primary key default uuid_generate_v4(),
  cfbd_game_id bigint not null unique,
  season int not null,
  week int not null,
  home_team text not null,
  away_team text not null,
  spread numeric,                 -- home team spread; negative = home favored
  kickoff_time timestamptz not null,
  home_score int,
  away_score int,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'in_progress', 'final')),
  ats_result text
    check (ats_result in ('home', 'away', 'push')),
  -- Whether the admin has selected this game as part of the group's
  -- pick'em slate for the week. Not every FBS game is picked each week —
  -- the admin curates the list from everything CFBD has synced.
  included_in_pickem boolean not null default false,
  -- Once true, the spread is locked (set from DraftKings, Thursday noon)
  -- and routine syncs must never overwrite it again.
  spread_locked boolean not null default false,
  updated_at timestamptz not null default now()
);

-- Upgrade path for databases created before included_in_pickem/spread_locked
-- existed.
alter table games add column if not exists included_in_pickem boolean not null default false;
alter table games add column if not exists spread_locked boolean not null default false;

create index if not exists games_week_idx on games (season, week);

create table if not exists picks (
  id uuid primary key default uuid_generate_v4(),
  player_id uuid not null references players (id) on delete cascade,
  game_id uuid not null references games (id) on delete cascade,
  week int not null,
  picked_team text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (player_id, game_id)
);

create index if not exists picks_week_idx on picks (week);

-- One row per player per week, inserted the moment they submit their picks.
-- Its presence is what makes a week's picks final: submitting once locks
-- them in permanently (no edits), and its existence is what "Everyone's
-- Picks" checks before revealing what a player picked (so people can't see
-- others' picks before the deadline and copy them).
create table if not exists weekly_submissions (
  id uuid primary key default uuid_generate_v4(),
  player_id uuid references players (id) on delete cascade,
  week int not null,
  submitted_at timestamptz not null default now(),
  unique (player_id, week)
);

-- One-time preseason submission lock (Playoff Pool + Heisman Pool picks
-- together), not tied to any particular week.
create table if not exists preseason_submissions (
  id uuid primary key default uuid_generate_v4(),
  player_id uuid references players (id) on delete cascade,
  submitted_at timestamptz not null default now(),
  unique (player_id)
);

-- Preseason Playoff Pool: the 12-team CFP field. Rows get created either by
-- the admin (once real teams are known) or automatically whenever a player
-- types a team name in their preseason picks (so the admin has something to
-- mark later). Point value for a team = made_field ? (1 + (had_bye ? 1 : 0)
-- + rounds_won) : 0 — see lib/scoring.ts.
create table if not exists playoff_teams (
  id uuid primary key default uuid_generate_v4(),
  team_name text not null unique,
  made_field boolean not null default false,
  had_bye boolean not null default false,
  rounds_won int not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists playoff_picks (
  id uuid primary key default uuid_generate_v4(),
  player_id uuid not null references players (id) on delete cascade,
  team_name text not null,
  created_at timestamptz not null default now(),
  unique (player_id, team_name)
);

-- Preseason Heisman Pool. Point value per pick = (is_finalist ? 1 : 0) +
-- (is_winner ? 1 : 0) — see lib/scoring.ts.
create table if not exists heisman_candidates (
  id uuid primary key default uuid_generate_v4(),
  candidate_name text not null unique,
  is_finalist boolean not null default false,
  is_winner boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists heisman_picks (
  id uuid primary key default uuid_generate_v4(),
  player_id uuid not null references players (id) on delete cascade,
  candidate_name text not null,
  created_at timestamptz not null default now(),
  unique (player_id, candidate_name)
);

-- Row Level Security: all reads/writes to these tables go through Next.js
-- server routes using the Supabase service role key, which bypasses RLS.
-- Enabling RLS with no policies means the anon/public key (if ever exposed)
-- cannot read or write anything directly.
alter table players enable row level security;
alter table games enable row level security;
alter table picks enable row level security;
alter table weekly_submissions enable row level security;
alter table preseason_submissions enable row level security;
alter table playoff_teams enable row level security;
alter table playoff_picks enable row level security;
alter table heisman_candidates enable row level security;
alter table heisman_picks enable row level security;

-- Seed the fixed starting roster. Idempotent — safe to re-run. Players can
-- still be added later the normal way (typing a new name on /picks), this
-- just guarantees these three exist from the start.
insert into players (name) values
  ('Garrett'),
  ('Mark'),
  ('Corben')
on conflict (name) do nothing;
