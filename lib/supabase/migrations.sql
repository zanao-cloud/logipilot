-- Enable RLS
create extension if not exists "uuid-ossp";

-- Analyses table
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

-- Chat messages table
create table if not exists chat_messages (
  id uuid default uuid_generate_v4() primary key,
  analysis_id uuid references analyses(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz default now()
);

-- RLS Policies
alter table analyses enable row level security;
alter table chat_messages enable row level security;

create policy "Users can view own analyses" on analyses
  for select using (auth.uid() = user_id);

create policy "Users can insert own analyses" on analyses
  for insert with check (auth.uid() = user_id);

create policy "Users can update own analyses" on analyses
  for update using (auth.uid() = user_id);

create policy "Users can delete own analyses" on analyses
  for delete using (auth.uid() = user_id);

create policy "Users can view own messages" on chat_messages
  for select using (auth.uid() = user_id);

create policy "Users can insert own messages" on chat_messages
  for insert with check (auth.uid() = user_id);

-- Storage bucket for analysis files
insert into storage.buckets (id, name, public) values ('analysis-files', 'analysis-files', false)
on conflict do nothing;

create policy "Users can upload own files" on storage.objects
  for insert with check (bucket_id = 'analysis-files' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can view own files" on storage.objects
  for select using (bucket_id = 'analysis-files' and auth.uid()::text = (storage.foldername(name))[1]);
