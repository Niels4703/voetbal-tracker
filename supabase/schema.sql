create table if not exists public.match_state (
  id text primary key,
  players jsonb not null default '[]'::jsonb,
  guest_count integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.match_state enable row level security;

create policy "allow all access"
on public.match_state
for all
using (true)
with check (true);
