# Hinnoittelu, julkaisun maksumuuri ja waitlist (rascal-pages)

**Päivä:** 2026-10-28
**Status:** Päätökset lukittu 2026-10-28, odottaa toteutussuunnitelmaa

## Tausta ja tavoite

Rascal Pages julkaistaan kaupallisesti ensi vuonna. Ennen sitä halutaan:

1. **Waitlist** etusivulle, jotta promo voidaan aloittaa heti.
2. **Ilmainen rakentaminen, maksullinen julkaisu** — sivuston voi rakentaa
   ilmaiseksi, julkaisu vaatii maksun.
3. **Per sivusto -hinnoittelu** (Squarespace-malli): jokainen julkaistu
   sivusto on oma tilauksensa.
4. **Modulaarisuus:** Pages Basic sisältää vain portfolio-/referenssisivut.
   Landerit (ja tulevat overlayt) sisältyvät Rascal-tilauksiin.
5. **Täkyt** muihin Rascal-tuotteisiin (Rascal AI, CRM) oikeissa kohdissa.

**Ei tämän spec:n piirissä:** domainien osto Pagesin sisältä (holdissa;
selvitys: Vercel ei tue .fi:tä, kotimaisilla ei julkista API:a, vaihtoehdot
OVH / Route 53). Oman domainin *liittäminen* toimii jo (`update-domain.ts`).

## Arkkitehtuurikonteksti (nykytila)

- **Julkaisu on per sivu:** `pages.published` (boolean), asetetaan
  `app/actions/toggle-publish.ts` ja `app/actions/save-page.ts` kautta.
  Julkinen renderöinti (`src/lib/site-queries.ts`) suodattaa
  `published = true` ja RLS avaa julkaistun sisällön anonyymeille.
- **Hostname-reititys** `proxy.ts`: tenant-subdomain ja custom domain
  rewritetaan `/sites/{domain}`. Proxy ei tee DB-hakuja.
- **Sivuston haku:** `getSiteByDomain()` (`subdomain` tai `custom_domain`).
- **Tuoteoikeudet** ovat jo olemassa jaetussa Supabasessa:
  `organization_products` (`org_id`, `product_id`, `is_enabled`,
  `plan_tier`, `trial_ends_at`, `settings jsonb`) + `products.slug`
  (`rascal-ai`, `rascal-crm`, `rascal-hq`, `rascal-mail`, `rascal-pages`).
  Käytössä nyt `rascal-crm`-tarkistukseen `app/app/dashboard/[id]/page.tsx`.
  `plan_tier`-arvot ovat vain `free` / `pro` / `trial` — 480 € ja 880 €
  -paketteja ei erotella kannassa, vaan paketti kootaan moduuleista
  rekisteröinnissä.
- **Templatet** (`src/lib/templates.ts`):
  - Portfolio/refe: `portfolio`, `personal`, `personal-brand`
  - Landerit: `lead-magnet`, `waitlist`, `saas-modern`, `vsl`, `mobile-app`
  - Overlayta ei ole vielä koodissa — gating suunnitellaan siten, että
    overlay lisätään myöhemmin samaan feature-listaan.
- **Stripeä ei ole** vielä koodissa.

## Paketit

| | **Luonnos** | **Pages Basic** | **Rascal 480 €** | **Rascal 880 €** |
|---|---|---|---|---|
| Hinta | 0 € | 19 €/kk tai 190 €/v per sivusto (alv 0) | sisältyy | sisältyy |
| Rakentaminen | ✅ (max 3 luonnossivustoa / org) | ✅ | ✅ | ✅ |
| Julkaisu | ❌ esikatselu | ✅ | ✅ | ✅ |
| Julkaistuja sivuja per sivusto | — | 5 (blogi ei laske) | 25 | rajaton |
| Templatet | portfolio/refe; landerit 🔒 | portfolio/refe; landerit 🔒 | kaikki | kaikki |
| Overlayt | 🔒 | 🔒 | ✅ | ✅ |
| Oma domain | ❌ | ✅ | ✅ | ✅ |
| "Made with Rascal" -badge | — | näkyy | pois | pois |
| Sisältyvät sivustot | — | 1 per tilaus | 1 | 3 |

