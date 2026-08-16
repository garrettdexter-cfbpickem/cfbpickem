# CFB Pick'em

A private college football pick'em pool for a fixed roster of friends, built with Next.js 14
(App Router, TypeScript, Tailwind) and Supabase. Styled in LSU purple (`#461D7C`) and gold
(`#FDD023`).

## What it does

- **Weekly ATS picks.** Each week the admin curates which games count. Players pick winners
  against the spread; 1 point per correct pick.
- **Preseason Playoff Pool.** Before the season, each player free-texts the 12 teams they think
  will make the College Football Playoff. Scoring: 1 point per team that actually makes the
  field, +1 point per playoff round that team wins, and a team with a first-round bye is
  automatically credited 1 round the moment the bracket is set (so a bye team is worth 2 points
  before it plays a single game).
- **Preseason Heisman Pool.** Each player free-texts 5 Heisman candidates. Scoring: 1 point per
  pick who becomes a finalist (invited to New York), +1 more if that pick is the actual winner
  (2 points total for a correctly picked winner).
- **Combined standings.** One leaderboard = season-long weekly ATS points + playoff pool points +
  Heisman pool points, with all three sub-totals visible per player.
- **Admin console** (password-gated, no user accounts): pick which games count each week, lock in
  DraftKings spreads, record playoff field/bye/round results and Heisman finalist/winner results,
  and manage the player roster.

### Notable details in this build

- **Identity verification, not login.** There's still no real authentication - players just click
  their name - but both the weekly picks page and the preseason picks page now show a "You
  selected: {name}. Confirm this is you." screen before showing any pick data or forms, so a
  wrong click doesn't silently submit (or leak) someone else's picks.
- **Preseason link disappears once submitted.** The weekly picks page shows a "submit your
  preseason picks" link only until that player has actually submitted; after that it's replaced
  with a small "✓ Preseason picks submitted" badge and the link is gone for good (preseason picks
  are one-time, so there's nothing to click back into).
- **Public preseason picks overview** at `/picks/preseason` - anyone can view every player's
  submitted Playoff Pool and Heisman Pool picks at any time, no gating, no deadline. Players who
  haven't submitted yet just show a "Not submitted yet" card.
- **Fixed picks-reveal timing.** The weekly scoreboard (`/week/[week]`) only reveals everyone's
  picks once *every* player has submitted OR the first game of the week has kicked off - whichever
  comes first. Previously (in an earlier build) a player's picks became visible the moment *that*
  player submitted, which let late submitters copy early ones. Until the reveal condition is met,
  the page just shows a harmless "N of M players have submitted" count with no actual picks.
- **`/admin/players`** - a simple admin page for adding new players to the roster (like a coach
  adding to the depth chart), so the owner doesn't need players to self-register.
- **LSU purple/gold theme.** Purple header/nav/primary buttons, gold used only as an accent
  (badges like "Locked in!", nav hover states, highlight borders) - never as body text on white,
  since gold-on-white is hard to read.

## Tech stack

- Next.js 14 (App Router, TypeScript, Tailwind)
- Supabase Postgres, accessed only from server-side code via a service-role client
- [CollegeFootballData.com](https://collegefootballdata.com) (CFBD) REST API for games and
  DraftKings betting lines
- Deployed on Vercel, with two built-in Vercel Cron jobs (see below)

See [DEPLOY.md](./DEPLOY.md) for the full setup and deployment walkthrough.

## Local development

```bash
npm install
cp .env.example .env.local   # then fill in real values
npm run dev
```

You'll need a Supabase project (with `supabase/schema.sql` run against it) and a CFBD API key
before most pages will load real data - see DEPLOY.md.

## Weekly routine

1. **Curate the slate.** Visit `/admin/week/<week>`, click "Sync this week's games from CFBD",
   then check the games you want counted for that week's pick'em, and click "Save selection".
2. **Thursday, noon** - the `lock-lines` cron job automatically locks in the current DraftKings
   spread for every included game. (You can also click "Lock DraftKings lines now" manually on the
   admin week page.)
3. **Players submit picks once**, any time before the first included game of the week kicks off,
   at `/picks/<name>` (after confirming their identity). Picks can't be edited once submitted.
4. **Sunday, 4am** - the `score` cron job pulls final scores and computes ATS results for the week.
5. Standings update automatically at `/standings`.

## Admin: managing players (`/admin/players`)

The pool has a fixed-ish roster, but the owner can add new players at any time from
`/admin/players` (password-gated). Enter a name and click "Add Player" - the new player
immediately shows up as an option on the public `/picks` page, no restart or redeploy needed.

## Public: everyone's preseason picks (`/picks/preseason`)

This page lists every player and, once they've submitted, their Playoff Pool and Heisman Pool
picks - viewable by anyone, at any time, with no lock or reveal condition (unlike weekly picks,
preseason picks aren't meant to be secret in the way weekly ATS picks are before kickoff).
