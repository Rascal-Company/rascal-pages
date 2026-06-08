# ADR-0002: Skaalaava hybridiarkkitehtuuri (Git lähteenä, keskitetty render)

- **Status:** Ehdotus (odottaa hyväksyntää)
- **Päivä:** 2026-06-08
- **Korvaa skaalauksen osalta:** ADR-0001:n "1 Vercel-projekti per asiakas" -hostingin
- **Tavoite:** skaalata 1000 asiakkaaseen ilman 1000 erillistä deploymenttia

---

## 1. Konteksti

ADR-0001 (repo-per-site) antaa hyvän **omistajuus**tarinan, mutta "1 repo + 1
Vercel-projekti per asiakas" ei skaalaudu halvalla 1000:een: jokainen
sisältömuutos = täysi rebuild, Vercel-projekti/build-minuutti-rajat, raskas
hallinta ja julkaisuviive.

Samaan aikaan käyttäjien pitää voida muokata sivujaan **Rascal Pagesin
dashboardista** (ei pelkkä Obsidian/Git).

## 2. Päätös

**Hybridi:** Git on sisällön lähde ja omistajuuskerros; **yksi keskitetty
multi-tenant runtime renderöi kaikki sivut**. Julkaisu on välitön (ei
per-sivu-buildia). "Eject" tuottaa standalone-repon niille jotka haluavat oman
deploymentin.

### Avainoivallus: keskitetty renderöijä on jo olemassa
Nykyinen Rascal Pages -app (`app/sites/[domain]/page.tsx`) renderöi jo sivuja
**hostnamen mukaan Supabasesta** (`getSiteByDomain`, `pages`, `posts`). Se on
valmis, skaalautuva runtime. Puuttuu vain **Git → Supabase -synkka.**

---

## 3. Arkkitehtuuri

```
┌─────────────────────────────────────────────────────────────────┐
│ ASIAKKAAN GIT-REPO  (sisällön lähde + omistajuus)                 │
│   content/site.json + content/posts/*.md                          │
│   muokkaus: Rascal Pages dashboard  TAI  Obsidian + Git           │
└───────────────┬───────────────────────────────────────────────────┘
                │ push → GitHub webhook
                ▼
┌─────────────────────────────────────────────────────────────────┐
│ INGESTION  (uusi)  POST /api/ingest                               │
│   - varmenna webhook-allekirjoitus                                │
│   - lue muuttuneet content/-tiedostot (GitHub API)                │
│   - parsi (reuse: site-template/lib/content.ts)                   │
│   - upsert → Supabase: sites.settings, pages.content, posts       │
└───────────────┬───────────────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────────┐
│ KESKITETTY RUNTIME  (on jo olemassa)                              │
│   app/sites/[domain] renderöi hostnamen mukaan Supabasesta        │
│   → julkaisu HETI, 1 deployment, skaalautuu 1000:een              │
└─────────────────────────────────────────────────────────────────┘
```

### Muokkaus dashboardista (Git-pohjainen CMS)
```
Käyttäjä dashboardissa (lomakkeet + markdown-editori)
   │ Tallenna
   ▼
GitHub App: commit content/-tiedosto asiakkaan repoon
   │ push → webhook → ingestion → Supabase
   ▼
sivu päivittyy heti
```
- **GitHub App** (ei henkilökohtaisia tokeneita) asennettuna asiakasrepoihin →
  turvallinen commit monessa repossa, korkeat rate-limitit.
- Sama lähde, kaksi pintaa: dashboard (ei-tekninen) + Obsidian/Git (teho).

### Eject (omistajuus säilyy valinnaisena)
Asiakas joka haluaa täyden riippumattomuuden: generoidaan standalone
`site-template`-pohjainen repo hänen sisällöstään → hän deployaa minne haluaa.
Tämä on Model B:n lupaus, mutta vain pyydettäessä — ei oletuksena 1000:lle.

---

## 4. Miksi tämä skaalautuu 1000:een

