-- ============================================================================
-- migrations-v3.sql — F1 (UX) + F2 (projetos/comparação) + F4 (notificações)
-- Aditiva, idempotente. Pode ser re-executada com segurança.
-- ============================================================================

-- ------------------------- F1: análises ricas -------------------------------
alter table analyses
  add column if not exists tags text[] default '{}',
  add column if not exists consent_ai_at timestamptz,
  add column if not exists progress_pct smallint default 0,
  add column if not exists progress_stage text;

create index if not exists analyses_tags_gin on analyses using gin(tags);

alter table chat_messages
  add column if not exists metadata jsonb default '{}';

-- ------------------------- F2: projetos + vínculos --------------------------
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

-- ------------------------- F4: notificações ---------------------------------
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

-- Habilitar Realtime na tabela notifications
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'notifications'
  ) then
    execute 'alter publication supabase_realtime add table notifications';
  end if;
end $$;
