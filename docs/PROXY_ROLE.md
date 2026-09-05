# The role of `proxy.ts`

Rascal Pages is **one Next.js app, one Vercel project, many tenants**. There is
no per-site repo and no per-site deployment: every customer site is rows in
Supabase (`sites` + `pages`), rendered on request by this app.

That makes `proxy.ts` (the root middleware — note: not `middleware.ts`) the
single most important routing component in the system. It inspects the request
`Host` header and rewrites to an internal route:

| Host | Rewrites to | Serves |
|------|-------------|--------|
| `rascalpages.fi`, `www.rascalpages.fi` | `/home/*` | Our own marketing site |
| `app.rascalpages.fi` | `/app/*` | Dashboard / editor (auth required) |
| `<tenant>.rascalpages.fi` | `/sites/<tenant>` | Customer site on its subdomain |
| any other host | `/sites/<host>` | Customer site on its own domain |

The rewrite is internal — the visitor's URL never changes.

## How a customer domain reaches us

A customer points DNS at our shared Vercel project and nothing else:

1. The domain is saved on the site (`app/actions/update-domain.ts`), which also
   registers it with the Vercel project via `src/lib/vercel-domains.ts`.
2. `recommendedDnsRecord()` tells the customer which record to add at their
   registrar — an `A` record for an apex domain, a `CNAME` for a subdomain.
3. Vercel issues TLS once DNS resolves; `proxy.ts` then routes the host to the
   right tenant.

**Nameservers are never delegated to us.** The customer adds one record and
keeps full control of the rest of the zone, so they are free to point other
subdomains (`app.`, `api.`, `mail.`) anywhere they like. This matters: a
customer can run their marketing and legal pages here on `www.` while their
actual product lives on `app.` somewhere else entirely.

## Host resolution has two implementations — keep them in sync

`proxy.ts` does the rewrite, but routes that bypass the rewrite and read the raw
`Host` header themselves (`sitemap.xml`, `robots.txt`) use
`hostToSiteDomain()` in `src/lib/domains.ts`. The two must agree on how a host
maps to a site key. `domains.ts` carries the unit tests; change both together.

The site key resolves through `getSiteByDomain()` in `src/lib/site-queries.ts`,
which matches the value against **either** `sites.subdomain` or
`sites.custom_domain`. A host that matches neither renders as not found.

## Why not a repo per site

An earlier proposal (ADR-0001, "Malli B") would have given every customer their
own GitHub repo and Vercel project, trading operational simplicity for
portability. It was never approved and has been removed: N sites meant N
deployments and a rebuild for every content change, and the rendering blocks had
to be duplicated into a template repo where they immediately drifted from
`app/components/blocks/`.

The shared-runtime model keeps one copy of the blocks, publishes content changes
instantly, and still lets a customer use their own domain. If portability is ever
needed again, solve it with an export rather than by splitting the runtime.
