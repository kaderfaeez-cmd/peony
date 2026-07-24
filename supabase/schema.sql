-- Peony — database schema
-- Run once in the Supabase SQL editor (Dashboard → SQL → New query → Run).
--
-- One row per person. The planner is a single JSON document because the app is
-- local-first: the device holds the truth and this row is its mirror. Merging is
-- done on the client, per record, so two devices never clobber each other.

create table if not exists public.planner_states (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  state      jsonb       not null,
  revision   bigint      not null default 0,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Row level security is the whole security model here: the browser talks to
-- Postgres directly with the public anon key, so the database itself must be the
-- thing that refuses to hand one person another person's planner.
alter table public.planner_states enable row level security;

drop policy if exists "read own planner" on public.planner_states;
create policy "read own planner"
  on public.planner_states for select
  using (auth.uid() = user_id);

drop policy if exists "create own planner" on public.planner_states;
create policy "create own planner"
  on public.planner_states for insert
  with check (auth.uid() = user_id);

drop policy if exists "update own planner" on public.planner_states;
create policy "update own planner"
  on public.planner_states for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "delete own planner" on public.planner_states;
create policy "delete own planner"
  on public.planner_states for delete
  using (auth.uid() = user_id);

-- Keep updated_at honest even if a client forgets to send it.
create or replace function public.touch_planner_state()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists planner_states_touch on public.planner_states;
create trigger planner_states_touch
  before update on public.planner_states
  for each row execute function public.touch_planner_state();

-- A planner document is a few hundred kilobytes at most; this is a guard rail
-- against a runaway client, not a business rule.
alter table public.planner_states
  drop constraint if exists planner_states_size_guard;
alter table public.planner_states
  add constraint planner_states_size_guard
  check (pg_column_size(state) < 5 * 1024 * 1024);
