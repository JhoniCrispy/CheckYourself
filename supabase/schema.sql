-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query)

create table if not exists readings (
  id          uuid        default gen_random_uuid() primary key,
  user_id     uuid        references auth.users not null,
  created_at  timestamptz default now(),
  bp_systolic  int,
  bp_diastolic int,
  temperature  numeric(4,1),
  spo2         int,
  pulse        int,
  medication   boolean     default false
);

-- Each user can only read/write their own rows
alter table readings enable row level security;

create policy "Users manage own readings"
  on readings for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
