-- ============================================================================
-- migrations-delta.sql — só o delta v3 + v4. Ordem corrigida, sem DO blocks.
-- Cole tudo no SQL Editor e clique Run.
-- ============================================================================

-- 1) Tabela projects ---------------------------------------------------------
create table if not exists projects (
  id uuid default uuid_generate_v4() primary key,
  organization_id uuid references organizations(id) on delete cascade not null,
  name text not null,
  client_name text,
  created_at timestamptz default now()
);

alter table projects enable row level security;

drop policy if exists "Members view org projects" on projects;
create policy "Members view org projects" on projects for select
  using (
    organization_id in (
      select organization_id from user_profiles where id = auth.uid()
    )
  );

drop policy if exists "Gestor manages org projects" on projects;
create policy "Gestor manages org projects" on projects for all
  using (
    organization_id in (
      select organization_id from user_profiles
      where id = auth.uid() and role = 'gestor'
    )
  );

-- 2) Tabela notifications ----------------------------------------------------
create table if not exists notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null,
  payload jsonb default '{}',
  read_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists notifications_user_unread_idx on notifications(user_id, read_at);
create index if not exists notifications_user_created_idx on notifications(user_id, created_at desc);

alter table notifications enable row level security;

drop policy if exists "Users view own notifications" on notifications;
create policy "Users view own notifications" on notifications for select
  using (auth.uid() = user_id);

drop policy if exists "Users mark own notifications" on notifications;
create policy "Users mark own notifications" on notifications for update
  using (auth.uid() = user_id);

-- 3) Tabela forecasts --------------------------------------------------------
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

-- 4) Colunas novas em analyses (FK inline; tabelas referenciadas já existem) -
alter table analyses add column if not exists tags text[] default '{}';
alter table analyses add column if not exists consent_ai_at timestamptz;
alter table analyses add column if not exists progress_pct smallint default 0;
alter table analyses add column if not exists progress_stage text;
alter table analyses add column if not exists project_id uuid references projects(id) on delete set null;
alter table analyses add column if not exists driver_id uuid references user_profiles(id) on delete set null;
alter table analyses add column if not exists period_start date;
alter table analyses add column if not exists period_end date;

create index if not exists analyses_tags_gin on analyses using gin(tags);
create index if not exists analyses_project_idx on analyses(project_id);
create index if not exists analyses_driver_idx on analyses(driver_id);

-- 5) Coluna nova em chat_messages --------------------------------------------
alter table chat_messages add column if not exists metadata jsonb default '{}';
