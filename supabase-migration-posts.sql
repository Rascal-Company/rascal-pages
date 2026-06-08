-- Blog posts for personal-brand sites
-- Execute this in Supabase SQL Editor

create table posts (
  id uuid default gen_random_uuid() primary key,
  site_id uuid references sites(id) on delete cascade not null,
  slug text not null,
  title text not null,
  excerpt text,
  content text not null default '',
  cover_image text,
  published boolean not null default false,
  published_at timestamp with time zone,
  seo_title text,
  seo_description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (site_id, slug)
);

-- Indexes for performance
create index posts_site_id_idx on posts(site_id);
create index posts_published_idx on posts(site_id, published, published_at desc);

-- Keep updated_at fresh on every update
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger posts_set_updated_at
  before update on posts
  for each row execute function set_updated_at();

-- Row Level Security
alter table posts enable row level security;

-- Anyone can read published posts that belong to a published site
create policy "Public can read published posts"
  on posts for select
  using (
    published = true
    and exists (
      select 1 from sites s
      join pages p on p.site_id = s.id
      where s.id = site_id
      and p.published = true
      and p.slug = 'home'
    )
  );

-- Site owners can read all of their posts (drafts included)
create policy "Site owner can read posts"
  on posts for select
  using (
    exists (
      select 1 from sites s
      join org_members om on om.org_id = s.user_id
      where s.id = site_id
      and om.auth_user_id = auth.uid()
    )
  );

-- Site owners can manage their posts
create policy "Site owner can insert posts"
  on posts for insert
  with check (
    exists (
      select 1 from sites s
      join org_members om on om.org_id = s.user_id
      where s.id = site_id
      and om.auth_user_id = auth.uid()
    )
  );

create policy "Site owner can update posts"
  on posts for update
  using (
    exists (
      select 1 from sites s
      join org_members om on om.org_id = s.user_id
      where s.id = site_id
      and om.auth_user_id = auth.uid()
    )
  );

create policy "Site owner can delete posts"
  on posts for delete
  using (
    exists (
      select 1 from sites s
      join org_members om on om.org_id = s.user_id
      where s.id = site_id
      and om.auth_user_id = auth.uid()
    )
  );

-- Note: the n8n ingestion endpoint uses the service-role key, which bypasses
-- RLS, so no public insert policy is required for automated publishing.
