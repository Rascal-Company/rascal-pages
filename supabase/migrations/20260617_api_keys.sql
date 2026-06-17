-- Org-scoped API keys for the content ingestion endpoint (/api/posts).
create table api_keys (
  id uuid default gen_random_uuid() primary key,
  org_id uuid references public.users(id) on delete cascade not null,
  name text not null,
  key_hash text not null unique,
  key_prefix text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_used_at timestamp with time zone,
  revoked_at timestamp with time zone
);

create index api_keys_org_id_idx on api_keys(org_id);
create index api_keys_key_hash_idx on api_keys(key_hash);

alter table api_keys enable row level security;

create policy "Org member can read api keys"
  on api_keys for select
  using (exists (select 1 from org_members om
    where om.org_id = api_keys.org_id and om.auth_user_id = auth.uid()));

create policy "Org member can insert api keys"
  on api_keys for insert
  with check (exists (select 1 from org_members om
    where om.org_id = api_keys.org_id and om.auth_user_id = auth.uid()));

create policy "Org member can update api keys"
  on api_keys for update
  using (exists (select 1 from org_members om
    where om.org_id = api_keys.org_id and om.auth_user_id = auth.uid()));

create policy "Org member can delete api keys"
  on api_keys for delete
  using (exists (select 1 from org_members om
    where om.org_id = api_keys.org_id and om.auth_user_id = auth.uid()));
