# Handoff / transfer (Scope 5)

Because each customer site is a complete standalone repo, ownership can be handed
over cleanly. This is the differentiator: customers own and can leave with their
site (unlike Webflow/Squarespace).

## Automated step

```bash
npm run transfer -- <subdomain> <customer-github-login>
```

`transfer-site.ts` calls the GitHub repo-transfer API
(`POST /repos/{owner}/{repo}/transfer`). After GitHub emails the new owner to
accept, the repo lives under their account.

## Manual steps (Vercel + verification)

The Vercel side is done from the dashboard (Vercel has no public project-transfer
API):

1. **Vercel project** — either
   - Move the project to the customer's Vercel team, **or**
   - Have the customer connect their own Vercel account to the transferred repo
     (Import Project → pick the repo).
2. **Env vars** — re-create production env (e.g. `SITE_CENTRAL_API`) in the
   customer's project.
3. **Custom domain** — re-verify the domain under the new owner.

## Handoff checklist

- [ ] GitHub repo transferred to the customer
- [ ] Vercel project moved to the customer's account (or repo reconnected)
- [ ] Production env vars re-created in the customer's Vercel project
- [ ] Custom domain re-verified under the new owner
- [ ] Customer confirmed they can edit `content/` and push

## What the customer keeps

A working Next.js site they fully control: content in `content/`, editable in
Obsidian, deployable anywhere. No lock-in.
