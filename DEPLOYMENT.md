# Vercel Deployment Guide

## Esivalmistelut

### 1. Asenna Vercel CLI (valinnainen, mutta suositeltava)

```bash
npm i -g vercel
```

### 2. Kirjaudu Verceliin

```bash
vercel login
```

## Deployment-vaiheet

### Vaihtoehto A: Vercel Dashboard (Suositeltu ensimmäisellä kerralla)

1. **Mene Vercel Dashboardiin**
   - Avaa https://vercel.com/
   - Kirjaudu sisään GitHub-tilillä

2. **Lisää uusi projekti**
   - Klikkaa "Add New..." → "Project"
   - Valitse GitHub-repositorio: `Rascal-Company/rascal-pages`
   - Klikkaa "Import"

3. **Konfiguroi projekti**
   - **Framework Preset**: Next.js (automaattisesti tunnistettu)
   - **Root Directory**: `./` (juurihakemisto)
   - **Build Command**: `npm run build` (oletuksena)
   - **Output Directory**: `.next` (oletuksena)
   - **Install Command**: `npm install` (oletuksena)

4. **Lisää ympäristömuuttujat (Environment Variables)**

   Klikkaa "Environment Variables" ja lisää seuraavat:

   **Production, Preview & Development:**
   ```
   NEXT_PUBLIC_SUPABASE_URL=<your_supabase_url>
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your_anon_key>
   SUPABASE_SERVICE_ROLE_KEY=<your_service_role_key>
   NEXT_PUBLIC_ROOT_DOMAIN=rascalpages.fi
   DATABASE_URL=<your_database_url>
   N8N_RASCALPAGES_LEADS=<your_webhook_url>
   N8N_LANDINGPAGE_BUILDER=<your_webhook_url>
   ```

5. **Deploy**
   - Klikkaa "Deploy"
   - Odota että build valmistuu (näet live-lokit)

### Vaihtoehto B: Vercel CLI

```bash
# Linkitä projekti Verceliin (ensimmäisellä kerralla)
vercel link

# Lisää ympäristömuuttujat
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add NEXT_PUBLIC_ROOT_DOMAIN
vercel env add DATABASE_URL
vercel env add N8N_RASCALPAGES_LEADS
vercel env add N8N_LANDINGPAGE_BUILDER

# Deploy production
vercel --prod

# Tai deploy preview
vercel
```

## Domain-asetukset

### 1. Päädomaini (app.rascalpages.fi)

1. Mene Vercel Dashboard → Settings → Domains
2. Lisää domain: `app.rascalpages.fi`
3. Lisää DNS-tietue domainpalveluusi:
   ```
   Type: CNAME
   Name: app
   Value: cname.vercel-dns.com
   ```

### 2. Wildcard-subdomainit (*.rascalpages.fi)

1. Lisää domain: `*.rascalpages.fi`
2. Lisää DNS-tietue:
   ```
   Type: CNAME
   Name: *
   Value: cname.vercel-dns.com
   ```

### 3. Root domain (rascalpages.fi)

1. Lisää domain: `rascalpages.fi`
2. Lisää DNS-tietueet:
   ```
   Type: A
   Name: @
   Value: 76.76.21.21

   Type: AAAA
   Name: @
   Value: 2606:4700:4700::1111
   ```

## Monitoring ja Debugging

### Logit

- **Build logs**: Vercel Dashboard → Deployments → [valitse deployment] → Building
- **Runtime logs**: Vercel Dashboard → [projekti] → Logs
- **Real-time logs CLI**:
  ```bash
  vercel logs <deployment-url> --follow
  ```

### Analytics

Vercel tarjoaa ilmaiset analytiikkasivut:
- Speed Insights: Näet sivujen latausajat
- Web Analytics: Käyttäjädata ilman evästeitä

Aktivoi: Settings → Analytics → Enable

### Error Tracking

Seuraa virheitä:
1. Settings → Integrations
2. Lisää joku seuraavista:
   - Sentry (suositeltava)
   - Datadog
   - LogDNA

## Ongelmatilanteita

### Build epäonnistuu

```bash
# Testaa build lokaalisti
npm run build

# Tarkista ympäristömuuttujat
vercel env ls

# Katso yksityiskohtaiset logit
vercel logs <deployment-url>
```

### Middleware-ongelmat

Middleware.ts vaatii Edge Runtime -tuen:
- Tarkista että käytät vain Edge-yhteensopivia paketteja
- Varmista että Supabase client on konfiguroitu oikein

### Supabase-yhteysongelmat

- Varmista että DATABASE_URL sisältää `?pgbouncer=true` jos käytät Supabase Pooler
- Tarkista että Supabase API keys ovat oikein
- Vercel Edge Functions käyttävät Supabase Auth middlewarea

## Automaattiset deploymentit

Vercel deployaa automaattisesti kun:
- **main-branch**: Production deployment (app.rascalpages.fi)
- **feature-branchit**: Preview deployment (unique URL)
- **Pull Requestit**: Preview deployment + kommentti PR:ään

### Deployment Protection

Suojaa preview-deploymentit salasanalla:
1. Settings → Deployment Protection
2. Enable "Password Protection for Preview Deployments"

## Environment Variable -strategia

- **Production**: Tuotannon tiedot (todellinen Supabase, N8N, etc.)
- **Preview**: Testidatan tiedot (staging Supabase)
- **Development**: Lokaali kehitysympäristö (.env.local)

Päivitä muuttujia:
```bash
vercel env rm VARIABLE_NAME production
vercel env add VARIABLE_NAME production
```

## Hyödyllisiä komentoja

```bash
# Näytä projektin tila
vercel inspect

# Listaa kaikki deploymentit
vercel ls

# Poista vanha deployment
vercel rm <deployment-url>

# Tarkastele projektin asetuksia
vercel project ls
```

## Webhook-notifikaatiot

Saat Slack/Discord-notifikaatiot deploymenteista:
1. Settings → Git → Deploy Hooks
2. Lisää webhook URL
3. Valitse tapahtumat (deployment.created, deployment.succeeded, etc.)
