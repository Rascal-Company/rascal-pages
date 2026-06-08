# ADR-0001: Git-native repo-per-site -arkkitehtuuri (Malli B)

- **Status:** Ehdotus (odottaa hyväksyntää)
- **Päivä:** 2026-06-08
- **Konteksti-branch:** `claude/epic-carson-IXWuX`
- **Korvaa osittain:** DB-pohjaisen blogin (`posts`-taulu, `/api/posts`) sisällön lähteenä — ks. "Vaikutus jo tehtyyn".

---

## 1. Konteksti ja tavoite

Rakennetaan "Git-native Webflow/Squarespace": jokaiselle asiakkaalle luodaan
**oma Git-repo**, joka on **täysi, itsenäisesti deployattava sivusto**. Sisältö
kirjoitetaan markdownina (muokattavissa esim. Obsidianilla), sivusto näkyy
subdomainin alla, on liitettävissä omaan domainiin ja **siirrettävissä
asiakkaalle** kokonaisuudessaan.

Ydinlupaukset:
1. **Omistajuus** — asiakas saa oikean, portattavan repon (toisin kuin Webflow/Squarespace lukitsevat).
2. **Smooth sisällöntuotanto** — markdown + Obsidian, git push → julki.
3. **Subdomain + custom domain** — `asiakas.rascalpages.fi` ja oma domain.
4. **Luovutettavuus** — repo (ja deployment) voidaan siirtää asiakkaalle.

### Valittu malli
**Malli B: koko sivu per repo.** Jokainen asiakasrepo on itsenäinen Next.js-app,
joka buildaa ja deployaa erikseen. (Vaihtoehto A = pelkkä sisältörepo jaetulla
runtimella hylättiin, koska se ei anna täyttä omistajuutta/portattavuutta heti.)

**Tietoinen kompromissi:** Malli B tuo N erillistä deploymenttia ja
build-viiveen sisältömuutoksiin. Tämä hyväksytään omistajuus- ja
luovutuslupauksen vuoksi. Operatiivinen kuorma siirretään automaatiolle
(provisiointi GitHub + Vercel API:lla).

---

## 2. Arkkitehtuurin kaksi tasoa

Malli B pakottaa erottamaan **ohjaustason** (yksi SaaS) ja **sivutason** (N reposivua).

```
┌──────────────────────────────────────────────────────────────┐
│  CONTROL PLANE  (nykyinen app.rascalpages.fi + Supabase)       │
│  - Käyttäjät, auth, tilaukset                                  │
│  - Provisiointi: luo repo + Vercel-projekti + domain           │
│  - Rekisteri: site ↔ repo ↔ vercel_project ↔ domainit          │
│  - EI renderöi asiakassivuja                                   │
└───────────────┬──────────────────────────────────────────────┘
                │ provisioi (GitHub API + Vercel API)
                ▼
┌──────────────────────────────────────────────────────────────┐
│  TEMPLATE REPO  ("pohja")  rascal-company/rascal-site-template │
│  - Itsenäinen Next.js-app, sisältö = paikallinen markdown      │
│  - Renderöinti = portatut lohkot/templatet/SEO nykykoodista    │
└───────────────┬──────────────────────────────────────────────┘
                │ generate-from-template (per asiakas)
                ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│ asiakas-A repo │  │ asiakas-B repo │  │ asiakas-C repo │  ...
│ → Vercel proj  │  │ → Vercel proj  │  │ → Vercel proj  │
│ A.rascalpages  │  │ B.rascalpages  │  │ oma-domain.fi  │
└───────────────┘  └───────────────┘  └───────────────┘
```

| Taso | Mikä | Missä |
|------|------|-------|
| **Control plane** | SaaS-hallinta, provisiointi, rekisteri | Nykyinen app + Supabase |
| **Template repo** | Standalone-sivun pohja | Yksi GitHub-template-repo |
| **Asiakasrepo** | Yhden asiakkaan koko sivu + sisältö | N GitHub-repoa + N Vercel-projektia |

