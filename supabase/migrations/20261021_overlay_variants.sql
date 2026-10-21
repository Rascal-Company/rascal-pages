-- Overlay-variantit (RAS-1097): sisältömuutokset, jotka o.js-snippet upottaa
-- asiakkaan omalle sivulle kohdennuksen (utm_campaign / utm_content / rp)
-- perusteella. Variantti kuuluu Rascal Pages -sivustolle, ja omistajuus
-- periytyy sites.user_id -> org_members -ketjusta.

create table overlay_variants (
  id uuid default gen_random_uuid() primary key,
  site_id uuid references sites(id) on delete cascade not null,
  name text not null,
  -- Asiakkaan sivuston origin, esim. https://asiakas.fi
  target_origin text not null,
  -- Tarkka polku tai jokerimerkki: "/", "/hinnasto", "/blogi/*", "*"
  path_pattern text not null default '/',
  -- { utm_campaign?, utm_content?, rp? } — tyhjä = kaikki kävijät
  match jsonb not null default '{}'::jsonb,
  -- [{ id, selector, type: text|image|link|hide, value, original }]
  changes jsonb not null default '[]'::jsonb,
  active boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index overlay_variants_site_id_idx on overlay_variants(site_id);

alter table overlay_variants enable row level security;

create policy "Org member can manage overlay variants"
  on overlay_variants for all
  using (
    exists (
      select 1 from sites s
      join org_members om on om.org_id = s.user_id
      where s.id = overlay_variants.site_id
      and om.auth_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from sites s
      join org_members om on om.org_id = s.user_id
      where s.id = overlay_variants.site_id
      and om.auth_user_id = auth.uid()
    )
  );

-- Huom: julkinen /api/overlay/config lukee aktiiviset variantit service-role-
-- clientilla ja palauttaa vain valitun variantin muutokset, joten anonyymille
-- roolille ei tarvita select-policya (variantteja ei voi listata).
