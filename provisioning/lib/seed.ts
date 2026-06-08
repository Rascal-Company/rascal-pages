/**
 * Pure builders for the initial content seeded into a new customer repo.
 * Mirrors the `personal-brand` template shape consumed by site-template's
 * `lib/content.ts`. No I/O — unit tested.
 */

export type SeedFile = { path: string; content: string };

export type SeedInput = {
  subdomain: string;
  customDomain?: string;
  name: string;
  url: string;
};

/** Build the `content/site.json` document (meta + personal-brand sections). */
export function buildSiteJson(input: SeedInput): string {
  const siteConfig = {
    subdomain: input.subdomain,
    ...(input.customDomain ? { customDomain: input.customDomain } : {}),
    site: { name: input.name, url: input.url },
    templateId: "personal-brand",
    theme: { primaryColor: "#0EA5E9", headingFont: "Inter", bodyFont: "Inter" },
    sections: [
      {
        id: "pb-hero-1",
        type: "hero",
        isVisible: true,
        content: {
          title: `Hei, olen ${input.name}`,
          subtitle:
            "Kirjoitan ja jaan ajatuksiani. Täältä näet mitä teen juuri nyt ja luet uusimmat kirjoitukseni.",
          ctaText: "Lue blogia",
          ctaLink: "#blogi",
        },
      },
      {
        id: "pb-about-1",
        type: "about",
        isVisible: true,
        content: {
          name: "Mitä teen juuri nyt",
          bio: "Lyhyt yhteenveto siitä mitä teen juuri nyt: projektit, fokus ja missä minut tavoittaa. Päivitä tätä säännöllisesti.",
        },
      },
      {
        id: "pb-blog-1",
        type: "blog",
        isVisible: true,
        content: {
          heading: "Uusimmat kirjoitukset",
          subheading: "Ajatuksia, oppeja ja kuulumisia.",
          postsToShow: 6,
        },
      },
      { id: "pb-footer-1", type: "footer", isVisible: true, content: null },
    ],
  };

  return `${JSON.stringify(siteConfig, null, 2)}\n`;
}

/** Build a welcome post so the new site renders something on first deploy. */
export function buildWelcomePost(today: string): string {
  return `---
title: Tervetuloa
slug: tervetuloa
date: ${today}
excerpt: Ensimmäinen kirjoitus. Muokkaa tai poista tämä ja kirjoita omasi.
published: true
---

Tämä on uuden sivustosi ensimmäinen kirjoitus.

Sisältö asuu tämän repon \`content/\`-kansiossa markdownina. Avaa kansio
Obsidianilla, kirjoita, ja git push julkaisee muutoksesi.
`;
}

/** All files written into a freshly created customer repo. */
export function buildSeedFiles(input: SeedInput, today: string): SeedFile[] {
  return [
    { path: "content/site.json", content: buildSiteJson(input) },
    { path: "content/posts/tervetuloa.md", content: buildWelcomePost(today) },
  ];
}
