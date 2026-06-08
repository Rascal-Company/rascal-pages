# Domains & DNS (Scope 3)

How customer sites become reachable on a subdomain and on their own domain.

## 1. Wildcard subdomain `*.rascalpages.fi`

One-time infrastructure setup at the DNS provider for `rascalpages.fi`:

```
*.rascalpages.fi   CNAME   cname.vercel-dns.com.
```

With the wildcard pointing at Vercel, every `<subdomain>.rascalpages.fi` resolves
to Vercel. Vercel then routes the host to whichever **project** has claimed that
domain — which `provision-site` does via `addProjectDomain`.

> No central proxy is needed to serve sites: each Vercel project owns its own
> domains. See `PROXY_ROLE.md` for how this differs from the old single-app model.

## 2. Subdomain assignment (automated)

During provisioning:

```ts
await addProjectDomain(vercel, projectId, "samikiias.rascalpages.fi");
```

Because the wildcard already resolves to Vercel, the subdomain is live as soon as
the project's first deploy finishes — no per-site DNS record needed.

## 3. Custom domain (self-serve)

1. Customer enters their domain (e.g. `samikiias.fi`) in the dashboard.
2. Control plane calls `addProjectDomain(vercel, projectId, "samikiias.fi")`.
3. Vercel returns the DNS records the customer must add. Show these:
   - Apex: `A 76.76.21.21` (or the ALIAS/ANAME Vercel returns)
   - `www`: `CNAME cname.vercel-dns.com.`
4. Poll `getDomainStatus(vercel, projectId, domain)` and show:
   - `verified: false` → "Waiting for DNS…"
   - `misconfigured: true` → "Records not detected yet"
   - `verified: true` → "Live ✅"

`addProjectDomain` and `getDomainStatus` live in `lib/vercel.ts`.

## Notes

- TLS certificates are issued automatically by Vercel once a domain verifies.
- Apex-domain support depends on the customer's DNS provider supporting ALIAS/ANAME
  or Vercel's recommended A record.
