-- Budget app: one-time database setup.
-- Run this in the Supabase dashboard → SQL Editor → New query → paste → Run.
-- Same project as the Week Planner (ckaahrsyjeikfnqdbpbo).

create table public.budget (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb,
  updated_at timestamptz default now()
);

alter table public.budget enable row level security;

create policy "Users manage their own budget"
  on public.budget for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Realtime: lets the other phone update instantly when one of you edits
alter publication supabase_realtime add table public.budget;