- Rascal-asiakkaan lisäsivustot: 19 €/kk, mutta perivät organisaation
  Rascal-ominaisuudet (landerit, overlayt, Rascalin sivuraja).
- **Rascal AI -trial ei anna Rascal-oikeuksia Pagesissa** — trial-käyttäjä
  on Pagesissa luonnoskäyttäjä.
- **Lukitut ominaisuudet näkyvät** 🔒-ikonilla, mutta niitä ei voi valita.
  Tooltip: "Sisältyy Rascaliin → Varaa demo".

## Tietomalli

### Uusi: `site_plans` (yksi rivi per sivusto)

```sql
create type site_plan_tier as enum ('draft', 'basic', 'rascal');
create type site_billing_status as enum
  ('none', 'active', 'past_due', 'canceled');

create table site_plans (
  site_id uuid primary key references sites(id) on delete cascade,
  tier site_plan_tier not null default 'draft',
  billing_status site_billing_status not null default 'none',
  stripe_customer_id text,
  stripe_subscription_id text unique,
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);
```

- Erillinen taulu `sites`-sarakkeiden sijaan → billing-kentät eivät vuoda
  julkiseen `select("*")`-hakuun, ja RLS voidaan pitää tiukkana
  (vain service role kirjoittaa, omistaja-org lukee).
- `tier = 'rascal'` asetetaan, kun sivusto käyttää Rascal-tilauksen
  sisältyvää paikkaa (ei Stripe-tilausta sivustolla).

### Rascal-oikeudet: `organization_products` / `rascal-pages` (ei uutta taulua)

Rascal-paketin Pages-oikeus tallennetaan **Pages-moduulin omalle riville**
eikä johdeta Rascal AI:n hinnasta:

```jsonc
// organization_products, product = rascal-pages
{
  "is_enabled": true,
  "plan_tier": "pro",          // 'trial' ei anna oikeuksia
  "settings": {
    "included_sites": 3,       // 480 € → 1, 880 € → 3
    "max_pages": null          // 480 € → 25, 880 € → null (rajaton)
  }
}
```

- **Rascal AI:n rekisteröinti** (moduuleista koottu paketti) luo/aktivoi
  rivin ja kirjoittaa kiintiöt `settings`iin. Muutos tehdään rascal-ai
  -repossa; Pages vain lukee.
- Kiintiöt ovat näin näkyvissä kannassa ja säädettävissä asiakaskohtaisesti
  (esim. myyjän räätälöimä diili) ilman koodimuutosta.
- Puuttuvat `settings`-avaimet → turvalliset oletukset (1 sivusto, 25 sivua).
- **Migraatio:** kannassa on jo 3 `rascal-pages`/`pro`-riviä — tarkistetaan
  mitä orgeja ne ovat ja asetetaan niille kiintiöt.

### Uusi: `waitlist_signups`

```sql
create table waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  referral_code text not null unique,
  referred_by text references waitlist_signups(referral_code),
  source text,                -- utm/kampanja
  created_at timestamptz not null default now()
);
```

Kirjoitus vain server actionin kautta (service role), ei julkista RLS-insertiä.

### Tyypit (C-5)

`SitePlanTier`, `SiteBillingStatus` union-tyyppeinä; Stripe-ID:t brändättyinä
(`StripeSubscriptionId`, `StripeCustomerId`).

## Oikeudet (entitlements)

Yksi puhdas funktio, jota UI, server actionit ja renderöinti käyttävät:

```ts
// src/lib/entitlements.ts
type Entitlements = {
  canPublish: boolean;
  allowedTemplateIds: ReadonlySet<TemplateId> | 'all';
  overlays: boolean;
  maxPublishedPages: number | null; // null = rajaton
  customDomain: boolean;
  showBadge: boolean;
};

function resolveEntitlements(input: {
  sitePlan: {
    tier: SitePlanTier;
    billingStatus: SiteBillingStatus;
    pastDueSince: Date | null;
  };
  rascal: { includedSites: number; maxPages: number | null } | null;
  now: Date;
}): Entitlements;
```

- `rascal` luetaan `organization_products`-riviltä (`rascal-pages`,
  `is_enabled`, `plan_tier <> 'trial'`); `null` jos ei oikeutta.
