# Rascal Pages: sivusto joka kasvaa itsestään — konsepti

**Päivä:** 2026-09-03
**Status:** Konseptiluonnos, odottaa päätöksiä (ks. luku 7)
**Koskee:** rascal-pages (runtime + editori), rascal-ai (sisältö- ja SEO-putket, brändin perusta)
**Linear:** initiative Rascal Pages — projektit *Site builder MVP*, *Blogi-moduuli*, *Rascal-integraatio: sisältö & SEO*, *Maksut: Stripe Connect*

---

## 1. Väite

"Maailman paras sivustokone joka hakkaa WordPressin" on väärä kilpailu, jos sillä tarkoitetaan yleiskäyttöistä CMS:ää. WordPress voittaa sen ekosysteemillä (60 000 pluginia, jokainen toimisto osaa sen), eikä kolmen hengen tiimi pysty siihen.

Oikea kilpailu on **asiakkaan työ**: suomalainen pk-yritys, jolla on toimiston 3–5 vuotta sitten rakentama WP-sivu, jota kukaan ei päivitä, jonka blogi on kuollut ja jonka SEO ei tuota liidejä. Tälle asiakkaalle WordPress ei ole kilpailija vaan ongelma.

Siinä pelissä Rascalilla on jotain, mitä Wixillä, Squarespacella, Webflow'lla, Framerilla, Durablella tai 10Webillä ei ole: **asiakkaan oikea brändin perusta ja kuukausittain pyörivä sisältökone.** Jokaisella kilpailijalla on "AI-sivugeneraattori", joka arvaa firman tyhjästä promptista. Rascalilla on asiakkaan ICP, palvelut, tone of voice, sisältöpilarit, brändivärit, logo, SEO-avainsanat klustereittain ja putki, joka jo nyt kirjoittaa blogit ja työntää ne WordPressiin.

Konsepti tiivistettynä:

> **Rascal Pages ei ole sivustokone. Se on sivusto, joka syntyy brändin perustasta 15 minuutissa, kasvaa Rascalin sisältöputkista itsestään ja tuo liidit CRM:ään.**

Kolme lupausta, joilla WP hakataan:

| Lupaus | Miksi WP häviää |
|---|---|
| **Syntyy perustasta, ei tyhjästä.** Kokonainen firmasivu (etusivu, palvelut, meistä, yhteys, blogi) generoidaan Rascal AI:n brändin perustasta. | WP-sivu vaatii toimiston, teeman, 40 h työtä. AI-builderit vaativat promptin ja arvaavat. |
| **Kasvaa itsestään.** SEO-klusterit → blogit → sisäinen linkitys → vanhojen päivitys, kaikki Pagesille ilman käsityötä. | WP:ssä blogi kuolee, koska kukaan ei kirjoita. Yoast kertoo vain, että meta puuttuu. |
| **Myy.** Lomake → CRM tagilla, puhelinassistentti, "mikä sivu toi liidin" -näkymä. | WP-lomake lähettää sähköpostia, joka hukkuu. |

Lisäksi hygienia, jossa WP häviää rakenteellisesti: ei plugineja, ei päivityksiä, ei hostingia, ei hakkeroituja sivuja, Core Web Vitals suunniteltu sisään.

---

## 2. Mitä on jo olemassa (inventaario 3.9.2026)

### rascal-pages (Next 16, React 19, Supabase, Vercel; 53 committia, 26 spec-tiedostoa)

**Editori ja lohkot**
- 16 lohkotyyppiä: hero, features, faq, testimonials, about, video, form, logos, blog, cases, techStack, bento, pricing, gallery, cta, footer (`src/lib/templates.ts`).
- 8 templatea: lead-magnet, waitlist, saas-modern, vsl, personal, personal-brand, portfolio, mobile-app.
- On-canvas-editointi, drag & drop, undo/redo, autosave, per-sektio style inspector, per-sivusto teema-tokenit (`src/lib/site-theme.ts`), alasivut + jaettu navigaatio.
- AI-sivun luonti: `createAiSite` → n8n → Claude generoi TemplateConfigin kolmesta kentästä (title, description, link). **Ei käytä brändin perustaa.**

**Runtime ja SEO**
- Multi-tenant hostname-reititys `proxy.ts`, custom domainit Vercel Domains API:lla.
- Meta title/description/OG, canonical, `sitemap.xml`, `robots.txt`, JSON-LD: Person, Article, BreadcrumbList (`src/lib/seo.ts`).
- **Puutteet:** kaikki sivut `force-dynamic` ilman välimuistia; ei `next/image`-optimointia; sitemap listaa vain etusivun ja blogin, ei alasivuja; ei 301-uudelleenohjauksia; ei hreflangia; ei OG-kuvan generointia; ei Organization/LocalBusiness/Service/FAQ-skeemaa; ei SEO-pisteytystä editorissa.

