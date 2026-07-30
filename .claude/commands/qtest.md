---
description: Luo devaustyölle testaussuunnitelma /testing-protokollan mukaan ja vie se Rascal HQ:n PROD-Supabaseen (hyväksynnän jälkeen)
---

# QTEST — testaussuunnitelma pikakomennolla

Luo tälle devaustyölle ihmistestauksen testaussuunnitelma `/testing`-protokollan mukaan. Protokolla: skill `testing-plan` (`.claude/skills/testing-plan/SKILL.md`) + CLAUDE.md:n TP-säännöt.

## Vaiheet

1. **Kerää konteksti**: `git diff` nykyisestä branchista päähaaraa (`main`) vasten; Linear-issue branchin nimestä (`feature/RAS-123-…` → RAS-123, hae otsikko/kuvaus `get_issue`llä jos MCP saatavilla).
2. **Laadi luonnos** lomakkeen kentillä:
   - **Otsikko** — mitä testataan
   - **Tavoite** — "valmis kun …"
   - **Scope** — mitä kuuluu / ei kuulu
   - **Alue/moduuli** ja **Ympäristö** (oletus: Tuotanto)
   - **Vastuuhenkilö** — komennon ajaja; ÄLÄ kovakoodaa ketään (L-5-henki)
   - **Aloitus + deadline** — sidottu aktiiviseen cycleen (`list_cycles type:current`)
   - **Portaisuus 1–3** — valitse 3 jos muutos näkyy asiakkaalle/myyjille (TP-4), muuten 1–2; perustele valinta
   - **Dev-checklist** — oletustarkistukset (e2e-testit, build/lint, n8n-workflow validoitu, migraatiot & RLS testattu, manuaalinen läpiklikkaus) + työkohtaiset lisäykset
   - **Testicaset** — jokaiselle testiaskeleet + odotettu tulos; status jää "Testaamatta"
3. **Näytä luonnos käyttäjälle ja pyydä hyväksyntä.** Älä kirjoita kantaan mitään ennen hyväksyntää.
4. **Vie PROD-Supabaseen** (säännöt alla) tai anna paste-ready-sisältö.
5. Muistuta lopuksi: TP-2 (dev-checklist täysin vihreä ennen testaajakerrosta) ja TP-5 (fail-caset → Linear-issue).

## Kanta — AINA prod (MUST)

- Testaussuunnitelmat asuvat **vain** Rascal HQ:n **tuotanto**-Supabasessa, projekti-ref **`enrploxjigoyqajoqgkj`**. Taulut: `test_plans`, `test_stages` (sis. `checklist` jsonb), `test_cases`.
- **Ennen inserttiä varmista kohde**: aja MCP-serverin `get_project_url` ja tarkista että ref on täsmälleen `enrploxjigoyqajoqgkj`. Jos ei ole, **ÄLÄ kirjoita**. Suunnitelmia ei koskaan viedä dev-/beta-/branch-projekteihin — tätä on sattunut aiemmin, siksi tämä tarkistus on pakollinen.
- Jos millään käytettävissä olevalla Supabase-MCP:llä ei pääse prod-projektiin, tulosta suunnitelma **paste-ready**-muodossa `/testing` → "Uusi suunnitelma" -lomakkeeseen vietäväksi äläkä kirjoita kantaan.
- Vain INSERT näihin tauluihin. Ei skeemamuutoksia, ei olemassa olevien rivien päivityksiä, ei muita tauluja.
