# Peony

A calm personal planner — days, weeks, months, habits, goals, notes and reflection
in one unhurried place. Everything is stored on the device; there is no account and
no server.

## Running it

```bash
npm install
npm run dev
```

Then open <http://localhost:3000>.

## What's in it

| Area | Route | Notes |
| --- | --- | --- |
| Cover | `/` | Name, "a quiet planner", and whose planner it is — tap to open |
| Dashboard | `/home` | Today, schedule, deadlines, progress rings, habits, quote, weather |
| Daily planner | `/today` | Morning / afternoon / evening, drag to reorder or move between parts |
| Weekly planner | `/week` | Seven bands, drag a task to another day, weekly reflection |
| Monthly planner | `/month` | Full calendar, drag between days, deadline markers, monthly reflection |
| Tasks | `/tasks` | Every task, filtered by state and category; archive and history |
| Kitchen | `/kitchen` | Weekly menu with suggestions, plus a shopping list grouped by aisle |
| Habits | `/habits` | Streaks, weekly targets, month heatmap |
| Goals | `/goals` | Short and long term, milestones, celebration when the last one lands |
| Notes | `/notes` | Markdown subset with live checkboxes, pinning and search |
| Journal | `/journal` | Mood, gratitude, free writing, month mood strip |
| Focus | `/focus` | Deadline-driven pomodoro and a full-screen focus mode |
| Settings | `/settings` | Theme, motion, reminders, weather, categories, export/import |

Global: `/` or `⌘K` searches everything, `C` adds a task, single letters navigate,
`?` lists the keys. Deleting anything offers an undo.

## Turning on sync (optional)

Peony works completely without an account — this only adds the same planner on a
second device. It needs a free Supabase project; nothing else changes.

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor → New query**, paste [`supabase/schema.sql`](supabase/schema.sql),
   and run it. That creates one table and its row-level-security policies.
3. In **Authentication → URL Configuration**, set the Site URL to your deployed
   address (and add `http://localhost:3000` for local work).
4. Copy **Project Settings → API → Project URL** and the **anon public** key into
   `.env.local` (see [`.env.example`](.env.example)) and into Vercel's environment
   variables. Redeploy.

Once the keys are set, the **cover asks to sign in or create an account on open**
— with a "just use it on this device" escape that keeps everything local. Sign in
on the other device and the two copies merge. (Without keys, the cover skips
straight to the name prompt and the app stays local-only.)

The **anon key belongs in the browser** — every row is guarded by row-level
security, so it only ever returns the signed-in person's own planner. The
`service_role` key has no place in this app; don't add it.

> Already paying for Neon? This app doesn't need it. The planner is one JSON
> document per user, which Supabase's free tier covers comfortably, and Supabase
> Auth is what makes the login work. If you would rather keep the data in Neon,
> only `lib/store/sync.tsx` has to change — it is the single place that talks to
> the database.

### How sync behaves

- The device is the source of truth. Everything is written to `localStorage`
  first, so the app is instant and works offline.
- Signing in **pulls before it pushes**, so a fresh phone can never overwrite an
  established planner with an empty one.
- Merging is per record, not per document: if the phone added a task while the
  laptop ticked a habit, both survive. The newer edit of the same record wins.
- Deletions travel as tombstones, so a deleted task doesn't come back from the
  other device — and an edit made *after* a delete counts as a deliberate
  restore. `npm run test:merge` covers these cases.

## Design notes

- **Palette**: the five roses (`#FFE5EC #FFC2D1 #FFB3C6 #FF8FAB #FB6F92`) are a
  *surface* palette — fills, rings, dots, buttons. Rose-coloured *text* uses
  `--rose-ink` (`#8a3f5a` on paper, `#ff8fab` at night), a deepened member of the
  same hue, because `#FB6F92` on white is only 2.6:1. Every ink weight clears
  4.5:1 in both themes, and rose buttons carry ink-coloured labels rather than
  white ones.
- **Type**: Fraunces (soft, wonky optical serif) for display and numerals, Plus
  Jakarta Sans for text.
- **Background**: a 720p loop of peonies in golden-hour light, generated with
  OpenArt (PixVerse V6). It plays unblurred behind a directional paper wash —
  near-solid under the reading column, clear on the right. Mounts after first
  paint on every screen size; skipped under reduced-motion or Save-Data.
  `public/media/atmosphere.mp4`.
- **Opening**: the landing page is the front board of a book, carrying only the
  name, the line "a quiet planner", and whose planner it is. First run asks for a
  name and keeps it in settings — there is no account, because there is no server
  to hold one; the cover personalises locally. Tapping the board hinges it open on
  the left edge to reveal the first page, and the planner loads behind it.
- **Motion**: Framer Motion, kept to opacity and transform. Calm-motion mode in
  settings removes all of it; `prefers-reduced-motion` is honoured everywhere.

## Architecture

```
src/
  app/                 routes; the (app) group carries the shell + page transitions
  components/
    atmosphere/        background video, grain
    layout/            page header, section, surface
    search/            command palette
    shell/             nav rail, top bar, shortcuts, UI context
    ui/                button, checkbox, field, sheet, toast, ring, toggle…
  features/
    tasks/ planner/ habits/ goals/ calendar/ reflect/ weather/ landing/
  hooks/               reminders, daily celebration
  lib/
    store/             repository, actions, selectors, provider
    date.ts markdown.tsx quotes.ts cn.ts id.ts
  types/               the whole domain model
```

State lives in a small external store bound to React with `useSyncExternalStore`.
Every mutation is a pure `(state, args) => state` function in
`lib/store/actions.ts`, and persistence sits behind one interface:

```ts
export interface PlannerRepository {
  load(): Promise<PlannerState | null>;
  save(state: PlannerState): Promise<void>;
}
```

`LocalStorageRepository` is the only implementation, and it stays that way:
remote sync is a *mirror* layered on top (`lib/store/sync.tsx`) rather than a
replacement, which is what keeps the app instant and offline-capable.

## Not included

Photo uploads, file attachments and a vision-board page were left out: storing
images in `localStorage` blows the 5 MB quota, so those want the Supabase step (or
IndexedDB) first. Reminders fire while the app is open — background delivery needs
a service worker and a push endpoint.
