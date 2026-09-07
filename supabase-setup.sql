-- Key-value store for all app state (budget, checklists, selected page/day)
create table if not exists kv (
  key   text primary key,
  value jsonb not null
);

-- Documents table
create table if not exists documents (
  id          uuid primary key default gen_random_uuid(),
  label       text not null,
  sublabel    text not null default '',
  category    text not null default 'payment',
  filename    text not null,
  created_at  timestamptz default now()
);

-- Storage bucket for document files
insert into storage.buckets (id, name, public)
values ('docs', 'docs', true)
on conflict (id) do nothing;

-- Allow public read of docs bucket
create policy "Public read docs" on storage.objects
  for select using (bucket_id = 'docs');

-- Allow all operations (single-user personal app, no auth needed)
create policy "Allow all on kv" on kv
  for all using (true) with check (true);

create policy "Allow all on documents" on documents
  for all using (true) with check (true);

create policy "Allow upload to docs" on storage.objects
  for insert with check (bucket_id = 'docs');

create policy "Allow delete from docs" on storage.objects
  for delete using (bucket_id = 'docs');

-- Enable RLS (required for policies to apply)
alter table kv        enable row level security;
alter table documents enable row level security;
