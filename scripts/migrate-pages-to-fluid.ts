/**
 * Kertaluontoinen migraatio (RAS-1102): kaikkien sivujen osiot vapaiksi osioiksi.
 *
 *   npx tsx --env-file=.env.local scripts/migrate-pages-to-fluid.ts           # kuivaharjoitus
 *   npx tsx --env-file=.env.local scripts/migrate-pages-to-fluid.ts --apply   # kirjoittaa
 *   npx tsx scripts/migrate-pages-to-fluid.ts --input pages.json > migrate.sql   # SQL Supabaseen
 *
 * --input: JSON-taulukko [{ id, slug, subdomain, content }] (esim. Supabasen SQL-editorista
 * `select json_agg(...) from pages`), tulostaa varmuuskopion + update-lauseet yhtenä
 * transaktiona ajettavaksi, kun DATABASE_URL ei ole käytettävissä.
 *
 * --apply ottaa ensin varmuuskopion tauluun pages_backup_ras1102 ja tekee kaiken
 * yhdessä transaktiossa. Aja vasta, kun vapaita osioita tukeva koodi on tuotannossa.
 * Palautus: update pages p set content = b.content from pages_backup_ras1102 b where b.id = p.id;
 */
import { Client } from "pg";
import { nanoid } from "nanoid";
import { migrateToSections } from "@/app/components/editor/utils/contentUtils";
import { convertPageToFluid } from "@/src/lib/fluid-convert";

const apply = process.argv.includes("--apply");
const inputIndex = process.argv.indexOf("--input");
const inputFile = inputIndex !== -1 ? process.argv[inputIndex + 1] : null;

type PageRow = { id: string; slug: string; subdomain: string; content: unknown };

function convertRows(rows: PageRow[], log: (line: string) => void) {
  const updates: { id: string; content: unknown }[] = [];
  for (const row of rows) {
    const before = migrateToSections(row.content as never);
    const after = convertPageToFluid(before, () => nanoid(10));
    const label = `${row.subdomain}/${row.slug}`.padEnd(32);
    if (after === before && JSON.stringify(row.content) === JSON.stringify(after)) {
      log(`${label} ok (jo vapaa)`);
      continue;
    }
    log(`${label} ${before.sections.map((s) => s.type).join(",")}  →  ${after.sections.map((s) => s.type).join(",")}`);
    updates.push({ id: row.id, content: after });
  }
  return updates;
}

function sqlLiteral(value: string) {
  return `'${value.replace(/'/g, "''")}'`;
}

async function fromFile(file: string) {
  const { readFile } = await import("node:fs/promises");
  const rows = JSON.parse(await readFile(file, "utf8")) as PageRow[];
  const updates = convertRows(rows, (line) => console.error(line));
  console.log("begin;");
  console.log("create table if not exists pages_backup_ras1102 as table pages with no data;");
  console.log("insert into pages_backup_ras1102 select * from pages where not exists (select 1 from pages_backup_ras1102);");
  for (const update of updates) {
    console.log(
      `update pages set content = ${sqlLiteral(JSON.stringify(update.content))}::jsonb, updated_at = now() where id = ${sqlLiteral(update.id)};`,
    );
  }
  console.log("commit;");
  console.error(`\n${rows.length} sivua, ${updates.length} muunnettavaa.`);
}

async function main() {
  if (inputFile) return fromFile(inputFile);

  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL puuttuu");
  const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await client.connect();

  try {
    const { rows } = await client.query<PageRow>(
      `select p.id, p.slug, s.subdomain, p.content
         from pages p join sites s on s.id = p.site_id
        order by s.subdomain, p.slug`,
    );

    const updates = convertRows(rows, (line) => console.log(line));

    console.log(`\n${rows.length} sivua, ${updates.length} muunnettavaa.`);
    if (!apply) {
      console.log("Kuivaharjoitus: mitään ei kirjoitettu. Aja --apply kirjoittaaksesi.");
      return;
    }

    await client.query("begin");
    await client.query("create table if not exists pages_backup_ras1102 as table pages with no data");
    const { rows: backup } = await client.query<{ n: number }>("select count(*)::int n from pages_backup_ras1102");
    if (backup[0].n === 0) {
      await client.query("insert into pages_backup_ras1102 select * from pages");
      console.log("Varmuuskopio: pages_backup_ras1102");
    } else {
      console.log("Varmuuskopio on jo olemassa — ei kirjoiteta yli.");
    }
    for (const update of updates) {
      await client.query("update pages set content = $1, updated_at = now() where id = $2", [
        JSON.stringify(update.content),
        update.id,
      ]);
    }
    await client.query("commit");
    console.log(`Kirjoitettu ${updates.length} sivua.`);
  } catch (error) {
    if (apply) await client.query("rollback").catch(() => {});
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
