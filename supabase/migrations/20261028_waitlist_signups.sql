-- Rascal Pages -waitlist etusivulle (RAS-1167). Jokainen ilmoittautuja saa
-- oman referral-koodin; kaverin kutsuminen nostaa jonossa. Taulu on vain
-- palvelimen (service role) käytössä: RLS päällä ilman politiikoita, joten
-- anon- ja authenticated-roolit eivät näe eivätkä kirjoita mitään.

create table if not exists waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  referral_code text not null unique,
  referred_by text references waitlist_signups (referral_code) on delete set null,
  source text,
  created_at timestamptz not null default now()
);

create index if not exists waitlist_signups_referred_by_idx
  on waitlist_signups (referred_by);

create index if not exists waitlist_signups_created_at_idx
  on waitlist_signups (created_at);

alter table waitlist_signups enable row level security;