---

## 3. Asiakasrepon rakenne (standalone-sivu)

```
rascal-site-<subdomain>/
├─ app/                      # Next.js App Router (portattu pohjasta)
│  ├─ page.tsx               # Etusivu: lukee content/ → renderöi (SSG/ISR)
│  ├─ blog/
│  │  ├─ page.tsx            # Bloglista markdownista
│  │  └─ [slug]/page.tsx     # Yksittäinen postaus
│  ├─ sitemap.xml/route.ts   # SEO (ei host-tietoinen → 1 domain/repo)
│  └─ robots.txt/route.ts
├─ components/               # HeroBlock, BlogListBlock, ... (portattu)
├─ lib/                      # templates.ts, seo.ts, posts.ts (portattu, ei DB)
│  └─ content.ts             # UUSI: markdown-loader (frontmatter → config/post)
├─ content/                  # ← OBSIDIAN-VAULT (asiakkaan sisältö)
│  ├─ site.yml               # templateId, theme, nav, subdomain, customDomain
│  ├─ pages/
│  │  └─ home.md             # hero/about/sections frontmatterina
│  └─ posts/
│     ├─ 2026-06-08-eka.md
│     └─ ...
├─ public/
└─ package.json
```

Keskeinen ero nykyiseen: **sisältö ei tule Supabasesta vaan paikallisista
markdown-tiedostoista**. `lib/content.ts` lukee ne build-aikana ja tuottaa
saman `TemplateConfig`/`Post`-rakenteen, jonka olemassa olevat
renderöintikomponentit jo osaavat.

### Sisältöskeema (markdown + frontmatter)

`content/site.yml`:
```yaml
templateId: personal-brand
theme: { primaryColor: "#0EA5E9", headingFont: Inter }
subdomain: samikiias
customDomain: samikiias.fi      # valinnainen
nav: [{ label: Blogi, href: /blog }]
```

`content/posts/2026-06-08-eka.md`:
```markdown
---
title: Eka kirjoitus
slug: eka-kirjoitus
date: 2026-06-08
excerpt: Lyhyt kuvaus
coverImage: /images/eka.jpg
published: true
---

Markdown-sisältö tähän. Tämä on Obsidian-yhteensopiva.
```

Obsidian avaa `content/`-kansion vaultina; **Obsidian Git -plugin** committaa ja
pushaa automaattisesti → Vercel rebuildaa → julki.

---

## 4. Datavirta: sisällöstä liveksi

```
Obsidian / n8n
   │ (kirjoita markdown, git commit + push)
   ▼
Asiakasrepo (GitHub)
   │ (Vercel Git-integraatio: push → build)
   ▼
Vercel build (SSG/ISR)  ← lib/content.ts lukee content/*.md
   │
   ▼
Live: <subdomain>.rascalpages.fi / oma-domain.fi
```

**n8n:n rooli muuttuu** (vs aiempi /api/posts-ajatus): n8n **committaa markdownia
asiakasrepoon** (GitHub-node) sen sijaan että POSTaisi DB-endpointtiin. Lopputulos
sama (automaattinen sisällön tuotanto), mutta lähde pysyy gitissä — linjassa
Malli B:n kanssa.

---

## 5. Provisiointi (control plane)

Kun asiakkaalle luodaan sivu:

1. **Luo repo** template-reposta — GitHub API `POST /repos/{tmpl}/generate`
   (tai MCP `create_repository` + template). Nimi `rascal-site-<subdomain>`.
2. **Seed-sisältö** — kirjoita `content/site.yml` (subdomain) + starter-markdown
   (esim. `personal-brand`-pohja). GitHub Contents API / commit.
3. **Luo Vercel-projekti** — Vercel API, linkitä repoon, aseta env
   (lead/analytics-keskuspalvelujen osoitteet).
