-- ============================================================================
-- migrations-all-safe.sql — Consolidação 100% idempotente
-- Pode ser executado quantas vezes precisar, em qualquer estado do banco.
-- Inclui: v1 (base) + v2 (orgs) + v3 (UX/projetos/notif) + v4 (forecasts).
-- ============================================================================

create extension if not exists "uuid-ossp";

-- ============================================================================
-- v1: base — analyses + chat_messages + storage
-- ============================================================================

create table if not exists analyses (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'error')),
  files jsonb default '[]',
  result jsonb,
  error_message text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists chat_messages (
  id uuid default uuid_generate_v4() primary key,
  analysis_id uuid references analyses(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz default now()
);

alter table analyses enable row level security;
alter table chat_messages enable row level security;

drop policy if exists "Users can view own analyses" on analyses;
create policy "Users can view own analyses" on analyses
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own analyses" on analyses;
create policy "Users can insert own analyses" on analyses
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own analyses" on analyses;
create policy "Users can update own analyses" on analyses
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete own analyses" on analyses;
create policy "Users can delete own analyses" on analyses
  for delete using (auth.uid() = user_id);

drop policy if exists "Users can view own messages" on chat_messages;
create policy "Users can view own messages" on chat_messages
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own messages" on chat_messages;
create policy "Users can insert own messages" on chat_messages
  for insert with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public) values ('analysis-files', 'analysis-files', false)
on conflict do nothing;

-- Policies do bucket analysis-files foram criadas na migration v1 original e
-- são preservadas. Não recriamos aqui porque o parser do SQL Editor às vezes
-- interpreta o cast PostgreSQL `::text` como bind parameter.

-- ============================================================================
-- v2: organizações + perfis com role
-- ============================================================================

create table if not exists organizations (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  owner_id uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid references organizations(id) on delete cascade,
  role text not null check (role in ('gestor', 'operador', 'motorista')),
  full_name text,
  phone text,
  vehicle_plate text,
  created_at timestamptz default now()
);

alter table analyses add column if not exists organization_id uuid references organizations(id) on delete cascade;

alter table organizations enable row level security;
alter table user_profiles enable row level security;

drop policy if exists "Members can view own org" on organizations;
create policy "Members can view own org" on organizations
  for select using (
    id in (select organization_id from user_profiles where id = auth.uid())
  );

drop policy if exists "Gestores can update org" on organizations;
create policy "Gestores can update org" on organizations
  for update using (owner_id = auth.uid());

drop policy if exists "Users can view own profile" on user_profiles;
create policy "Users can view own profile" on user_profiles
  for select using (auth.uid() = id);

drop policy if exists "Users can update own profile" on user_profiles;
create policy "Users can update own profile" on user_profiles
  for update using (auth.uid() = id);

drop policy if exists "Gestores/operadores can view team" on user_profiles;
create policy "Gestores/operadores can view team" on user_profiles
  for select using (
    organization_id in (
      select organization_id from user_profiles where id = auth.uid()
    )
  );

drop policy if exists "Gestores can insert team members" on user_profiles;
create policy "Gestores can insert team members" on user_profiles
  for insert with check (
    organization_id in (
      select organization_id from user_profiles
      where id = auth.uid() and role = 'gestor'
    )
  );

-- ============================================================================
-- v3: UX (tags, consent, progress) + projetos + vínculos + notificações
-- ============================================================================

alter table analyses
  add column if not exists tags text[] default '{}',
  add column if not exists consent_ai_at timestamptz,
  add column if not exists progress_pct smallint default 0,
  add column if not exists progress_stage text;

create index if not exists analyses_tags_gin on analyses using gin(tags);

alter table chat_messages
  add column if not exists metadata jsonb default '{}';

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

alter table analyses
  add column if not exists project_id uuid references projects(id) on delete set null,
  add column if not exists driver_id uuid references user_profiles(id) on delete set null,
  add column if not exists period_start date,
  add column if not exists period_end date;

create index if not exists analyses_project_idx on analyses(project_id);
create index if not exists analyses_driver_idx on analyses(driver_id);

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

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'notifications'
  ) then
    execute 'alter publication supabase_realtime add table notifications';
  end if;
end $$;

-- ============================================================================
-- v4: forecasts (análise preditiva)
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
