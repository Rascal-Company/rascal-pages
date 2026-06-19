# Brief: Stripe connection layer (RAS-100)

> Kohde: Arttu · Tila: suunniteltu, ei vielä koodattu · Linear: [RAS-100](https://linear.app/rascal-ai/issue/RAS-100/stripe-connection-layer-connect-onboarding-oauth-express) · Projekti: [Maksut: Stripe Connect](https://linear.app/rascal-ai/project/maksut-stripe-connect-tilaukset-768884f19df9)

## TL;DR
Rakennetaan **vain connection layer**: tenant (org) liittää Stripe-tilin dashboardista ja me tallennamme yhteyden. **Ei** checkoutia, hintoja eikä subscription-webhookeja tässä — ne tulevat myöhemmin tämän päälle. Tuetaan **molempia**: olemassa olevan tilin liittäminen (Standard OAuth) ja uuden tilin luonti (Express).

## Tausta (mihin tämä istuu)
Rascal Pages on monitenant-sivustorakentaja (Next.js 16 App Router, React 19, Supabase, Tailwind 4). Auth on org-pohjainen:
- `auth.users` → `org_members` (`auth_user_id` → `org_id`) → `public.users` (= organisaatio).
- `sites` omistaa org (`sites.user_id` → `public.users.id`), `pages`/`posts`/`leads` kuuluvat siteen.
- **Stripe-yhteys kytketään orgiin** (ei siteen), koska maksut ovat org-tason ominaisuus.

Hyvä referenssi olemassa olevasta koodista: **`api_keys`** (org-scoped salaisuudet) — sama RLS-kuvio ja "tallennetaan vain ei-salainen metadata" -periaate.
- Migraatio: `supabase/migrations/20260617_api_keys.sql`
- Reitit (route handlerit) löytyvät: `app/api/*/route.ts` (esim. `app/api/posts/route.ts`)
- Dashboard-sivukuvio: `app/app/dashboard/[id]/posts/` ja `app/app/dashboard/[id]/pages/` (server `page.tsx` + client-komponentti)
- Dashboard-kortin linkit: `app/components/DashboardClient.tsx` (Sivut/Blogi/Asetukset → lisää "Maksut")

## Lukitut päätökset
| Asia | Päätös |
|------|--------|
| Connect-tyyppi | **Molemmat**: Standard OAuth (olemassa oleva tili) + Express (uusi tili) |
| Charge-malli (myöhemmin) | Direct charges connected-tilille, `Stripe-Account`-header |
| Application fee | **Ei** — tenant saa 100 % |
| Salaisuudet | **Ei tallenneta tenantin secret-avaimia** — vain `acct_…`-tili-id + metadata |
| Mode | Rakennetaan **test-modessa** ensin |

## Tietomalli
Uusi taulu `stripe_connections` (yksi rivi per org):

```sql
create table stripe_connections (
  id uuid default gen_random_uuid() primary key,
  org_id uuid references public.users(id) on delete cascade not null unique,
  stripe_account_id text not null,        -- OAuth: stripe_user_id, Express: acct_...
  connect_type text not null,             -- 'standard' | 'express'
  charges_enabled boolean not null default false,
  details_submitted boolean not null default false,
  livemode boolean not null default false,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table stripe_connections enable row level security;
-- RLS: vain org-jäsen näkee/poistaa omansa (kopioi kuvio api_keys-migraatiosta).
-- stripe_account_id ei ole salaisuus, mutta tokeneita EI talleteta tähän lainkaan.
```

## Flow

### A) Standard OAuth (olemassa oleva Stripe-tili)
1. `GET /api/stripe/connect/oauth` → redirect `https://connect.stripe.com/oauth/authorize`
   - paramit: `client_id=STRIPE_CLIENT_ID`, `scope=read_write`, `response_type=code`, `state=<CSRF+org-sidottu>`.
2. Käyttäjä valtuuttaa Stripessä → redirect takaisin `…/callback?code=…&state=…`.
3. `GET /api/stripe/connect/oauth/callback`:
   - varmista `state` (CSRF + että org täsmää kirjautuneeseen käyttäjään),
   - `stripe.oauth.token({ grant_type: 'authorization_code', code })` → `stripe_user_id`,
   - upsert `stripe_connections` (`connect_type='standard'`),
   - redirect `/app/dashboard/<siteId tai org>/payments`.

### B) Express (uusi tili alustan kautta)
1. Server action / `POST /api/stripe/connect/express`:
   - jos orgilla ei ole tiliä: `stripe.accounts.create({ type: 'express' })`,
   - `stripe.accountLinks.create({ account, type: 'account_onboarding', refresh_url, return_url })`,
   - redirect käyttäjä `account_link.url`:iin.
2. `GET /api/stripe/connect/express/return`:
   - `stripe.accounts.retrieve(accountId)` → tallenna `charges_enabled` / `details_submitted`,
   - redirect Maksut-sivulle.
   - `refresh_url` osoittaa takaisin express-starttiin (jos linkki vanheni).

### Yhteinen
- **Status tuoreutetaan** `stripe.accounts.retrieve(accountId)` -kutsulla Maksut-sivun latauksessa, jotta `charges_enabled` on ajan tasalla. (`account.updated`-webhook on myöhempi optimointi, ei tässä.)
- **Katkaise yhteys**: Standard → `stripe.oauth.deauthorize({ client_id, stripe_user_id })`; Express → poista oma rivi (ja halutessa `stripe.accounts.del(accountId)`). Poista `stripe_connections`-rivi molemmissa.

## Dashboard "Maksut" -sivu
Polku: `app/app/dashboard/[id]/payments/page.tsx` (server) + client-komponentti, samaa kuviota kuin `posts/` ja `pages/`.
- **Ei yhteyttä** → kaksi polkua: **"Liitä oma Stripe"** (OAuth) ja **"Luo uusi Stripe-tili"** (Express).
- **Yhteys olemassa** → tili-id, tyyppi, `charges_enabled`-tila ("Valmis ottamaan maksuja" / "Onboarding kesken"), **"Katkaise yhteys"**.
- Lisää linkki dashboard-korttiin: `app/components/DashboardClient.tsx` (Sivut/Blogi/Asetukset-rivin viereen "Maksut").

## Env / prerequisitet (tekijältä)
- `STRIPE_SECRET_KEY` — platform-tilin secret key (test).
- `STRIPE_CLIENT_ID` — Connect-asetuksista (OAuth).
- Redirect/return URL:t whitelistattu Stripe Connect -asetuksiin.
- Stripe-platform-tilillä **Connect päällä**. Ensin **test-mode**.
- `npm i stripe`.

## Turvallisuus
- OAuth `state`: satunnainen CSRF-token + sidonta kirjautuneeseen orgiin (esim. allekirjoitettu/lyhytikäinen).
- Kaikki Stripe-kutsut **vain server-puolella** (route handler / server action).
- Talletetaan vain `stripe_account_id` + metadata; ei access-tokeneita.
- Ownership: org päätellään kirjautuneesta käyttäjästä (`org_members`), ei clientiltä.

## Valmis kun
- Tenant voi liittää joko olemassa olevan (OAuth) tai uuden (Express) Stripe-tilin ja näkee tilan dashboardissa.
- Yhteyden voi katkaista.
- Vain tili-id + metadata tallessa; RLS kunnossa.
- `tsc --noEmit` + ESLint + `next build` läpi.

## Ei tässä (omat issuet myöhemmin)
- Checkout / "Tilaa"-napit hinnoittelulohkosta.
- Stripe Product/Price -luonti tiereistä.
- Subscription-webhookit, `subscriptions`-taulu, customer portal.

## Viitteet koodissa
- `supabase/migrations/20260617_api_keys.sql` — RLS- ja secret-metadata-kuvio (kopioi).
- `app/api/posts/route.ts` — route handler -esimerkki + org/site-ownership-tarkistus.
- `app/app/dashboard/[id]/pages/{page.tsx,PagesClient.tsx}` — server+client dashboard-sivun kuvio.
- `app/components/DashboardClient.tsx` — kortin linkit (lisää "Maksut").
- `CLAUDE.md` — org-malli, auth-kuvio, projektinhallinta (Linear).