4. **Liitä domain** — Vercel Domains API: lisää `<subdomain>.rascalpages.fi`
   projektille (vaatii wildcard `*.rascalpages.fi` osoittamaan Verceliin).
5. **Ensideploy** — Vercel deploy hook.
6. **Tallenna rekisteriin** — Supabase `sites`: `repo_url`, `vercel_project_id`,
   `subdomain`, `custom_domain`, `owner_org_id`, `status`.

Tämä on automatisoitavissa kokonaan (n8n tai control-plane-server action).

---

## 6. Domainit

| Tarve | Ratkaisu |
|-------|----------|
| `<subdomain>.rascalpages.fi` | Wildcard DNS `*.rascalpages.fi` → Vercel; subdomain liitetään asiakkaan Vercel-projektiin Domains-API:lla |
| Oma domain | Lisää domain asiakkaan Vercel-projektiin; asiakas osoittaa DNS:n |
| Reititys | **Per-projekti** Vercelissä — nykyinen `proxy.ts` multi-tenant-router EI ole tässä mallissa keskeinen (jää control-planeen/ohjaukseen) |

Huom: tämä on iso ero nykyiseen. `proxy.ts`:n hostname-reititys oli jaetun
single-app-mallin ratkaisu; Malli B:ssä jokainen Vercel-projekti omistaa omat
domaininsa, joten keskitettyä rewrite-routeria ei tarvita sivujen näyttämiseen.

---

## 7. Luovutus (transfer / handoff)

Koska asiakasrepo on **täysi standalone-app**, luovutus on suoraviivainen:
- **GitHub:** siirrä repon omistajuus asiakkaalle (Transfer) tai asiakas forkkaa.
- **Vercel:** siirrä projekti asiakkaan tiimiin, tai asiakas yhdistää oman
  Vercel-tilinsä forkattuun repoon.
- Sivu toimii sellaisenaan siirron jälkeen — tämä on Malli B:n pääetu.

---

## 8. Reuse-kartta: mitä nykykoodista siirtyy

| Nykyinen | Malli B:ssä |
|----------|-------------|
| `app/components/blocks/*` (Hero, BlogList, ...) | ✅ Portataan pohjaan sellaisenaan |
| `src/lib/templates.ts` (templatet, `personal-brand`) | ✅ Portataan |
| `SiteRenderer.tsx` | ✅ Portataan (props markdownista DB:n sijaan) |
| `src/lib/seo.ts` (JSON-LD, canonical) | ✅ Portataan |
| `src/lib/posts.ts` (slugify, excerpt, sort, paragraphs) | ✅ Portataan (pudota DB-mappaus) |
| `src/lib/fonts.ts` | ✅ Portataan |
| **UUSI** `lib/content.ts` | 🆕 markdown/frontmatter-loader |
| `posts`-taulu + `/api/posts` (DB-ingestion) | ❌ Ei sisältöpolku B:ssä (git on lähde) |
| `proxy.ts` multi-tenant-router | ➖ Siirtyy control-planeen, ei sivujen renderiin |
| Dashboard / editori / auth | ➖ Jää control-planeen (provisiointi + hallinta) |
| Lead capture / analytics | ✅ Säilyy, mutta osoittaa keskuspalveluun (env) |

**Johtopäätös:** renderöintikerros (lohkot + templatet + SEO) on arvokas,
uudelleenkäytettävä ydin. DB-sisältökerros korvautuu markdown-latauksella.

### Vaikutus jo tehtyyn (tällä branchilla)
- PR #1:n **lohkot, `personal-brand`-templaatti ja SEO-helperit** = suoraan
  pohjaan siirrettävää arvoa.
