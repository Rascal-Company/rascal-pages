# Rascal Site Template (pohja)

Git-native, standalone landing + blog site. Content lives in this repo as
markdown + JSON and is rendered statically by Next.js — **no database**.

This is the "pohja" from which each customer site is generated. See
`ARCHITECTURE_REPO_PER_SITE.md` in the parent repo for the full model.

## Content model

| File | Purpose |
|------|---------|
| `content/site.json` | Site meta (subdomain, custom domain, name, url) + `TemplateConfig` (theme + sections) |
| `content/posts/*.md` | Blog posts: flat frontmatter + markdown body |

### Post frontmatter (locked v1 schema)

Frontmatter is a **flat** `key: value` block (no nested YAML):

```markdown
---
title: My first post
slug: my-first-post        # optional; derived from title if omitted
date: 2026-06-08           # ISO date → publishedAt
excerpt: Short summary     # optional; derived from body if omitted
coverImage: /cover.jpg     # optional
published: true            # only "true" publishes; anything else = draft
---

Markdown body goes here.
```

The loader lives in `lib/content.ts`. Pure parsing (`parseFrontmatter`,
`frontmatterToPost`) is unit-tested in `lib/content.spec.ts`.

## Editing with Obsidian

Open the `content/` folder as an Obsidian vault. Write posts as markdown. With
the Obsidian Git plugin, commits + pushes happen automatically; each push
triggers a rebuild and the post goes live. (Wired up in a later scope.)

## Commands

```bash
npm install
npm run dev     # local dev at http://localhost:3000
npm run build   # static production build
npm run test    # run unit tests
```

## What renders today

The `personal-brand` block set: **hero · about · blog · footer**. Additional
blocks (features, faq, testimonials, form, logos, video) will be ported next.
