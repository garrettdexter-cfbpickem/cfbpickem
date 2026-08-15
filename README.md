# CFB Pick 'Em

A college football spread (ATS) pick 'em league for a group of friends —
no player logins, automatic scoring against the spread, plus preseason
Playoff Pool and Heisman Pool side games.

- Anyone with the link picks a name and submits picks for the week — once,
  before the first game of the week's admin-curated slate kicks off
- Spreads come from DraftKings and lock in every Thursday at noon
- An admin (password-protected) curates which games are pick'em-eligible
  each week, and enters Playoff/Heisman results as they're announced
- Games and final scores sync automatically from
  [CollegeFootballData.com](https://collegefootballdata.com)
- The combined standings (weekly ATS + Playoff Pool + Heisman Pool) update
  automatically as games finish

See **DEPLOY.md** for full setup and deployment instructions (Vercel +
Supabase, free tier).

## Local development

```
npm install
cp .env.example .env.local   # fill in your keys
npm run dev
```
