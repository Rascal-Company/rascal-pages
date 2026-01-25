-- Phase 1: Analytics & Lead Capture Tables
-- Execute this in Supabase SQL Editor

-- Table: leads (form submissions)
create table leads (
  id uuid default gen_random_uuid() primary key,
  site_id uuid references sites(id) on delete cascade not null,
  email text not null,
  name text,
  data jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: analytics_events (button clicks, page views)
create table analytics_events (
  id uuid default gen_random_uuid() primary key,
  site_id uuid references sites(id) on delete cascade not null,
  event_type text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for performance
create index leads_site_id_idx on leads(site_id);
create index leads_created_at_idx on leads(created_at desc);
create index analytics_events_site_id_idx on analytics_events(site_id);
create index analytics_events_created_at_idx on analytics_events(created_at desc);
create index analytics_events_type_idx on analytics_events(event_type);

-- Row Level Security
alter table leads enable row level security;
alter table analytics_events enable row level security;

-- Policy: Anyone can insert leads/events for published sites
create policy "Allow public insert to leads for published sites"
  on leads for insert
  with check (
    exists (
      select 1 from sites s
      join pages p on p.site_id = s.id
      where s.id = site_id
      and p.published = true
      and p.slug = 'home'
    )
  );

create policy "Allow public insert to analytics for published sites"
  on analytics_events for insert
  with check (
    exists (
      select 1 from sites s
      join pages p on p.site_id = s.id
      where s.id = site_id
      and p.published = true
      and p.slug = 'home'
    )
  );

-- Policy: Only site owners can read their data
create policy "Site owner can read leads"
  on leads for select
  using (
    exists (
      select 1 from sites s
      join org_members om on om.org_id = s.user_id
      where s.id = site_id
      and om.auth_user_id = auth.uid()
    )
  );

create policy "Site owner can read analytics"
  on analytics_events for select
  using (
    exists (
      select 1 from sites s
      join org_members om on om.org_id = s.user_id
      where s.id = site_id
      and om.auth_user_id = auth.uid()
    )
  );
