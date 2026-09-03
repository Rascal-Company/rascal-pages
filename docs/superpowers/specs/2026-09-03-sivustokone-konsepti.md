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

## 4b. Priima: mikä erottaa killerin Durablesta

Kaikki AI-builderit tuottavat sivun minuutissa, ja kaikki näyttävät samalta ja lukevat kuin AI. Priima ei synny nopeudesta vaan neljästä asiasta, joissa geneeriset epäonnistuvat joka kerta. Rima ei ole "parempi kuin Durable" vaan **sivu, jota suomalainen toimisto laskuttaisi 8–15 tuhatta ja jota suunnittelija ei häpeäisi.**

**Reunaehto: yksi tekijä.** Pages tehdään yhden hengen voimin Claude Coden kanssa. Siksi jokainen laadun osa on koodia, promptitiedosto tai automaattinen tarkistus, ei manuaalinen suunnittelu- tai reviewvaihe. Look-kirjasto rakennetaan koodina ja iteroidaan screenshoteilla referenssisivuja vasten, ei Figmassa.

### Ulkoasu: art direction datana, ei templateina
- **Look** = yksi TS-tiedosto: kirjasinpari, palettilogiikka, välistysasteikko, kulmat, kuvakäsittely, kompositiosäännöt ja per-blokki varianttivalinnat. Renderöidään nykyisellä tokenimoottorilla (`src/lib/site-theme.ts`). Templatet katoavat; jää look × sivurakenne.
- AI valitsee lookin toimialasta ja ToV:sta. Käyttäjä ei valitse fonttia pudotusvalikosta.
- Kompositiosäännöt: kaksi peräkkäistä sektiota ei jaa rytmiä, hero ei ole aina keskitetty, kuva ei ole aina oikealla. Blokkien cva-varianttimalli (RAS-40) on pohja, mutta variantteja pitää olla 3–4 per blokki.
- Aloitetaan **kolmella lookilla**, ei kymmenellä: yksi luotettava (rakentaminen, teollisuus), yksi editorial (konsultointi, asiantuntija), yksi kirkas (palvelu, kauppa). Jokainen tumma ja vaalea.

### Teksti: tässä 90 % AI-sivuista paljastuu
- Perusta (ICP, ToV, palvelut, pilarit) syötteenä, mutta lisäksi **sektiokohtaiset suomenkieliset copy-säännöt** versioituina promptitiedostoina `prompts/`-kansiossa: hero-otsikko 5–9 sanaa ja konkreettinen lopputulos, ei "Tervetuloa sivuillemme", ei kolmea adjektiivia peräkkäin, ei käännössuomea. Jokaiselle blokille oma briiffi, ei yhtä isoa promptia.
- **Ei koskaan keksittyjä asiakastarinoita.** Testimonial-lohko täyttyy vain oikeasta datasta (CRM, Google-arvostelut, haastattelu) tai jää pois.
- Editoripassi: toinen mallikutsu lukee sivun kokonaisuutena ja korjaa toiston, rytmin ja jargonin.
- Copy-säännöt testataan eval-setillä (20 perustaa → generoitu copy → sääntötarkistus), jotta promptin muutos ei hiljaa huononna laatua.

### Kuvat: ei stockia, ei geneeristä AI-kuvaa
- Per-sivusto **kuvatyyli**: yksi tyylikuvaus (valo, väri, rajaus), jolla kaikki sivun kuvat, OG-kuvat ja blogien kannet generoidaan. Rascal AI:n `preferred_image_model` ja ad-assets-putki ovat pohja.
- Asiakkaan omat kuvat ensisijaisia: upload, automaattinen rajaus ja sävytys lookin mukaan. Kymmenen kännykkäkuvaa työmaalta on parempi kuin täydellinen AI-kuva.

### Laatuportti: älä koskaan näytä huonoa
- Generoi 3 ehdokasta, pisteytä rubriikilla (Lighthouse, copy-säännöt, kontrasti ja saavutettavuus, kompositio, kuvien johdonmukaisuus), näytä vain paras. Jos yksikään ei ylitä rajaa, generoi uudelleen.
- Sama portti pyörii jatkuvasti: blogin lisäys tai käyttäjän muokkaus pisteytetään, ja SEO-paneeli kertoo mikä heikkeni.
- Yhden tekijän mallissa portti korvaa reviewerin: Lighthouse CI:ssä, copy-lint, kontrastitarkistus ja visuaalinen regressio (screenshot per look × blokki) jokaisessa PR:ssä.