- PR #1:n **`posts`-taulu, `/api/posts`, `site-queries.ts`** = ei osa Malli B:n
  sisältöpolkua. Vaihtoehdot: (a) jätetään PR #1 "jaetun runtimen" rinnakkaispoluksi,
  tai (b) merkitään supersededuksi tämän ADR:n myötä. **Suositus:** ei mergetä
  PR #1:n DB-osia mainiin ennen kuin malli on lukittu; lohkot/templatet voi
  poimia erikseen pohjarepoon.

---

## 9. Riskit ja avoimet kysymykset

| Riski | Kuvaus | Lieventäminen |
|-------|--------|---------------|
| **Build-viive** | Sisältömuutos = rebuild (sek–min), ei heti | Hyväksytty kompromissi; ISR vain jos sisältö ulkoisesta lähteestä |
| **N deploymentin ops** | Vercel-projekti per asiakas, build-minuutit, projektirajat | Provisiointiautomaatio; seuraa Vercel-tilin limittejä/hinnoittelua |
| **Template-päivitykset** | Pohjan parannukset eivät päivity vanhoihin asiakasrepoihin | Bot-PR:t (template-sync) asiakasrepoihin; semver pohjalle |
| **Salaisuudet repossa** | Lead/analytics tarvitsevat keskusendpointit | Env Vercelissä, ei reposalaisuuksia; keskuspalvelu autentikoi siteId:llä |
| **GitHub/Vercel-rajat** | Repo-/projektimäärät, API-rate-limit | Oma GitHub-org asiakasrepoille; harkitse Vercel-tiimirakennetta |
| **Custom domain self-serve** | DNS-ohjeistus + verifiointi | Vercel Domains API + statusnäkymä dashboardiin |

Avoimet kysymykset päätettäväksi:
1. **Hosting:** Vercel (oletus, paras Git-integraatio) vai jokin muu?
2. **Asiakasrepojen sijainti:** oma GitHub-org (esim. `rascal-sites`) vai asiakkaan oma tili heti?
3. **n8n vs Obsidian Git** ensisijaisena sisältöväylänä — vai molemmat?
4. **Template-versiointi/-päivitys** -strategia (sync-botti).
5. **Lead/analytics** keskuspalvelun rajapinta (säilytetäänkö nykyinen Supabase + actions?).

---

## 10. Vaiheistettu etenemissuunnitelma

| Vaihe | Sisältö | Lopputulos |
|-------|---------|------------|
| **0. Päätökset** | Lukitse hosting (Vercel), repo-org, sisältöskeema | Vahvistettu ADR |
| **1. Pohja-repo** | Standalone Next.js: portaa lohkot/templatet/SEO + `lib/content.ts` (markdown→render), blogi markdownista | 1 repo, manuaalisesti deployattu, renderöinti todistettu |
| **2. Provisiointi** | Control plane: create-from-template + Vercel-projekti + subdomain-liitos + Supabase-rekisteri | "Luo sivu" -nappi → toimiva subdomain-sivu automaattisesti |
| **3. Sisältötyönkulku** | Obsidian Git -ohjeet + n8n-flow joka committaa markdownia repoon | Sisällöntuottaja voi julkaista ilman koodia |
| **4. Domainit + luovutus** | Custom domain self-serve (Vercel Domains API) + repo/projekti-transfer | Asiakas saa oman domainin ja voi ottaa repon haltuun |
| **5. Template-sync** | Bot-PR:t pohjapäivityksistä asiakasrepoihin | Vanhat sivut pysyvät ajan tasalla |

**Seuraava konkreettinen askel:** Vaihe 1 — pystytä pohja-repo ja todista
markdown→render yhdellä esimerkkisivulla (esim. `samikiias`).

---

## 11. Päätös

Hyväksytään **Malli B (repo-per-site, standalone)** yllä kuvatulla
control-plane / template / asiakasrepo -topologialla. Renderöintiydin
(lohkot, templatet, SEO) portataan nykykoodista; sisältö siirtyy
markdown/git-pohjaiseksi. Aloitetaan Vaiheesta 1 hyväksynnän jälkeen.
