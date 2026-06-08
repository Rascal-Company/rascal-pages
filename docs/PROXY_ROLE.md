# The role of `proxy.ts` in the repo-per-site model (Scope 3)

## Old model (single-app multi-tenant)

`proxy.ts` (the middleware) inspected the request `Host` and rewrote it to an
internal route in **one** Next.js deployment:

| Host | Rewrites to |
|------|-------------|
| `app.rascalpages.fi` | `/app/*` |
| `*.rascalpages.fi` | `/sites/[subdomain]` |
| custom domains | `/sites/[domain]` |

All tenant sites were served by a single app that fetched content from Supabase
per request. The middleware was essential: it was the router that mapped a host
to the right tenant.

## New model (repo-per-site)

Each customer site is its **own Vercel project** that owns its domains. Routing
host → site is done by **Vercel + DNS** (wildcard `*.rascalpages.fi` → Vercel,
then Vercel matches the host to the project that claimed it). There is no shared
app rendering tenant sites, so **no host-based rewrite middleware is needed to
serve customer sites**.

`site-template` therefore ships **without** `proxy.ts` — its `next build` output
above confirms only the site's own static routes.

## What happens to `proxy.ts`

It stays in the **control-plane** app (`app.rascalpages.fi`) for what that app
still does — dashboard/editor/auth routing. It is no longer on the path for
serving published customer sites.

| Concern | Old | New |
|---------|-----|-----|
| Host → site routing | `proxy.ts` rewrite | Vercel project domains + wildcard DNS |
| Content fetch | Supabase per request | local markdown at build time |
| Custom domains | `sites.custom_domain` + middleware | Vercel Domains API per project |
| Control-plane (dashboard) routing | `proxy.ts` | `proxy.ts` (unchanged) |
