create table public.timesheets (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  job_reference text not null,
  file_link text not null,
  tool_used text not null,
  time_spent text not null,
  synced_to_sheet boolean default false
);

alter table public.timesheets enable row level security;

create policy "Anyone can insert timesheets"
on public.timesheets for insert
to anon
with check (true);

create policy "Service role can read"
on public.timesheets for select
to service_role
using (true);

create policy "Service role can update sync status"
on public.timesheets for update
to service_role
using (true);