# Editing this site with Obsidian (Scope 4)

Your whole site's content lives in `content/`. You never need a code editor or a
dashboard — just write markdown.

## Vault structure

```
content/
├─ site.json              # site meta + sections (theme, hero, about, …)
└─ posts/
   ├─ 2026-06-01-my-post.md
   └─ ...
```

Open the **`content/` folder** as an Obsidian vault (Open folder as vault).

## Writing a post

Create a file under `content/posts/` and start with frontmatter (a flat
`key: value` block), then write your post in markdown:

```markdown
---
title: My post title
slug: my-post-title       # optional — derived from the title if omitted
date: 2026-06-08          # publish date
excerpt: One-line summary # optional — derived from the body if omitted
coverImage: /cover.jpg    # optional
published: true           # must be exactly "true" to go live; otherwise a draft
---

Your content here. Blank lines separate paragraphs.
```

Save as a draft by setting `published: false` — it won't appear on the site.

## Publishing automatically (Obsidian Git)

1. Install the **Obsidian Git** community plugin.
2. Point it at this repo (the vault is the repo's `content/` folder, the repo is
   the parent).
3. Enable "Auto commit-and-push" (e.g. every 5 minutes, or on save).

Now every save is committed and pushed. Each push triggers a Vercel rebuild, and
your post is live within a minute. No dashboard, no lock-in — just text files you
own.

## Editing the landing page

`site.json` holds the home page sections (hero/about/blog/footer). Edit the
`content` of each section to change headings, bio, CTA, etc. Keep it valid JSON.

## Automated content (n8n)

The same git push that you do by hand can be done by automation. See
`n8n-workflow-content-to-repo.json` in the repo root: it composes a markdown post
and commits it to this repo via the GitHub API — useful for AI-assisted or
scheduled publishing.
