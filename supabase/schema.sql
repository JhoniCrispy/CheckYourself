-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query)
-- Safe to re-run: all statements use IF NOT EXISTS / IF NOT EXISTS guards

-- ─── CORE READINGS TABLE ──────────────────────────────────────────────────────

create table if not exists readings (
  id           uuid        default gen_random_uuid() primary key,
  user_id      uuid        references auth.users not null,
  created_at   timestamptz default now(),
  bp_systolic  int,
  bp_diastolic int,
  temperature  numeric(4,1),
  spo2         int,
  pulse        int,
  medication   boolean     default false,  -- legacy boolean, kept for old records
  note         text                        -- free-text notes per reading
);

alter table readings enable row level security;

create policy "Users manage own readings"
  on readings for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ─── MEDICATIONS (custom named pills per user) ────────────────────────────────

create table if not exists medications (
  id         uuid        default gen_random_uuid() primary key,
  user_id    uuid        references auth.users not null,
  name       text        not null,
  created_at timestamptz default now()
);

alter table medications enable row level security;

create policy "Users manage own medications"
  on medications for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ─── READING ↔ MEDICATION JUNCTION ───────────────────────────────────────────
-- Records which pills were taken for each reading

create table if not exists reading_medications (
  reading_id    uuid references readings(id)    on delete cascade,
  medication_id uuid references medications(id) on delete cascade,
  primary key (reading_id, medication_id)
);

alter table reading_medications enable row level security;

-- Users can manage junction rows for their own readings
create policy "Users manage own reading_medications"
  on reading_medications for all
  using (
    exists (
      select 1 from readings
      where id = reading_id and user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from readings
      where id = reading_id and user_id = auth.uid()
    )
  );


-- ─── CUSTOM METRIC TYPES (user-defined measurement types) ─────────────────────
-- e.g. "Blood Glucose", unit "mmol/L", normal range 4.0–7.0

create table if not exists metric_types (
  id         uuid        default gen_random_uuid() primary key,
  user_id    uuid        references auth.users not null,
  name       text        not null,
  unit       text,
  normal_min numeric,
  normal_max numeric,
  created_at timestamptz default now()
);

alter table metric_types enable row level security;

create policy "Users manage own metric_types"
  on metric_types for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ─── CUSTOM MEASUREMENTS (value per reading per metric type) ──────────────────

create table if not exists custom_measurements (
  id             uuid    default gen_random_uuid() primary key,
  reading_id     uuid    references readings(id)     on delete cascade,
  metric_type_id uuid    references metric_types(id) on delete cascade,
  value          numeric not null
);

alter table custom_measurements enable row level security;

create policy "Users manage own custom_measurements"
  on custom_measurements for all
  using (
    exists (
      select 1 from readings
      where id = reading_id and user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from readings
      where id = reading_id and user_id = auth.uid()
    )
  );


-- ─── MIGRATION: add note column if upgrading from old schema ──────────────────
-- Safe to run even if column already exists (Postgres 9.6+)
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'readings' and column_name = 'note'
  ) then
    alter table readings add column note text;
  end if;
end $$;
