-- Sivuston paketti ja laskutustila (RAS-1168). Oma taulu sites-sarakkeiden
-- sijaan, jotta billing-kentät eivät vuoda julkiseen sites-hakuun. Omistaja-
-- organisaation jäsenet lukevat; kirjoitus vain palvelimelta (service role:
-- Stripe-webhook ja julkaisutoiminnot).

do $$ begin
  create type site_plan_tier as enum ('draft', 'basic', 'rascal');
exception when duplicate_object then null; end $$;

-- comped = pysyvästi ilmainen ilman Stripe-tilausta (maksumuuria edeltäneet sivustot).
do $$ begin
  create type site_billing_status as enum ('none', 'active', 'past_due', 'canceled', 'comped');
exception when duplicate_object then null; end $$;

create table if not exists site_plans (
  site_id uuid primary key references sites (id) on delete cascade,
  tier site_plan_tier not null default 'draft',
  billing_status site_billing_status not null default 'none',
  stripe_customer_id text,
  stripe_subscription_id text unique,
  current_period_end timestamptz,
  past_due_since timestamptz,
  updated_at timestamptz not null default now()
);

alter table site_plans enable row level security;

-- Backfill (päätös 28.10.2026): nykyiset sivustot eivät piiloudu maksumuurin
-- tullessa. Rascal-oikeuden orgit → rascal; muut julkaistut → pysyvästi
-- ilmainen basic (comped); julkaisemattomat → draft.
insert into site_plans (site_id, tier, billing_status)
select
  s.id,
  (case
    when exists (
      select 1 from organization_products op
      join products p on p.id = op.product_id
      where op.org_id = s.user_id
        and p.slug = 'rascal-pages'
        and op.is_enabled
        and coalesce(op.plan_tier, '') <> 'trial'
    ) then 'rascal'
    when exists (select 1 from pages pg where pg.site_id = s.id and pg.published) then 'basic'
    else 'draft'
  end)::site_plan_tier,
  (case
    when exists (
      select 1 from organization_products op
      join products p on p.id = op.product_id
      where op.org_id = s.user_id
        and p.slug = 'rascal-pages'
        and op.is_enabled
        and coalesce(op.plan_tier, '') <> 'trial'
    ) then 'none'
    when exists (select 1 from pages pg where pg.site_id = s.id and pg.published) then 'comped'
    else 'none'
  end)::site_billing_status
from sites s
on conflict (site_id) do nothing;

create policy "Org members can read their site plans"
  on site_plans for select
  using (
    site_id in (
      select s.id from sites s
      join org_members m on m.org_id = s.user_id
      where m.auth_user_id = auth.uid()
    )
  );
