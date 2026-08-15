# Deploying your CFB Pick 'Em app

This gets you a live site anyone can open with a link — no login required
for players (the admin section is password-protected). Everything below
uses free tiers. Total time: ~20-30 minutes.

## What you're setting up

- **Vercel** — hosts the site itself (free "Hobby" plan)
- **Supabase** — the database (players, games, picks, playoff/Heisman
  pools) (free plan)
- **CollegeFootballData.com (CFBD)** — free API for games, DraftKings
  spreads, and final scores

## 1. Create your Supabase project

1. Go to https://supabase.com, sign up, and create a new project (pick any
   name/region, set a database password — you won't need it directly).
2. Once it's ready, go to **SQL Editor > New query**, paste in the contents
   of `supabase/schema.sql` from this project, and run it. This creates all
   of the app's tables (players, games, picks, weekly_submissions,
   preseason_submissions, playoff_teams, playoff_picks,
   heisman_candidates, heisman_picks) and seeds the starting roster
   (Garrett, Mark, Corben).
3. Go to **Project Settings > API**. You'll need two values in a minute:
   - **Project URL** (`NEXT_PUBLIC_SUPABASE_URL`)
   - **service_role key** (`SUPABASE_SERVICE_ROLE_KEY`) — under "Project API
     keys", NOT the "anon public" key. Keep this secret; it has full
     database access.

## 2. Get a free CFBD API key

1. Go to https://collegefootballdata.com/key and request a free key (no
   credit card). It's emailed to you.
2. Free tier gives you 1,000 API calls/month, historical + current season
   game data, and betting lines (including DraftKings, which this app
   requires — see "Spreads come from DraftKings" below). That's enough for
   this app's design.

## 3. Push this code to GitHub

Vercel deploys from a GitHub repo:

1. Create a new empty repo on GitHub (e.g. `cfb-pickem`).
2. From this project's folder:
   ```
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/cfb-pickem.git
   git push -u origin main
   ```

## 4. Deploy to Vercel

1. Go to https://vercel.com, sign up/log in with GitHub, click **Add New >
   Project**, and import the repo you just pushed.
2. Before deploying, expand **Environment Variables** and add:
   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | from Supabase step 1 |
   | `SUPABASE_SERVICE_ROLE_KEY` | from Supabase step 1 |
   | `CFBD_API_KEY` | from step 2 |
   | `SEASON_YEAR` | `2026` |
   | `ADMIN_SECRET` | make up a random password — this is also your `/admin` login password |
   | `CRON_SECRET` | make up another random password |
3. Click **Deploy**. After a minute you'll get a live URL like
   `https://cfb-pickem-yourname.vercel.app` — that's the link you share
   with friends.

Vercel will automatically pick up `vercel.json`, which schedules two free
built-in cron jobs (see "Cron schedule" below) — no further setup needed.

## 5. Load the first week and try it out

Log into `/admin` (password = your `ADMIN_SECRET`), open the current
week's page (`/admin/week/1` for week 1), and click **"Sync this week's
games from CFBD"**. That pulls every FBS game for the week into the
database. Then check the boxes for whichever games your group wants to
pick that week and click **"Save selection"**.

Once that's done, visit your site:
- `/` — home page, shows this week's included games and the combined
  standings
- `/picks` — where friends type their name and make picks
- `/picks/preseason/<name>` — one-time preseason Playoff Pool + Heisman
  Pool picks
- `/week/1` — full scoreboard + everyone's picks for week 1
- `/standings` — combined season standings

## Cron schedule (built-in Vercel Cron, both free)

The owner only needs two things to happen on a schedule, and both are far
less frequent than Vercel Hobby's "once per day per cron job" limit, so no
external scheduler is needed:

- **`/api/cron/lock-lines`** — Thursdays at noon (`0 12 * * 4`). Fetches
  the current week's DraftKings lines and locks in the spread for every
  game the admin has marked included in the pick'em slate. Once locked, no
  routine sync will ever change that spread again.
- **`/api/cron/score`** — Sundays at 4am (`0 4 * * 0`). Refreshes final
  scores and computes ATS results/standings for the week.

Both are defined in `vercel.json` and protected by a bearer token
(`Authorization: Bearer $CRON_SECRET`) that Vercel Cron sends automatically.

If you ever want to re-run either manually (e.g. lines looked wrong, or you
want to force a rescore), use the admin week page's **"Lock DraftKings
lines now"** button, or hit `/api/cron/score` yourself with the
`Authorization` header set.

## Weekly routine

1. **Curate the slate.** Log into `/admin`, open that week's page
   (`/admin/week/<week>`), click **"Sync this week's games from CFBD"** to
   pull in everything CFBD has for the week, then check the boxes for
   whichever games are actually part of the group's pick'em pool this week
   and click **"Save selection"**.
2. **Thursday at noon**, DraftKings lines lock in automatically for every
   included game (or trigger it manually from the same admin page if
   needed).
3. **Players submit picks once**, any time before the first included
   game of the week kicks off (`/picks/<name>`). There are no edits after
   submitting, and the deadline is a hard cutoff — nothing can be picked or
   changed after the first kickoff of the week's slate.
4. **Sunday at 4am**, scores and ATS results refresh automatically and the
   standings update.

### One-time preseason step

Before the season starts, each player visits `/picks/preseason/<name>` to
submit their 12-team Playoff Pool pick and 5-name Heisman Pool pick in one
form (free text — the real 12-team field doesn't exist yet, so there's
nothing to choose from a list). This is also submit-once, no edits.

As results come in over the season, the admin updates:
- `/admin/playoff` — mark which teams made the field, which had a
  first-round bye, and how many rounds each has won.
- `/admin/heisman` — mark which candidates are finalists and who the
  winner is.

The combined standings on `/` and `/standings` automatically recompute
from these as soon as they change.

## Spreads come from DraftKings

The owner's requirement is that every pick'em spread come specifically
from DraftKings — not a "consensus" number, not whichever book CFBD lists
first. `lib/cfbd.ts`'s `getLines()` looks specifically for a DraftKings
line; if DraftKings hasn't posted one for a game yet, the spread is left
blank rather than silently substituted from a different book. Locking (via
the Thursday cron or the manual admin button) only ever writes the
DraftKings number.

## About scores

CFBD's **free** tier includes final scores (used for standings/ATS
grading) but not their real-time in-game "Live Scoreboard" feed. Since
scoring now only needs to run once a week (Sunday mornings), this is not a
practical limitation for this app — nothing needs to change here even if
you want fresher in-game numbers occasionally; just re-trigger
`/api/cron/score` manually (or the `/api/cron/refresh` convenience
endpoint) whenever you want an ad-hoc refresh.

## Notes on the admin section

`/admin` and everything under it (`/admin/week/<week>`, `/admin/playoff`,
`/admin/heisman`) is gated behind a single shared password — your
`ADMIN_SECRET` value. Logging in at `/admin/login` sets an httpOnly cookie
that Server Components/Route Handlers check on every admin page or action;
there's no per-user admin login, just one shared password for whoever runs
the league.

## Notes on the "no login" design (players)

Anyone with the link can pick any name (or add a new one) and submit
picks for that name — there are no player passwords. The real protections
are: (1) picks can only be submitted once per player per week, and only
before the first included game of the week kicks off — after that the
window is closed for everyone, no exceptions; and (2) other players'
picks stay hidden until you've submitted your own (or the game has
started), so nobody can peek and copy. This is meant for a trusted friend
group, not the general public.