| | Per-sivu Vercel (ADR-0001) | Hybridi (tämä) |
|---|---|---|
| Deploymentit | 1000 | **1** |
| Julkaisu | rebuild per muutos (sek–min) | **heti** (DB-upsert) |
| Kustannus | 1000 × build-minuutit | DB + serverless (murto-osa) |
| Template-päivitys | bot-PR 1000 repoon | **1 runtime päivittyy kerralla** |
| Omistajuus | natiivi | Git-repo + eject |
| Custom domain | per Vercel-projekti | sama kuin nyt (`sites.custom_domain`) |

GitHub (1000 repoa) ja DNS (wildcard) eivät ole pullonkauloja.

---

## 5. Reuse — paljon on jo tehty

| Komponentti | Tila |
|---|---|
| Keskitetty multi-tenant render (`app/sites/[domain]`) | ✅ olemassa |
| Supabase `sites` / `pages` / `posts` | ✅ olemassa |
| Sisältöparseri `content.ts` (markdown/frontmatter) | ✅ tehty (site-template) |
| Pohja + sisältöskeema | ✅ tehty |
| Provisiointi-lib (repo + seed) | ✅ tehty (luo asiakasrepon) |
| **Ingestion-endpoint `/api/ingest`** | 🆕 rakennettava |
| **GitHub App + webhook-tilaus** | 🆕 rakennettava |
| **Dashboard-CMS (lue/commit repoa)** | 🆕 rakennettava |
| **Eject-generaattori** | 🆕 myöhemmin |

Provisiointi luo edelleen asiakasrepon (sisällön koti), mutta **ei enää Vercel-
projektia per sivu** — sen sijaan rekisteröi sivun keskitettyyn runtimeen +
asentaa GitHub Appin webhookia varten.

---

## 6. Vaiheistettu rakennus

| Vaihe | Sisältö | Tulos |
|---|---|---|
| 1 | `/api/ingest` + `content.ts`-parserin reuse → upsert Supabaseen | Git push → sivu päivittyy keskitetyssä runtimessa |
| 2 | GitHub App + webhook-tilaus asiakasrepoihin | Synkka automaattinen jokaiselle repolle |
| 3 | Provisioinnin muutos: repo + App + rekisteri (ei Vercel-projektia) | "Luo sivu" → repo + heti renderöityvä subdomain |
| 4 | Dashboard-CMS: lue/commit asiakasrepoa (lomakkeet + md-editori) | Ei-tekninen muokkaus UI:sta |
| 5 | Eject-generaattori (standalone-repo asiakkaalle) | Omistajuus pyydettäessä |

**Seuraava konkreettinen askel:** Vaihe 1 — `/api/ingest`, joka ottaa Gitistä
`content/`-sisällön ja upsertaa Supabaseen. Tämä todistaa hybridin yhdellä
sivulla ja nojaa jo tehtyyn `content.ts`-parseriin.

---

## 7. Avoimet kysymykset

1. **Sisällön kanoninen muoto:** pidetäänkö `content/site.json` (sektiot) vai
   muunnetaanko dashboard-CMS kirjoittamaan suoraan Supabasen `pages.content`
   -muotoon ja Git on vain peili? → Ehdotus: **Git kanoninen, DB on cache.**
2. **Konfliktit:** jos sekä dashboard että Obsidian muokkaavat → last-write-wins
   git-tasolla. Riittääkö? → Ehdotus: **kyllä v1**.
3. **Tenant-eristys:** ingestion varmistaa että repo ↔ site_id täsmää
   rekisterissä (ei cross-tenant-kirjoitusta).
4. **Domainit:** custom domain keskitetyssä runtimessa = nykyinen
   `sites.custom_domain` + Vercel-domain pää-appiin (kuten nyt).

## 8. Päätös

Skaalataan **hybridillä**: Git = sisältö/omistajuus, nykyinen multi-tenant app =
keskitetty renderöijä, `/api/ingest` = liima. Per-sivu-Vercel jää vain
eject-vaihtoehdoksi. Aloitetaan Vaiheesta 1.
