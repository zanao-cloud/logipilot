-- ============================================================================
-- migrations-v4.sql — F7 roadmap: análise preditiva
-- Aditiva, idempotente.
-- ============================================================================

create table if not exists forecasts (
  id uuid default uuid_generate_v4() primary key,
  analysis_id uuid references analyses(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  metric_name text not null,
  unit text,
  horizon smallint not null default 3,
  method text not null check (method in ('linear', 'moving_avg', 'holt')),
  source_chart_id text,
  source_series_key text,
  historical jsonb not null,
  predictions jsonb not null,
  narrative text,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

create index if not exists forecasts_analysis_idx on forecasts(analysis_id, created_at desc);
create index if not exists forecasts_user_idx on forecasts(user_id);

alter table forecasts enable row level security;

drop policy if exists "Users view own forecasts" on forecasts;
create policy "Users view own forecasts" on forecasts for select
  using (auth.uid() = user_id);

drop policy if exists "Users insert own forecasts" on forecasts;
create policy "Users insert own forecasts" on forecasts for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users delete own forecasts" on forecasts;
create policy "Users delete own forecasts" on forecasts for delete
  using (auth.uid() = user_id);
