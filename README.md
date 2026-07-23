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
| Landing | `/` | Hero over the looping flower field |
| Dashboard | `/home` | Today, schedule, deadlines, progress rings, habits, quote, weather |
| Daily planner | `/today` | Morning / afternoon / evening, drag to reorder or move between parts |
| Weekly planner | `/week` | Seven bands, drag a task to another day, weekly reflection |
| Monthly planner | `/month` | Full calendar, drag between days, deadline markers, monthly reflection |
| Tasks | `/tasks` | Every task, filtered by state and category; archive and history |
| Habits | `/habits` | Streaks, weekly targets, month heatmap |
| Goals | `/goals` | Short and long term, milestones, celebration when the last one lands |
| Notes | `/notes` | Markdown subset with live checkboxes, pinning and search |
| Journal | `/journal` | Mood, gratitude, free writing, month mood strip |
| Focus | `/focus` | Deadline-driven pomodoro and a full-screen focus mode |
| Settings | `/settings` | Theme, motion, reminders, weather, categories, export/import |

Global: `/` or `⌘K` searches everything, `C` adds a task, single letters navigate,
`?` lists the keys. Deleting anything offers an undo.

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
- **Opening**: the landing page is the front board of a book. Tapping it hinges
  the cover open on the left edge to reveal the first page, and the planner loads
  behind it.
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

`LocalStorageRepository` is the only implementation today. Adding Supabase means
writing a second one and passing it to `<PlannerProvider repository={…} />` — no
component, hook or reducer changes, because the entity shapes already map onto
tables.

## Not included

Photo uploads, file attachments and a vision-board page were left out: storing
images in `localStorage` blows the 5 MB quota, so those want the Supabase step (or
IndexedDB) first. Reminders fire while the app is open — background delivery needs
a service worker and a push endpoint.