**Blogi**
- `posts`-taulu per sivusto, julkinen ingest-API `POST /api/posts` (globaali secret tai org-kohtainen `rp_live_…`-avain), postauseditori, Markdown-renderöinti.
- **Rascal AI ei julkaise tänne.** Se julkaisee WordPressiin, Webflow'hun, HubSpotiin, Odooon, webhookiin, Wixiin ja Kajabiin — mutta ei omaan tuotteeseen.

**Liidit ja analytiikka**
- Lomake → `submitLead` → n8n → CRM-vienti tagilla (spec 2026-06-17 hyväksytty). Honeypot + ajoitus + rate limit.
- `analytics_events` (page_view, cta_click, form_view), GTM/GA4/Meta Pixel -asetukset.

**Arkkitehtuurihaarauma (päättämättä)**
- Tuotannossa DB-pohjainen multi-tenant.
- ADR-0001 ehdottaa git-native repo-per-site-mallia (`site-template/`, `provisioning/`), jossa sisältö on markdownia ja jokainen sivu oma Vercel-projekti. Status "odottaa hyväksyntää" kesäkuusta.

**Tietoturva (auditointi 23.7.2026, kaikki avoinna)**
- RAS-232 SSRF `submitLead`-webhookissa (High), RAS-233 stored XSS analytics-id:istä (High), RAS-234 luonnokset voivat vuotaa julkiseen renderiin (High), RAS-235 PostgREST-injektio host-parametrista (Medium), RAS-236 globaalit ingestion-secretit (Medium), RAS-237 matalat.

### rascal-ai (v2.36.1) — mitä Pages voi imeä

**Brändin perusta** (`users`-taulu): company_name, industry, services, target_audience + ICP-tiivistelmä, tone_of_voice, content_pillars, brand_colors, logo_url, company_website_url. Pisteytetty "Perusta"-näkymä.

**Blogiputki** (n8n *Blog Generation*, 60 nodea): `seo_keywords` → Keyword Matcher → DataForSEO → SERP Auditor → outline → writer (vektorihaku tietopankista) → Markdown → Leonardo-kansikuva → `content.blog_post`. Tuotannossa 345 blogiriviä.

