-- Itineraries table
create table if not exists itineraries (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade,
  name         text not null,
  destination  text not null default '',
  date_from    text not null default '',
  date_to      text not null default '',
  cover_emoji  text not null default '✈',
  created_at   timestamptz default now()
);
alter table itineraries enable row level security;
create policy "Users own itineraries" on itineraries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Per-trip key-value store (replaces global kv for trip data)
create table if not exists trip_kv (
  itinerary_id uuid references itineraries(id) on delete cascade,
  key          text not null,
  value        jsonb not null,
  primary key (itinerary_id, key)
);
alter table trip_kv enable row level security;
create policy "Users own trip_kv" on trip_kv
  for all using (
    exists (select 1 from itineraries where id = itinerary_id and user_id = auth.uid())
  ) with check (
    exists (select 1 from itineraries where id = itinerary_id and user_id = auth.uid())
  );

-- Add itinerary_id to documents
alter table documents add column if not exists itinerary_id uuid references itineraries(id) on delete cascade;
create policy "Users own documents" on documents
  for all using (
    itinerary_id is null or
    exists (select 1 from itineraries where id = itinerary_id and user_id = auth.uid())
  ) with check (
    exists (select 1 from itineraries where id = itinerary_id and user_id = auth.uid())
  );