- `canPublish = tier !== 'draft' && (billingStatus === 'active' ||
  (billingStatus === 'past_due' && now - pastDueSince < 7 pv))`.
  `tier = 'rascal'` on aina julkaistavissa niin kauan kuin `rascal` ≠ null.
- `site_plans`iin lisätään `past_due_since timestamptz` (webhook asettaa
  `invoice.payment_failed`, nollaa `invoice.paid`).
- Puhdas funktio → yksikkötestit `src/lib/entitlements.spec.ts` (T-1).

## Julkaisun maksumuuri

### Kirjoituspuoli (estetään julkaisu)
- `togglePagePublish` ja `savePage(published=true)`: tarkista
  `resolveEntitlements` → jos `!canPublish`, palauta
  `{ error, code: 'PAYMENT_REQUIRED' }`; UI avaa julkaisudialogin.
- Template-gating: lukittuja templateja ei voi valita sivuston/sivun
  luonnissa (näkyvät 🔒 + "Sisältyy Rascaliin → Varaa demo"). Palvelimella
  sama tarkistus luonnissa ja julkaisussa (`code: 'UPGRADE_REQUIRED'`),
  jotta UI:n ohitus ei riitä.
- Luonnossivustojen raja: uuden sivuston luonti estetään, jos orgilla on jo
  3 julkaisematonta sivustoa (`code: 'DRAFT_LIMIT'`). Maksetut eivät laske.
- Sivuraja: julkaisu estetään, jos julkaistuja sivuja on jo
  `maxPublishedPages` (`code: 'PAGE_LIMIT'`).

### Lukupuoli (estetään näkyvyys)
- `getSiteByDomain()` palauttaa myös `site_plans`-tilan; `/sites/[domain]`
  näyttää julkisen sisällön vain jos `canPublish`. Muuten "Tulossa pian"
  -sivu (noindex).
- Näin tilauksen päättyminen piilottaa sivuston ilman että `pages.published`
  -lippuja muutetaan → uudelleenaktivointi palauttaa sivuston sellaisenaan.
- `submitLead` hylkää lähetykset sivustoilta, joilla `!canPublish`.

### Esikatselu
- Luonnossivustolle jaettava esikatselulinkki (`/preview/{token}` app-hostilla
  tai `?preview=` + allekirjoitettu token). `noindex`, yläbanneri
  "Julkaise sivustosi →". Tarkempi mekanismi toteutussuunnitelmaan.

### Downgrade / peruutus
- Mitään ei poisteta. Sivusto piilotetaan (lukupuoli), editori pysyy
  käytössä, ja käyttäjä voi aktivoida uudelleen.

## Stripe

- **Tuotteet:** `pages_basic_monthly` (19 €/kk), `pages_basic_yearly`
  (190 €/v), alv 0 + verot Stripe Taxilla (Price ID:t env-muuttujiin).
- **Founding member -kuponki:** −40 % ensimmäinen vuosi waitlistillä
  olleille (Stripe coupon `duration: repeating, 12 kk`; vuositilauksessa
  `once`). Kohdistus waitlist-sähköpostin perusteella checkoutissa.
- **Tilaus per sivusto:** Checkout Session `mode: 'subscription'`,
  `metadata: { site_id, org_id }`, `client_reference_id = site_id`.
  Stripe Customer per org (tallennetaan `site_plans`iin; tarvittaessa myöh.
  `orgs`-tasolle).
- **Julkaise-nappi (luonnos-sivusto):**
  1. Jos org:lla Rascal ja vapaita sisältyviä paikkoja → `tier='rascal'`,
     ei Stripeä.
  2. Muuten → Server action luo Checkout Sessionin → redirect.
  3. `success_url` → editori, joka pollaa tilan ja julkaisee.
- **Webhook** `app/api/stripe/webhook/route.ts` (Node runtime, raw body,
  signature-verifiointi): käsittelee `checkout.session.completed`,
  `customer.subscription.updated`, `customer.subscription.deleted`,
  `invoice.payment_failed` → upsert `site_plans`. Idempotentti
  (event-id-loki tai upsert tilaan perustuen).
- **Hallinta:** Stripe Customer Portal -linkki sivuston asetuksiin
  (peruutus, kortin vaihto, laskut).
- **Mak8r / jälleenmyynti:** sivustokohtainen tilaus mahdollistaa
  myöhemmin laskutuksen siirron asiakkaalle. Ei toteuteta nyt; malli ei
  saa estää sitä.

