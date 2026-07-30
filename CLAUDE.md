# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Rascal Pages is a multi-tenant landing page builder SaaS.

For subdomain testing locally, use `test.localhost:3000` which maps to `test.rascalpages.fi`.

## Architecture

Multi-tenant hostname routing lives in `proxy.ts` at the repo root (not `middleware.ts`).

### Organization Model

The system uses an organization-based auth model:
- `auth.users` - Supabase Auth users
- `public.users` - Organizations (single-user companies)
- `org_members` - Links auth users to organizations (`auth_user_id` → `org_id`)
- `sites` - Owned by organizations via `user_id` → `public.users.id`
- `pages` - Belong to sites, store content as JSONB

### Authorization Pattern

All protected endpoints follow this pattern:
1. Get authenticated user from Supabase Auth
2. Look up org membership in `org_members`
3. Verify resource ownership by comparing `user_id` with `org_member.org_id`

## Coding Conventions

- **C-5 (MUST)** Prefer branded `type`s for IDs
  ```ts
  type UserId = Brand<string, 'UserId'>   // ✅ Good
  type UserId = string                    // ❌ Bad
  ```
- **C-6 (MUST)** Use `import type { … }` for type-only imports.
- **C-8 (SHOULD)** Default to `type`; use `interface` only when more readable or interface merging is required.
- **T-1 (MUST)** For a simple function, colocate unit tests in `*.spec.ts` in same directory as source file.

## Git

- **GH-1 (MUST)** Use Conventional Commits format when writing commit messages: https://www.conventionalcommits.org/en/v1.0.0
- **GH-2 (SHOULD NOT)** Refer to Claude or Anthropic in commit messages.

Workflow shortcuts (`qnew`, `qplan`, `qcode`, `qcheck`, `qcheckf`, `qcheckt`, `qux`, `qgit`) are defined as skills in `.claude/skills/`.

## Projektinhallinta — Linear (PM-järjestelmä)

> **Linear on ainoa totuuden lähde devauksen seurannassa.** Cyclet, todot, statukset ja projektien läpivienti hoidetaan Linearissa MCP:n kautta.
>
> **n8n-pm-MCP on DEPRECATED projektinhallinnassa — ÄLÄ käytä sitä cyclien, todojen tai seurannan hallintaan.** n8n jää vain workflow-automaatioon (sisältöputket, integraatiot). Kaikki PM → Linear.

### Työtilan rakenne

- **Team:** `Rascal AI` (key `RAS`, id `f7d82c01-f9b3-414f-95ad-5e849f077c43`). Yksi team kattaa kaikki tuotteet.
- **Initiative = tuote.** Tämä repo (rascal-pages) kuuluu initiativeen **Rascal Pages** (id `63777f09-3aa0-40cc-af0b-5147cf53fb65`).
  - Rascal AI — `19bf46c1-b59f-4ebd-98f0-a8fab96f280b`
  - Rascal CRM — `7b0b6459-9602-464d-a07a-551853dfc5f9`
  - Rascal Pages — `63777f09-3aa0-40cc-af0b-5147cf53fb65` ← **tämä repo**
- **Project = ShapeUp-batch** (Ongelma / Appetite / Scope / Valmis kun). Liitetään initiativeen, `targetDate` kuukausi-/kvartaalitarkkuudella.
- **Cycle = 2 viikon devaussykli.** Cycle 1 = 14.6.–28.6.2026, sen jälkeen aina seuraavat 2 vk. Issuet ajastetaan cycleen.
- **Issue = todo.** Statuspolku: `Backlog → Todo → In Progress → In Review → Done` (lisäksi `Triage`, `Canceled`, `Duplicate`).

### Oletukset uudelle issuelle (todolle)

Kun luot todon devaustyöstä, käytä näitä oletuksia:

- `team`: `RAS`
- `cycle`: nykyinen aktiivinen cycle (hae `list_cycles` `type: current`)
- `state`: `Todo`
- `assignee`: **tekijä joka ajaa Claude Codea juuri nyt — tiimi käyttää tätä, ÄLÄ kovakoodaa Samia.** Käytä `"me"` ellei tekijää ole erikseen kerrottu; voit assignata oikealle tiimin jäsenelle nimellä/emaililla.
- `project`: liitä oikeaan ShapeUp-projektiin jos työ kuuluu sellaiseen.
- `priority`: aseta jos tiedossa (1=Urgent … 4=Low).

Poikkeus: pelkkä ideointi / "joskus myöhemmin" → `state: Backlog`, ei cycleä.

Linear MCP -työkalujen CRUD-referenssi ja cyclen läpivientiohje: skill `linear-workflow` (`.claude/skills/linear-workflow/SKILL.md`).

### Säännöt

- **L-1 (MUST)** Älä käytä n8n-pm-MCP:tä projektinhallintaan. Linear on ainoa PM.
- **L-2 (MUST)** Jokaisella devaustyöllä on Linear-issue ennen mergeä; viittaa siihen branchissa ja commitissa (`RAS-123`).
- **L-3 (SHOULD)** Päivitä issuen status työn edetessä (In Progress → In Review → Done), älä jätä Todoon.
- **L-4 (SHOULD)** Liitä työ oikeaan initiativeen (tuote) ja, jos sopii, ShapeUp-projektiin sekä aktiiviseen cycleen.
- **L-5 (SHOULD NOT)** Älä kovakoodaa assigneeta yhdelle henkilölle — oletus on tekijä itse (`"me"`).

## Testaus — pakollinen framework (`/testing`)

> **Jokaiselle devaustyölle luodaan aina testaussuunnitelma** Rascal HQ:n `/testing`-sivulle. Työ ei ole "Done" ennen kuin suunnitelma on olemassa ja dev-kerros läpi. Tämä koskee **ihmistestausta** (testaaja Julia + myyjät) — koodin automaattitestit ovat eri asia.

Toimintaohjeet: skill `testing-plan` (`.claude/skills/testing-plan/SKILL.md`). Pikakomento **`/qtest`** luo suunnitelman ja vie sen AINA prod-Supabaseen (ref `enrploxjigoyqajoqgkj`), ei koskaan dev-/beta-kantoihin.

- **TP-1 (MUST)** Jokaisella devaustyöllä on testaussuunnitelma ennen "Done".
- **TP-2 (MUST)** Dev-kerroksen checklist täydellä ruksilla ennen testaaja-kerrosta.
- **TP-3 (MUST)** Tason 2 hyväksyy vain superadmin.
- **TP-4 (SHOULD)** Asiakkaalle/myyjille näkyvä muutos → 3-portainen + julkaistu jako.
- **TP-5 (SHOULD)** Fail-löydös → Linear-issue linkitettynä caseen.
