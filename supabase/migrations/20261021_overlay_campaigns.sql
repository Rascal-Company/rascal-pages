-- Overlay: kampanjat, laskeutumissivut, variaatiot, profiilit ja tilastot (RAS-1101).
--
--   overlay_campaigns       kampanja = asiakkaan sivusto (origin), aktiivinen/ei
--   overlay_landing_pages   sivu + kohdennus + profiili + elementtilista (slots)
--   overlay_variants        variaatio (A/B) = arvot sloteittain; julkaistut jakavat liikenteen
--   overlay_profiles        organisaation kohderyhmäprofiilit (oma / Rascal AI / CRM-segmentti)
--   overlay_events          snippetin näyttö- ja konversiotapahtumat
--
-- overlay_variants.changes on snippetin lukema johdettu kenttä (slots × slot_values).
-- Vanhat sarakkeet target_origin / path_pattern / match jäävät toistaiseksi,
-- jotta ennen deployta ajossa oleva koodi toimii; poistetaan myöhemmin.

-- Profiilit ------------------------------------------------------------------

create table overlay_profiles (
  id uuid default gen_random_uuid() primary key,
  org_id uuid references public.users(id) on delete cascade not null,
  name text not null,
  description text not null default '',
  source text not null default 'custom' check (source in ('custom', 'rascal_ai', 'crm_segment')),
  source_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index overlay_profiles_org_id_idx on overlay_profiles(org_id);

alter table overlay_profiles enable row level security;

create policy "Org member can manage overlay profiles"
  on overlay_profiles for all
  using (
    exists (
      select 1 from org_members om
      where om.org_id = overlay_profiles.org_id
      and om.auth_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from org_members om
      where om.org_id = overlay_profiles.org_id
      and om.auth_user_id = auth.uid()
    )
  );

-- Kampanjat --------------------------------------------------------------------

create table overlay_campaigns (
  id uuid default gen_random_uuid() primary key,
  site_id uuid references sites(id) on delete cascade not null,
  name text not null,
  target_origin text not null,
  active boolean not null default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index overlay_campaigns_site_id_idx on overlay_campaigns(site_id);

alter table overlay_campaigns enable row level security;

create policy "Org member can manage overlay campaigns"
  on overlay_campaigns for all
  using (
    exists (
      select 1 from sites s
      join org_members om on om.org_id = s.user_id
      where s.id = overlay_campaigns.site_id
      and om.auth_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from sites s
      join org_members om on om.org_id = s.user_id
      where s.id = overlay_campaigns.site_id
      and om.auth_user_id = auth.uid()
    )
  );

-- Laskeutumissivut ---------------------------------------------------------

create table overlay_landing_pages (
  id uuid default gen_random_uuid() primary key,
  campaign_id uuid references overlay_campaigns(id) on delete cascade not null,
  name text not null,
  -- Tarkka polku tai jokerimerkki: "/", "/hinnasto", "/blogi/*", "*"
  path_pattern text not null default '/',
  -- { utm_term?, utm_campaign?, utm_content?, rp? } — tyhjä = kaikki kävijät
  match jsonb not null default '{}'::jsonb,
  profile_id uuid references overlay_profiles(id) on delete set null,
  -- [{ id, label, selector, type: text|image|link|hide, original }]
  slots jsonb not null default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index overlay_landing_pages_campaign_id_idx on overlay_landing_pages(campaign_id);

alter table overlay_landing_pages enable row level security;

create policy "Org member can manage overlay landing pages"
  on overlay_landing_pages for all
  using (
    exists (
      select 1 from overlay_campaigns c
      join sites s on s.id = c.site_id
      join org_members om on om.org_id = s.user_id
      where c.id = overlay_landing_pages.campaign_id
      and om.auth_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from overlay_campaigns c
      join sites s on s.id = c.site_id
      join org_members om on om.org_id = s.user_id
      where c.id = overlay_landing_pages.campaign_id
      and om.auth_user_id = auth.uid()
    )
  );

-- Variaatiot (overlay_variants) ---------------------------------------------

alter table overlay_variants
  add column landing_page_id uuid references overlay_landing_pages(id) on delete cascade,
  -- AI:lle annettava kulma, esim. "Selkeämpi ja yksinkertaisempi"
  add column prompt text not null default '',
  -- { [slot_id]: arvo } — piilotuksessa "1"
  add column slot_values jsonb not null default '{}'::jsonb;

-- Olemassa olevat variantit: kampanja per (sivusto, origin), laskeutumissivu
-- per variantti (slotit = variantin muutokset).
do $$
declare
  v record;
  campaign uuid;
  landing uuid;
begin
  for v in select * from overlay_variants where landing_page_id is null loop
    select id into campaign from overlay_campaigns
      where site_id = v.site_id and target_origin = v.target_origin
      limit 1;
    if campaign is null then
      insert into overlay_campaigns (site_id, name, target_origin, created_at, updated_at)
      values (v.site_id, regexp_replace(v.target_origin, '^https?://(www\.)?', ''), v.target_origin, v.created_at, v.updated_at)
      returning id into campaign;
    end if;

    insert into overlay_landing_pages (campaign_id, name, path_pattern, match, slots, created_at, updated_at)
    values (
      campaign,
      v.name,
      v.path_pattern,
      v.match,
      coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', c->>'id',
          'label', case c->>'type'
            when 'text' then 'Teksti ' || ord
            when 'image' then 'Kuva ' || ord
            when 'link' then 'Linkki ' || ord
            else 'Piilotus ' || ord end,
          'selector', c->>'selector',
          'type', c->>'type',
          'original', c->>'original'
        ) order by ord)
        from jsonb_array_elements(v.changes) with ordinality as t(c, ord)
      ), '[]'::jsonb),
      v.created_at,
      v.updated_at
    )
    returning id into landing;

    update overlay_variants set
      landing_page_id = landing,
      slot_values = coalesce((
        select jsonb_object_agg(
          c->>'id',
          case when c->>'type' = 'hide' then '1' else c->>'value' end
        )
        from jsonb_array_elements(v.changes) as t(c)
      ), '{}'::jsonb)
    where id = v.id;

    campaign := null;
  end loop;