**SEO-kerros:** avainsanat toiminnoittain (gap / optimization / defending), `ranking_url`, kuukausittainen SEO Planner (`seo_updates`, `internal_linking_plan`), SEO-klusterit-projekti (pillar post + child postit, RAS-202 outline-first review'ssä), sisäisen linkityksen agentti.

**Blogi-import** (RAS-572 Done, RAS-579 In Progress): WordPress-arkisto Rascaliin `wp-json`-rajapinnasta, upsert `metadata.wordpress.post_id`-avaimella, Tuodut-välilehti. **12 asiakasta, 32 WordPress-avainta** — tämä on pilottipooli.

**Muu:** MCP-palvelin (`rascal_publish_blog`, `rascal_list_blog_articles`), CRM-entitlement `organization_products`, Rascal ID SSO (Pages käyttää jo), `OpenBuilderButton` handoff Pagesiin.

---

## 3. Kiila: blogi ensin, koko sivu sitten

Asiakasta ei kannata pyytää heti hylkäämään WP-sivuaan. Kiila on:

1. **Blogi Pagesille, pääsivu jää WP:hen.** `blogi.firma.fi` (tai `firma.rascalpages.fi`) osoittaa Pagesiin. Rascalin sisältökone julkaisee sinne suoraan, sisäiset linkit, JSON-LD, sitemap ja kansikuvat ovat 100 % Rascalin hallinnassa. Asiakkaalle nollariski: mikään vanha ei rikkoudu. Rascalille: WordPress-julkaisun ikuiset ongelmat (avaimet, Yoast, Gutenberg-siivous, plugin-versiot) poistuvat.
2. **Kun blogi tuottaa, tuodaan loput.** WP-sivut ja media importataan, 301-kartta generoidaan, domain vaihdetaan. RAS-579:n import-koodi on tämän pohja.
3. **Uusi asiakas ilman sivua** saa suoraan koko firmasivun perustasta.

---

## 4. Tuotekonsepti moduuleittain

### 4.1 Sivun syntymä: "Perustasta sivustoksi"
- Syöte: Rascal AI:n brändin perusta (ei tyhjä prompti). Käyttäjä valitsee vain sivurakenteen (esim. Etusivu / Palvelut / Meistä / Yhteys / Blogi) ja tyylisuunnan.
- Generaattori tuottaa **monisivuisen** TemplateConfig-sarjan: jokaiselle palvelulle oma sektio tai alasivu, ICP-kielellä kirjoitetut hero-tekstit, ToV:n mukainen copy, brändivärit paletiksi, logo headeriin, FAQ palveluista.
- Nykyinen `n8n-workflow-landingpage-builder` korvataan tai laajennetaan: payloadiin `orgId` → workflow hakee perustan `users`-taulusta → generoi `pages`-rivit `site_id`:lle.
- Editori säilyy: käyttäjä hioo, ei rakenna.

### 4.2 SEO sisäänrakennettuna, ei pluginina
- **Skeema automaattisesti:** Organization + LocalBusiness (osoite, y-tunnus, aukioloajat perustasta), Service per palvelu, FAQPage FAQ-lohkosta, Article + Breadcrumb blogiin, WebSite + SearchAction.
- **Tekninen SEO oletuksena:** täysi sitemap (kaikki julkaistut sivut + blogi + lastmod), per-sivu `noindex`, canonical, hreflang jos kielet, OG-kuva generoidaan otsikosta ja brändistä (`next/og`), 301-kartta domain-tasolla.
- **Suorituskyky:** ISR / `revalidateTag` julkaisun yhteydessä, `next/image` + Supabase Storage -transformaatiot, fontit itse hostattuina. Tavoite Lighthouse mobile ≥ 95 kaikilla templateilla. Tämä on kohta, jossa WP + 14 pluginia häviää joka kerta.
- **SEO-paneeli editorissa:** Yoast-tyyppinen tarkistuslista (otsikon pituus, meta, H1, alt-tekstit, sisäiset linkit, avainsana `seo_keywords`-taulusta), mutta pisteytys tulee Rascalin SEO-datasta, ei geneerisestä säännöstä.
- **Search Console -kytkentä:** klikit ja sijainnit per URL takaisin `seo_keyword_rank_snapshots`-tauluun → SEO Planner näkee, mikä Pages-sivu tuottaa.

### 4.3 Kasvusilmukka (Rascal AI ↔ Pages)
- **Pages julkaisukohteeksi** Rascal AI:n asetuksiin WordPressin rinnalle: uusi `pages-publish`-edge-funktio, joka kutsuu Pagesin `POST /api/posts` org-avaimella. Tallentaa `content.blog_url` (RAS-576 tehty). Kansikuva ja inline-kuvat siirretään Pagesin storageen, ei linkitetä Leonardoon.
- **Klusteri → sivusto:** pillar post voi olla Pages-alasivu (ei vain blogipostaus), child postit blogissa, linkitys molempiin suuntiin. Sisäisen linkityksen backfill päivittää Pages-postaukset paikalleen upsertilla — ei tarvitse WordPressin PATCH-polkua.
- **Blog Refresh** (`seo_updates` → uudelleenkirjoitus) toimii Pagesilla ilman alustakohtaista koodia.
- **Some ← sivu:** Blogin jalostus someksi (RAS-551) toimii jo; Pages-julkaisu vain lisää `blog_url`:n postauksiin.

### 4.4 Myynti: liidistä kauppaan
- Lomake → CRM tagilla (spec olemassa), puhelinassistentin (Vapi) yhteydenottopyyntö lomakkeesta, kalenterivaraus-lohko.
- **Sivustoanalytiikka joka vastaa yhteen kysymykseen:** mikä sivu ja mikä blogi toi liidin. `analytics_events` + `leads` + UTM → dashboardiin. Ei GA4-korvike, vaan liidipolku.
- Stripe Connect -tilaukset (projekti backlogissa) hinnoittelulohkoon.

### 4.5 WP-muutto
- Import: sivut (`wp-json/wp/v2/pages`), postaukset (RAS-579), media, menut → Pages-sivuiksi lohkoheuristiikalla (H1 + ensimmäinen kappale → hero, listat → features, jne.) + AI-siivous ToV:hen.
- 301-kartta vanha URL → uusi URL automaattisesti slugien perusteella, editoitava.
- Domain-vaihto-velho: DNS-ohjeet, verifiointi, vanhan sitemapin vertailu (mikä URL jäi ilman kohdetta → 404-vahti).

---

## 5. Arkkitehtuuripäätös: DB-runtime, git = ulosvientinappi

Repo-per-site (ADR-0001) ja "sivu päivittyy Rascalin putkista automaattisesti" ovat ristiriidassa: jokainen blogijulkaisu, linkkibackfill ja refresh olisi git-commit + Vercel-build per asiakas, N projektia, build-viiveet ja kustannus. Sisältökone tuottaa muutoksia päivittäin, ei kuukausittain.

**Suositus:** tuotantoruntime pysyy DB-pohjaisena multi-tenanttina (nykyinen), ja repo-per-site säilytetään **omistajuuslupauksena**: "Vie sivusto" -nappi generoi `site-template`-pohjaisen repon asiakkaan sisällöllä milloin tahansa. Se on myyntiargumentti ("et ole lukossa"), ei päivittäinen runtime. Provisiointikoodi ei mene hukkaan.

Tämä pitää sisällään ISR/välimuistin lisäämisen DB-runtimeen, joka on joka tapauksessa tehtävä.

---

## 6. Batchit (ShapeUp, tiimin 4+2-rytmi)

Rytmi RAS-577:n mukaan: cycle 7 (7.9.–20.9.) cooldown, cycle 8–9 (21.9.–18.10.) Build A/B, sen jälkeen cooldown ja seuraava build.

### Batch 0 — Cooldown 7.9.–20.9.: pohja kuntoon
Ei uusia ominaisuuksia, mutta ilman näitä mitään ei voi myydä firman alustana.
- Tietoturvalöydökset RAS-232…237 kiinni.
- Arkkitehtuuripäätös (luku 5) kirjattu ADR-0001:n statukseen.
- **Pages julkaisukohteeksi Rascal AI:hin** (`pages-publish`-edge-funktio + asetuskortti). Pieni, mutta täyttää *Blogi-moduuli*-projektin "Valmis kun" -ehdon yhdellä iskulla ja avaa kiilan.
- ISR + `next/image` + täysi sitemap. Lighthouse-mittaus kaikilla templateilla lähtötasoksi.

### Batch 1 — Build 21.9.–18.10.: "Firmasivu perustasta"
**Ongelma:** Pages tekee nyt landereita promptista; firmasivu vaatii käsityötä eikä käytä sitä dataa, joka Rascalissa jo on.
**Appetite:** 6 viikkoa (A+B).
**Scope:** monisivuinen generaattori perustasta (4.1), globaali header/footer/navigaatio-editori, Organization/LocalBusiness/Service/FAQ-skeema, OG-kuvat, SEO-paneeli editorissa avainsanadatalla.
**Ei scopessa:** WP-import, Search Console, Stripe.
**Valmis kun:** Rascal AI -asiakas, jolla perusta on pisteytetty, painaa "Luo sivusto" ja saa julkaistun 5-sivuisen firmasivun omalla alidomainilla alle 15 minuutissa ilman tyhjää kanvasta; Lighthouse mobile ≥ 95.

### Batch 2 — seuraava build: "WP-muutto"
**Ongelma:** 12 WP-asiakasta eivät voi siirtyä, koska vanhat sivut ja URL:t katoaisivat.
**Scope:** sivujen + median import RAS-579:n päälle, 301-kartta, domain-velho, 404-vahti, Search Console -kytkentä.
**Valmis kun:** vähintään 3 pilottiasiakasta 12:sta on siirtänyt blogin tai koko sivun Pagesille ilman orgaanisen liikenteen pudotusta 30 päivän ikkunassa.

### Batch 3 — "Kasvusilmukka ja myynti"
**Scope:** klusterin pillar post Pages-alasivuna, backfill-linkitys Pagesiin, Blog Refresh, liidipolku-analytiikka, Stripe Connect.
**Valmis kun:** SEO Plannerin `seo_updates`-rivi toteutuu Pages-sivulle ilman ihmistä, ja dashboard näyttää liidin lähdesivun.

---

## 7. Päätökset, jotka tarvitaan ennen Batch 1:tä

1. **Runtime:** DB multi-tenant + git-ulosvienti (suositus) vai repo-per-site kaikille?
2. **Kiila:** blogi ensin, pääsivu myöhemmin (suositus) vai koko sivu heti?
3. **Kohderyhmä:** vain Rascal AI -asiakkaat (perusta olemassa; suositus) vai myös standalone-Pages ilman Rascal AI:ta? Standalone tarkoittaa, että perusta pitää kerätä Pagesissa erikseen — tuplatyö.
4. **Appetite Batch 1:lle:** 6 viikkoa vs 2 viikkoa pelkälle generaattorille.
5. **Omistajuus:** kuka omistaa Pages-initiativen projektit ja kirjoittaa "Valmis kun" -ehdot Lineariin? Nykyiset neljä projektia ovat kaikki "alustava, täydennä".

---

## 8. Mittarit

| Mittari | Lähtötaso | Tavoite Q4/2026 |
|---|---|---|
| Aika perustasta julkaistuun firmasivuun | ei mitattu (käsityö) | < 15 min |
| Lighthouse mobile, kaikki templatet | ei mitattu | ≥ 95 |
| Rascal AI -blogit, jotka julkaistaan Pagesille | 0 / 345 | 30 % uusista |
| WP-asiakkaat pilotissa | 0 / 12 | 3 siirtynyt |
| Orgaaniset klikit siirtyneillä 90 pv | — | ≥ lähtötaso, ei pudotusta |
| Avoimet High-tietoturvalöydökset | 3 | 0 |
