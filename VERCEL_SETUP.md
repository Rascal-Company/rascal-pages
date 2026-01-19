# Vercel Deploy -ohjeet

## Vaihtoehto 1: Vercel Dashboard (Suositeltu)

### 1. Yhdistä GitHub-repo Verceliin

1. Mene [vercel.com](https://vercel.com) ja kirjaudu sisään
2. Klikkaa **"Add New..."** → **"Project"**
3. Valitse **"Import Git Repository"**
4. Valitse `slemppa/rascal-pages`-repo
5. Klikkaa **"Import"**

### 2. Konfiguroi projektin asetukset

Vercel tunnistaa Next.js-projektin automaattisesti. Varmista että:
- **Framework Preset**: Next.js
- **Root Directory**: `./` (oletus)
- **Build Command**: `npm run build` (oletus)
- **Output Directory**: `.next` (oletus)

### 3. Aseta ympäristömuuttujat

Ennen deployausta, klikkaa **"Environment Variables"** ja lisää:

#### Production, Preview, ja Development:

```
DATABASE_URL=postgres://postgres.enrploxjigoyqajoqgkj:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres
```

**Tärkeää**: Käytä **session mode pooleria** (portti 5432), ei transaction modea (6543)!

```
NEXT_PUBLIC_SUPABASE_URL=https://enrploxjigoyqajoqgkj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR_ANON_KEY]
```

### 4. Deploy

1. Klikkaa **"Deploy"**
2. Odota että build valmistuu
3. Testaa että `/dashboard`-sivu toimii

### 5. Tarkista deploy

- Vercel luo automaattisesti URL:n muodossa: `rascal-pages-xxx.vercel.app`
- Jokainen push `main`-haaraan triggeröi uuden deployn
- Preview-deployt luodaan automaattisesti pull requesteista

## Vaihtoehto 2: Vercel CLI (lokaalisti)

Jos haluat käyttää CLI:a, aja terminaalissa:

```bash
# Kirjaudu Verceliin
vercel login

# Linkitä projekti (ensimmäinen kerta)
vercel link

# Deploy productioniin
vercel --prod

# Tai deploy previewyn
vercel
```

Ympäristömuuttujat täytyy asettaa Vercel Dashboardissa, ei CLI:llä.

## Ongelmien ratkaisu

### Database connection error Vercelissä

1. Tarkista että `DATABASE_URL` käyttää **session mode pooleria** (portti 5432)
2. Varmista että salasana on oikein
3. Tarkista Supabase Dashboardista että IP-osoitteet eivät ole estettyjä

### SSL errors

Vercelissä SSL:n pitäisi toimia automaattisesti, koska `db.ts` käyttää `rejectUnauthorized: true` production-ympäristössä.

## Automaattinen deploy

Kun pushaat `main`-haaraan GitHubiin, Vercel deployaa automaattisesti uuden version.
