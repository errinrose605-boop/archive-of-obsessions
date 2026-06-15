-- Run this once in the Supabase SQL Editor after creating the project.
-- It prepares private, per-account cloud snapshots without changing local saves.

create table if not exists public.journal_snapshots (
  user_id uuid primary key references auth.users(id) on delete cascade,
  archive_data jsonb not null,
  archive_version integer not null default 1,
  updated_at timestamptz not null default now()
);

alter table public.journal_snapshots enable row level security;

create policy "Owners can read their journal"
on public.journal_snapshots for select
using (auth.uid() = user_id);

create policy "Owners can create their journal"
on public.journal_snapshots for insert
with check (auth.uid() = user_id);

create policy "Owners can update their journal"
on public.journal_snapshots for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Owners can delete their journal"
on public.journal_snapshots for delete
using (auth.uid() = user_id);

