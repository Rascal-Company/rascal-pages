-- Sivuston paketti ja laskutustila (RAS-1168). Oma taulu sites-sarakkeiden
-- sijaan, jotta billing-kentät eivät vuoda julkiseen sites-hakuun. Omistaja-
-- organisaation jäsenet lukevat; kirjoitus vain palvelimelta (service role:
-- Stripe-webhook ja julkaisutoiminnot).

do $$ begin
  create type site_plan_tier as enum ('draft', 'basic', 'rascal');
exception when duplicate_object then null; end $$;

do $$ begin
  create type site_billing_status as enum ('none', 'active', 'past_due', 'canceled');
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

create policy "Org members can read their site plans"
  on site_plans for select
  using (
    site_id in (
      select s.id from sites s
      join org_members m on m.org_id = s.user_id
      where m.auth_user_id = auth.uid()
    )
  );
