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
  spread numeric,
  kickoff_time timestamptz not null,
  home_score int,
  away_score int,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'in_progress', 'final')),
  ats_result text
    check (ats_result in ('home', 'away', 'push')),
  included_in_pickem boolean not null default false,
  spread_locked boolean not null default false,
  updated_at timestamptz not null default now()
);

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

create table if not exists weekly_submissions (
  id uuid primary key default uuid_generate_v4(),
  player_id uuid references players (id) on delete cascade,
  week int not null,
  submitted_at timestamptz not null default now(),
  unique (player_id, week)
);

create table if not exists preseason_submissions (
  id uuid primary key default uuid_generate_v4(),
  player_id uuid references players (id) on delete cascade,
  submitted_at timestamptz not null default now(),
  unique (player_id)
);

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

alter table players enable row level security;
alter table games enable row level security;
alter table picks enable row level security;
alter table weekly_submissions enable row level security;
alter table preseason_submissions enable row level security;
alter table playoff_teams enable row level security;
alter table playoff_picks enable row level security;
alter table heisman_candidates enable row level security;
alter table heisman_picks enable row level security;

insert into players (name) values
  ('Garrett'),
  ('Mark'),
  ('Corben')
on conflict (name) do nothing;