## Waitlist (etusivu)

- `/home` (rascalpages.fi) → hero + sähköpostilomake + "Tulossa pian"
  (**ei julkaisupäivää**) + jonon pituus.
- Server action `joinWaitlist(email, ref?)`: validoi, insert
  `waitlist_signups`, palauttaa oman `referral_code`.
- Kiitosnäkymä: jonosija + jaettava linkki `rascalpages.fi/?ref=CODE`
  ("Kutsu kaveri, hyppää jonossa").
- Founding member -etu viestitään sivulla: **−40 % ensimmäinen vuosi**.
  Toteutus julkaisussa Stripe-kuponkina — ei tässä vaiheessa.
- Synkka Brevo-listalle suoraan API:lla (`BREVO_API_KEY`,
  `BREVO_WAITLIST_LIST_ID`) uudesta ilmoittautumisesta. Oma taulu on
  totuus (kutsukoodit, jonosija); Brevo on postituslista. Brevon
  epäonnistuminen ei estä jonoon pääsyä. Lomakkeen alla suostumusteksti.
- Mobiilikuntoon-tarkistus ennen julkaisua.

## Ristiinmyynti (täkyt)

Toteutetaan omana batchinaan maksumuurin jälkeen; tässä vain suunta:

1. **Julkaisun jälkeen:** "Kerro uudesta sivustostasi somessa" →
   deep link Rascal AI:hin, URL esitäytettynä.
2. **Lukittu lander/overlay:** tooltip "Sisältyy Rascaliin" + "Varaa demo".
3. **Lomakkeet:** "Vie liidit CRM:ään" -toggle näkyy myös ilman CRM:ää,
   lukittuna + kokeilu-CTA (laajentaa nykyistä lomake→CRM-speciä).
4. **Tilivalikko:** muut Rascal-tuotteet "Kokeile"-merkillä.

## Toteutusjärjestys

1. **Waitlist** (itsenäinen, julkaistavissa heti)
2. **Tietomalli + entitlements** (`site_plans`, `resolveEntitlements` + testit)
3. **Maksumuuri** (kirjoitus- ja lukupuolen tarkistukset, "Tulossa pian",
   esikatselu)
4. **Stripe** (Checkout, webhook, Customer Portal)
5. **Rascal-tilauksen sisältyvät paikat** (`organization_products` /
   `rascal-pages` `settings`; + rascal-ai-rekisteröinnin muutos)
6. **Ristiinmyynti**

Jokaiselle vaiheelle Linear-issue (RAS) ja testaussuunnitelma (`/qtest`).

## Testaus

- Yksikkö: `resolveEntitlements` (kaikki tier × status × orgHasRascal
  -kombinaatiot), sivurajan laskenta, referral-koodin generointi.
- Integraatio: `togglePagePublish` palauttaa oikeat virhekoodit;
  webhook-käsittelijä (Stripe CLI -fixturet) päivittää `site_plans`in
  idempotentisti.
- Ihmistestaus: Stripe test mode -maksu → julkaisu → peruutus →
  sivusto piiloon → uudelleenaktivointi.

## Päätökset (2026-10-28)

| Asia | Päätös |
|---|---|
| Basic-hinta | 19 €/kk, 190 €/v per sivusto (alv 0) |
| Basic-sivuraja | 5 julkaistua sivua per sivusto (blogi ei laske) |
| Rascal 480 € | 1 sisältyvä sivusto, 25 sivua |
| Rascal 880 € | 3 sisältyvää sivustoa, rajaton sivumäärä |
| Rascal-kiintiöiden tallennus | `organization_products` / `rascal-pages` `settings` — ei uutta taulua |
| Rascal AI -trial | ei Rascal-oikeuksia Pagesissa |
| Julkaisuajankohta waitlistillä | ei päivää ("Tulossa pian") |
| Founding member | −40 % ensimmäinen vuosi |
| Lukitut ominaisuudet | näkyvissä 🔒 + "Varaa demo" -CTA, ei valittavissa |
| Maksu epäonnistuu | 7 pv armonaika, sitten sivusto piiloon |
| Luonnossivustot | max 3 julkaisematonta per org |
| Domainien osto | holdissa |
