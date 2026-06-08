-- Site registry extension for the repo-per-site model (Scope 2: provisioning).
-- Each customer site is a standalone GitHub repo deployed as its own Vercel
-- project. The control plane records the mapping here so it can manage,
-- re-deploy, and hand off the site later.
--
-- Run in the Supabase SQL editor.

alter table sites
  add column if not exists repo_name text,
  add column if not exists repo_url text,
  add column if not exists vercel_project_id text,
  add column if not exists provision_status text not null default 'pending';

comment on column sites.repo_name is 'GitHub repo name, e.g. rascal-site-<subdomain>';
comment on column sites.repo_url is 'GitHub repo HTML URL for this customer site';
comment on column sites.vercel_project_id is 'Vercel project id deploying this repo';
comment on column sites.provision_status is
  'Lifecycle: pending | repo_created | project_created | domain_assigned | deployed | live | failed';

create index if not exists sites_provision_status_idx on sites(provision_status);
create unique index if not exists sites_repo_name_key on sites(repo_name) where repo_name is not null;
