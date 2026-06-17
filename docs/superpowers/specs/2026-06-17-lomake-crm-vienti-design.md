# Lomake → CRM-vienti (rascal-pages)

**Päivä:** 2026-06-17
**Status:** Hyväksytty design, odottaa toteutussuunnitelmaa

## Tausta ja tavoite

Jos organisaatiolla on käytössä sekä **rascal-pages** että **rascal-crm**
(määräytyy jaetun `rascal-ai`-Supabasen `organization_products`-taulusta),
landing page -lomakkeista kerätyt kontaktit halutaan voida viedä CRM:ään ja
liittää niihin valittu tagi.

Tämä spec kattaa **vain rascal-pagesin** osuuden: lomake-editorin asetukset
(frontti) ja webhook-payloadin laajennus (backend). Varsinaisen CRM-tallennuksen
ja organisaation reitityksen hoitaa **n8n** (rakennetaan erikseen, ei tämän
spec:n piirissä) ja CRM:n oma API.

## Arkkitehtuurikonteksti (vahvistettu tutkimuksella)

- Lomakkeen lähetys kulkee jo n8n:n kautta:
  `lomake → submitLead() server action → POST n8n-webhook (env N8N_RASCALPAGES_LEADS)`.
  n8n on siis luonteva paikka CRM-pushille; Pages vain merkitsee aikomuksen
  payloadiin.
- Kaikki nykyiset lomakkeet renderöityvät **block-systeemillä**: `SiteRenderer`
  → `sections` → `HeroBlock` (heroon upotettu lomake) ja `FormBlock` (erillinen
  form-sektio).
- Template-presetit "lead-magnet" ja "waitlist" tuottavat sections-pohjaisen
  configin, joka renderöityy juuri näillä lohkoilla. **Ne ovat siis katettu kun
  HeroBlock + FormBlock katetaan.**
- `app/components/templates/*Template.tsx` (LeadMagnet, Waitlist, Vsl, Personal,
  SaasModern) ovat **orpoa kuollutta koodia** — ei importteja, ei reititystä, ei
  testejä. Poistetaan tämän työn yhteydessä.
- Org-omistajuus: `leads.site_id → sites.user_id (= org_id = public.users.id)`.
  Sama `org_id` toimii sekä Pages- että CRM-puolella. n8n resolvoi orgin
  `siteId`:stä kuten nyt.

## Päätökset

1. **Togglen näkyvyys:** "Vie kontaktit CRM:ään" -toggle näytetään editorissa
   vain jos organisaatiolla on `rascal-crm` käytössä (`organization_products`,
   `is_enabled`). Muille ei renderöidä mitään.
2. **Lomakekattavuus:** Sekä `FormContent` (form-lohko) että `HeroContent`
   (heroon upotettu lomake). Kattaa kaikki nykyiset lomakepaikat.
3. **Tagi:** Yksi vapaa tekstikenttä (`crmTag`). Lähetetään payloadissa
   tarvittaessa taulukkona n8n:lle.
4. **Payloadin muoto:** `payload.crm = { export: true, tag }` lisätään vain kun
   vienti on päällä. Org **ei** mene payloadiin erikseen — n8n resolvoi sen
   `siteId`:stä kuten tähänkin asti.
5. **Vanhat templatet:** Poistetaan orvot `*Template.tsx`-tiedostot.

## Toteutus

### 1. Datamalli — `src/lib/templates.ts`

Lisätään kentät sekä `FormContent`- että `HeroContent`-tyyppiin:

```ts
exportToCrm?: boolean;   // "Vie kontaktit CRM:ään" -toggle
crmTag?: string;         // vapaa tekstitagi, esim. "Lander X"
```

Tallentuu osaksi sivun `content`-JSONBia muiden lomakeasetusten tapaan.
**Ei tietokantamigraatiota** (JSONB).

### 2. Backend — `app/actions/submit-lead.ts`

`submitLead` ja `submitLeadCore` saavat uuden valinnaisen parametrin:

```ts
crm?: { export: boolean; tag?: string }
```

`submitLeadCore` lisää payloadiin **vain kun `crm?.export === true`**:

```ts
payload.crm = { export: true, tag: crm.tag?.trim() || null };
```

Muu logiikka (honeypot/timing-bottisuoja, sähköpostivalidointi, julkaisutarkistus,
rate-limit, custom webhook) säilyy ennallaan. n8n lukee `payload.crm`.

### 3. Renderöinti välittää configin

- `app/components/blocks/FormBlock.tsx`: kutsuun
  `submitLead(siteId, formFields, content.webhookUrl || null,
  { export: content.exportToCrm ?? false, tag: content.crmTag })`.
- `app/components/blocks/HeroBlock.tsx`: vastaava heron lomakkeen `content`-arvoista.

### 4. Editori-UI (gated)

- **Server** (`app/app/dashboard/[id]/page.tsx`): org_id:n haun jälkeen kysely
  `organization_products ⋈ products` (slug `rascal-crm`, `is_enabled`) →
  `crmEnabled: boolean`. Viedään propsina `Editor → BlockEditor →
  FormBlockEditor / HeroBlockEditor`.
- **Editorit** (`FormBlockEditor.tsx`, `HeroBlockEditor.tsx`): jos `crmEnabled`,
  näytä lohko: toggle **"Vie kontaktit CRM:ään"**, ja kun se on päällä,
  tekstikenttä **"CRM-tagi"** (`crmTag`). Jos ei `crmEnabled` → ei renderöidä
  mitään CRM-asetusta.

### 5. Kuolleen koodin poisto

Poistetaan:
- `app/components/templates/LeadMagnetTemplate.tsx`
- `app/components/templates/WaitlistTemplate.tsx`
- `app/components/templates/VslTemplate.tsx`
- `app/components/templates/PersonalTemplate.tsx`
- `app/components/templates/SaasModernTemplate.tsx`
(koko `app/components/templates/` -hakemisto)

## Testit (repo: TDD-pakko)

`submitLeadCore`-yksikkötestit (Vitest on jo käytössä):

- payload sisältää `crm: { export: true, tag }` kun `crm.export === true`
- payload **ei** sisällä `crm`-kenttää kun export pois / `crm` puuttuu
- `crmTag` välittyy ja trimmataan; tyhjä tagi → `tag: null`
- nykyinen käyttäytyminen (bottisuoja, validointi, webhook-kutsu) säilyy

## Rajaukset

- CRM-pään `/api`-toteutus, n8n-workflow ja organisaation API-avaimet eivät
  kuulu tähän spec:iin (käyttäjän vastuulla).
- Vain yksi tagi per lomake v1:ssä.

## n8n-sopimus (tiedoksi workflown rakentajalle)

Webhookiin (`N8N_RASCALPAGES_LEADS`) tulee uusi valinnainen kenttä:

```json
{
  "type": "new_lead",
  "siteId": "...",
  "fields": { "email": "...", "name": "...", "...": "..." },
  "timestamp": "...",
  "crm": { "export": true, "tag": "Lander X" }
}
```

`crm` puuttuu kun vientiä ei ole valittu. n8n: suodata `crm.export === true`,
resolvoi org `siteId`:stä, tarkista molemmat tuotteet enabled, tallenna CRM:ään
tagilla.
