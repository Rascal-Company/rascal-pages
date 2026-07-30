---
name: testing-plan
description: Use when finishing dev work (feature, migration, workflow change, or risky fix) to create and run the mandatory human-testing plan in Rascal HQ's /testing page — form fields, tiers 1–3, dev checklist, test cases, approval flow, and public share link. Required before marking a task Done.
---

# Testaussuunnitelman luonti ja läpivienti (`/testing`)

Framework asuu Rascal HQ:n `/testing`-sivulla (sisäiset roolit: admin/superadmin/moderator) ja tallentaa Supabaseen. Säännöt TP-1…TP-5 ovat CLAUDE.md:ssä.

## Milloin luodaan (MUST)

- **Aina** kun tehdään uusi feature, migraatio, workflow-muutos tai fiksi joka voi mennä rikki tai asiakkaalle.
- Suunnitelma luodaan **ennen** kuin työ merkitään valmiiksi. "Done" ≠ done ennen kuin dev-kerros on läpi.

## Miten testaussuunnitelma luodaan

`/testing` → **"Uusi suunnitelma"**. Täytä:

- **Otsikko** (pakollinen) — mitä testataan
- **Tavoite** — mitä halutaan varmistaa ("valmis kun…")
- **Scope** — mitä kuuluu / ei kuulu
- **Alue / moduuli**, **ympäristö** (Tuotanto/Staging)
- **Vastuuhenkilö**, **aloitus + deadline** (sidottu cycleen kun mahdollista)
- **Portaisuus (1–3)** — kuinka monta kerrosta:
  - **1** = pelkkä dev
  - **2** = dev → testaaja (Julia)
  - **3** = dev → testaaja → ryhmätestit (myyjät). Valitse 3 kun muutos näkyy asiakkaalle / myyjille.

Suunnitelman avaa oma sivu (`/testing/:id`), jossa kaikki on muokattavissa.

## Kolme kerrosta

1. **Dev** (kehittäjä) — **checklist-tyyppinen** (checkbox) gate: e2e-testit, build/lint, n8n-workflow validoitu, migraatiot & RLS testattu, manuaalinen läpiklikkaus. Käytä **"+ oletustarkistukset"** -nappia dev-kerroksessa saadaksesi vakiokohdat, ja lisää työkohtaiset. Kaikki ruksit vihreänä ennen kuin viet eteenpäin.
2. **Testaaja (Julia)** — käy caset läpi. Kun valmis, painaa **"Pyydä hyväksyntää"** → kerros menee tilaan *Odottaa hyväksyntää*.
3. **Ryhmätestit (myyjät)** — jaettava dokkari (ks. julkinen jako).

## Testicaset

Suunnitelman alle luodaan **testicaset** (mitä konkreettisesti testataan). Jokaiselle:

- **Testiaskeleet** (toistettavuus), **odotettu tulos**, **toteutunut tulos**
- **Status**: Testaamatta / Toimii / Ei toimi / Estynyt
- **Palaute**: kirjaa **"mikä ei toimi JA miten se ei toimi"** — ei nappien nimiä, vaan logiikka. Fail-caseen **vakavuus** + **Linear-issue-linkki** (löydös ei saa kadota).
- **Media**: liitä kuvia/videoita validointievidenssiksi. (Jos `VITE_N8N_IMAGE_VALIDATION_URL` on asetettu, "Validoi (AI)" vertaa kuvaa scopeen GPT-4o visionilla.)

## Hyväksyntä (MUST)

- **Vain superadmin** voi kuitata **tason 2 (testaaja-kerros)** hyväksytyksi. Pakotettu DB-triggerillä (`enforce_stage_approval`), ei pelkkä UI-esto.
- Virta: Julia → *Pyydä hyväksyntää* → superadmin **Hyväksy / Hylkää** + perustelu Kommentit-kenttään.

## Julkinen jako (ryhmätestit)

Detail-sivun **"Julkaise linkki"** → syntyy kirjautumaton read-only-URL `…/jaettu/testi/:token`, jaettavaksi myyjille. "Sulje jako" peruuttaa heti. Turvallinen: `SECURITY DEFINER` -RPC palauttaa vain julkaistun suunnitelman, ei avaa tauluja anon-roolille.