### Muokkaus keskustelemalla
- "Tee herosta rohkeampi", "vaihda palvelut kolmeen sarakkeeseen", "kirjoita tämä rennommin". Muutos noudattaa lookia ja copy-sääntöjä. Kanvas jää hienosäätöön. Rakennetaan viimeisenä, koska se on hyödytön ennen kuin kolme ensimmäistä pitävät laadun.

### Priima-testi
Viisi olemassa olevaa asiakasta, generoidut sivut, ulkopuolinen suunnittelija ja kolme asiakasta arvioivat sokkona toimiston sivua vastaan. Jos Pages ei voita vähintään kolmea viidestä, ei olla killeri vielä. Dogfood ensin: Rascalin oma sivu ja Samin sivu Pagesille ennen yhtään asiakasta.

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

### Batch 1 — Build 21.9.–18.10.: "Priima-viipale"
**Ongelma:** Pages tekee landereita promptista, ja lopputulos on samaa tasoa kuin Durablella. Ei kannata generoida viittä sivua, jos yksikään ei ole priimaa.
**Appetite:** 6 viikkoa (A+B).
**Scope:** yksi pystysuora viipale koko laatuketjusta: **yksi look** (editorial) tummana ja vaaleana, copy-säännöt promptitiedostoina + eval-setti, editoripassi, kuvatyyli, laatuportti (3 ehdokasta → paras), monisivuinen generaattori perustasta, Organization/Service/FAQ-skeema, OG-kuvat. Firmasivun perusehdot: evästesuostumus ennen GTM/GA4/Pixel-latausta (nyt ladataan ilman), lookin mukainen 404-sivu, globaali header/footer editoitavina. Dogfood: Rascalin oma sivu ja Samin sivu.
**Ei scopessa:** muut lookit, WP-import, Search Console, keskustelumuokkaus, monikielisyys, Stripe.
**Valmis kun:** Rascalin oma sivu pyörii Pagesilla ja Sami julkaisisi sen häpeämättä; kolme Rascal AI -asiakasta saa "Luo sivusto" -napista 5-sivuisen firmasivun alle 15 minuutissa, ja ulkopuolinen suunnittelija arvioi sokkona vähintään kaksi kolmesta toimistotasoiseksi; Lighthouse mobile ≥ 95; copy-eval läpi ilman sääntörikkeitä.

### Batch 1b — seuraava build: "Kolme lookia ja keskustelu"
**Scope:** kaksi lookia lisää (luotettava, kirkas), 3–4 varianttia per blokki, kompositiosäännöt, keskustelumuokkaus, mediakirjasto, monikielisyys fi/en hreflangilla (moni pk-yritys tarvitsee, nykyinen malli ei tue lainkaan), saavutettavuustarkistus laatuporttiin, SEO-paneeli avainsanadatalla.
**Valmis kun:** priima-testi 3/5 läpi.

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
4. **Appetite Batch 1:lle:** 6 viikkoa priima-viipaleelle vs 2 viikkoa pelkälle generaattorille.
5. **Omistajuus:** kuka omistaa Pages-initiativen projektit ja kirjoittaa "Valmis kun" -ehdot Lineariin? Nykyiset neljä projektia ovat kaikki "alustava, täydennä".
6. **Ensimmäinen look:** editorial (konsultointi, asiantuntija; suositus, koska Rascalin oma sivu ja Samin sivu ovat tätä) vai luotettava (rakentaminen, teollisuus; enemmän WP-asiakkaita)?

---

## 8. Mittarit

| Mittari | Lähtötaso | Tavoite Q4/2026 |
|---|---|---|
| Priima-testi (sokkoarvio vs toimiston sivu) | ei tehty | 3 / 5 voittoa |
| Copy-eval, sääntörikkeet per sivu | ei mitattu | 0 |
| Aika perustasta julkaistuun firmasivuun | ei mitattu (käsityö) | < 15 min |
| Lighthouse mobile, kaikki templatet | ei mitattu | ≥ 95 |
| Rascal AI -blogit, jotka julkaistaan Pagesille | 0 / 345 | 30 % uusista |
| WP-asiakkaat pilotissa | 0 / 12 | 3 siirtynyt |
| Orgaaniset klikit siirtyneillä 90 pv | — | ≥ lähtötaso, ei pudotusta |
| Avoimet High-tietoturvalöydökset | 3 | 0 |
