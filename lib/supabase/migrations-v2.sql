-- Organizations (transport companies)
create table if not exists organizations (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  owner_id uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

-- User profiles with role
create table if not exists user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid references organizations(id) on delete cascade,
  role text not null check (role in ('gestor', 'operador', 'motorista')),
  full_name text,
  phone text,
  vehicle_plate text,
  created_at timestamptz default now()
);

-- Add org to analyses
alter table analyses add column if not exists organization_id uuid references organizations(id) on delete cascade;

-- RLS
alter table organizations enable row level security;
alter table user_profiles enable row level security;

create policy "Members can view own org" on organizations
  for select using (
    id in (select organization_id from user_profiles where id = auth.uid())
  );

create policy "Gestores can update org" on organizations
  for update using (owner_id = auth.uid());

create policy "Users can view own profile" on user_profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on user_profiles
  for update using (auth.uid() = id);

create policy "Gestores/operadores can view team" on user_profiles
  for select using (
    organization_id in (
      select organization_id from user_profiles where id = auth.uid()
    )
  );

create policy "Gestores can insert team members" on user_profiles
  for insert with check (
    organization_id in (
      select organization_id from user_profiles
      where id = auth.uid() and role = 'gestor'
    )
  );