end $$;

alter table overlay_variants alter column landing_page_id set not null;

create index overlay_variants_landing_page_id_idx on overlay_variants(landing_page_id);

-- Tapahtumat ja tilastot -----------------------------------------------------

create table overlay_events (
  id bigint generated always as identity primary key,
  variant_id uuid references overlay_variants(id) on delete cascade not null,
  visitor_id text not null,
  event_type text not null check (event_type in ('view', 'conversion')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index overlay_events_variant_id_idx on overlay_events(variant_id, event_type);

-- Kirjoitetaan ja luetaan vain palvelimelta service-rolella; ei policyjä.
alter table overlay_events enable row level security;

-- Variaatiokohtaiset tilastot kampanjalle. Kutsutaan palvelimelta
-- omistajuustarkistuksen jälkeen.
create function overlay_variant_stats(p_campaign_id uuid)
returns table (
  variant_id uuid,
  visitors bigint,
  views bigint,
  converted_visitors bigint
)
language sql
stable
set search_path = public
as $$
  select
    e.variant_id,
    count(distinct e.visitor_id) filter (where e.event_type = 'view') as visitors,
    count(*) filter (where e.event_type = 'view') as views,
    count(distinct e.visitor_id) filter (where e.event_type = 'conversion') as converted_visitors
  from overlay_events e
  join overlay_variants v on v.id = e.variant_id
  join overlay_landing_pages lp on lp.id = v.landing_page_id
  where lp.campaign_id = p_campaign_id
  group by e.variant_id;
$$;

revoke execute on function overlay_variant_stats(uuid) from public, anon, authenticated;
grant execute on function overlay_variant_stats(uuid) to service_role;
