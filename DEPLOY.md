# Deploy Guide

Full step-by-step setup: Supabase -> CFBD -> GitHub -> Vercel.

## 1. Create the Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project (any name/region is fine).
2. Wait for it to finish provisioning, then open **Project Settings > API**. Note down:
   - **Project URL** (this is `NEXT_PUBLIC_SUPABASE_URL`)
   - **service_role secret** (this is `SUPABASE_SERVICE_ROLE_KEY` - keep this secret, never put it
     in client-side code or a `NEXT_PUBLIC_*` variable)
3. Open **SQL Editor > New query**, paste in the entire contents of `supabase/schema.sql` from
   this repo, and run it. This creates all tables (players, games, picks, weekly_submissions,
   preseason_submissions, playoff_teams, playoff_picks, heisman_candidates, heisman_picks) and
   seeds the roster with Garrett, Mark, and Corben.
   - The script is safe to re-run any time - it only uses `create table if not exists` and
     `add column if not exists`, so re-running it after pulling an update just adds whatever's
     missing.

## 2. Get a CFBD API key

1. Go to [collegefootballdata.com/key](https://collegefootballdata.com/key) and request a free
   API key (just an email address).
2. Save the key - this is `CFBD_API_KEY`.

## 3. Push this project to GitHub

```bash
cd cfb-pickem
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<you>/cfb-pickem.git
git push -u origin main
```

## 4. Deploy to Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and import the GitHub repo you just pushed.
2. Vercel will auto-detect Next.js. Before the first deploy, add the environment variables below
   under **Project Settings > Environment Variables** (set them for all environments -
   Production, Preview, and Development).
3. Deploy.

### Environment variables

| Variable | Value | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project.supabase.co` | From Supabase Project Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | `your-service-role-key` | From Supabase Project Settings > API. **Server-only, never expose to the browser.** |
| `CFBD_API_KEY` | `your-cfbd-api-key` | From collegefootballdata.com/key |
| `SEASON_YEAR` | `2026` | The current college football season |
| `ADMIN_SECRET` | `change-me-to-something-random` | The admin login password - pick a long random string |
| `CRON_SECRET` | `change-me-to-something-random-too` | Shared secret the two Vercel Cron jobs send as `Authorization: Bearer <CRON_SECRET>` |

Generate random values for `ADMIN_SECRET` and `CRON_SECRET` with something like:

```bash
openssl rand -hex 24
```

## 5. Cron jobs

`vercel.json` already defines two free built-in Vercel Cron jobs - no extra setup needed once
deployed:

| Path | Schedule | What it does |
| --- | --- | --- |
| `/api/cron/lock-lines` | `0 12 * * 4` (Thursdays at noon UTC) | Locks in the current DraftKings spread for every game marked `included_in_pickem` for the current week, and marks them `spread_locked` so future syncs never overwrite them. |
| `/api/cron/score` | `0 4 * * 0` (Sundays at 4am UTC) | Pulls final scores from CFBD for the current week and computes `ats_result` for every final game with a locked spread. |

Both routes check an `Authorization: Bearer $CRON_SECRET` header and return `401` if it doesn't
match - Vercel sends this automatically for its own Cron invocations once `CRON_SECRET` is set as
an environment variable, so you don't need to configure anything extra.

If you ever need to trigger these manually (e.g. to test, or if a cron run failed), you can also
POST directly:

```bash
curl -X POST https://your-app.vercel.app/api/admin/sync-week \
  -H "x-admin-secret: $ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"week": 3}'

curl -X POST https://your-app.vercel.app/api/admin/score-week \
  -H "x-admin-secret: $ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"week": 3}'
```

## 6. Weekly routine (once deployed)

1. **Curate the slate.** Log in at `/admin/login`, then go to `/admin/week/<week>`. Click "Sync
   this week's games from CFBD" to pull the week's schedule, check the boxes for the games you
   want in the pool, and click "Save selection".
2. **Thursday, noon** - the `lock-lines` cron job locks in that week's DraftKings spreads
   automatically for every included game.
3. **Players submit picks once**, any time before the first included game of the week kicks off,
   at `/picks/<name>`. They'll be asked to confirm their identity first, then can pick each game;
   submission is one-time and locks immediately (no edits after that).
4. **Sunday, 4am** - the `score` cron job pulls final scores and computes ATS results.
5. Standings at `/standings` and the scoreboard at `/week/<week>` update automatically. Picks stay
   hidden on the scoreboard until either everyone has submitted or the first game has kicked off.

## Admin: adding players (`/admin/players`)

Log in at `/admin/login`, go to `/admin/players`. You'll see the current roster and a simple
"name + Add Player" form below it. Submitting adds the player immediately - no deploy or restart
needed - and they'll show up right away as an option on the public `/picks` page.

## Public: preseason picks overview (`/picks/preseason`)

No login needed. This page always shows the current state of every player's preseason Playoff
Pool and Heisman Pool picks - submitted picks are listed per player; players who haven't submitted
yet just show "Not submitted yet." There's no lock or reveal condition on this page (unlike weekly
picks), since preseason predictions aren't meant to be kept secret from each other in the way
week-to-week ATS picks are before kickoff.

## Preseason setup (once, before the season starts)

Before players submit their preseason picks, there's nothing you need to pre-populate - the
`playoff_teams` and `heisman_candidates` tables get rows created automatically the first time any
player picks a team/candidate that doesn't exist yet (via `on conflict ... do nothing` upserts).
Once the real Playoff field and Heisman finalists/winner are known, go to `/admin/playoff` and
`/admin/heisman` to mark `made_field` / `had_bye` / `rounds_won` and `is_finalist` / `is_winner` on
the relevant rows - standings update immediately everywhere.
