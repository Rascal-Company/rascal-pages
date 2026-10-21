/**
 * Kehityskäyttöön (RAS-624): hakee referenssit ja ajaa generoinnin tallentamatta.
 *   npx tsx --env-file=.env.local scripts/dev/reference-dry-run.ts [--own] [--goal "…"] url1 url2
 * Tulostaa runkojen koot ja tyyliyhteenvedon; sivun JSON stdoutiin --json-lipulla.
 */
import { nanoid } from "nanoid";
import { fetchReferenceSkeleton } from "@/src/lib/reference-fetch";
import { generateReferencePage } from "@/src/lib/reference-ai";
import type { BrandContext } from "@/src/lib/overlay-campaign";

const args = process.argv.slice(2);
const own = args.includes("--own");
const json = args.includes("--json");
const goalIndex = args.indexOf("--goal");
const goal = goalIndex !== -1 ? args[goalIndex + 1] : "Kävijä varaa maksuttoman kartoituksen.";
const urls = args.filter((a, i) => !a.startsWith("--") && i !== goalIndex + 1);

const brand: BrandContext = {
  companyName: "Rascal AI",
  website: "https://rascalai.fi",
  industry: "Markkinointiteknologia",
  language: "suomi",
  companySummary: "Rascal AI on suomalainen markkinoinnin tekoälyalusta pk-yrityksille: some-sisällöt, blogit, SEO ja mainonta samasta paikasta brändin äänensävyllä.",
  icpSummary: "Suomalaiset 5–50 hengen pk-yritykset, joilla ei ole omaa markkinointitiimiä.",
  buyerPersona: "Yrittäjä tai myyntijohtaja, jolla ei ole aikaa markkinointiin.",
  tov: "Suora, lämmin, ei jargonia.",
  voiceAnchor: null,
};

async function main() {
  const started = Date.now();
  const fetched = await Promise.all(urls.map(fetchReferenceSkeleton));
  for (const r of fetched) {
    if (r.ok) console.error(`✓ ${r.skeleton.url}: runko ${r.skeleton.outline.length} merkkiä, fontit ${r.skeleton.fonts.join(", ")}, värit ${r.skeleton.colors.slice(0, 5).join(" ")}, muuttujia ${Object.keys(r.skeleton.cssVars).length}`);
    else console.error(`✗ ${r.url}: ${r.error}`);
  }
  console.error(`Haku ${Date.now() - started} ms`);
  const skeletons = fetched.flatMap((r) => (r.ok ? [r.skeleton] : []));
  if (skeletons.length === 0) return;

  const page = await generateReferencePage(brand, { mode: own ? "own" : "inspiration", goal }, skeletons, () => nanoid(10));
  console.error(`Yhteensä ${Date.now() - started} ms`);
  if (!page.ok) return console.error("VIRHE:", page.error);
  console.error("Tyyli:", page.styleSummary);
  console.error("Teema:", JSON.stringify(page.content.theme));
  for (const s of page.content.sections) {
    const c = s.content as { blocks?: { type: string; content: { text?: string; label?: string; sectionType?: string } }[]; navLabel?: string };
    const first = c?.blocks?.find((b) => b.type === "text")?.content.text ?? c?.blocks?.[0]?.content.sectionType ?? s.type;
    console.error(`  - ${s.type} ${c?.navLabel ? `[${c.navLabel}] ` : ""}${s.style?.background ? "(muted) " : ""}${String(first).slice(0, 70)}`);
  }
  if (json) console.log(JSON.stringify(page.content));
}

main();
