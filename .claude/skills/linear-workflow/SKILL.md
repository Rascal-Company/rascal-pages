---
name: linear-workflow
description: Linear issue/cycle management for the RAS team — use when creating or updating todos, starting or finishing dev work, or running a cycle/project via the Linear MCP tools.
---

Linear-työnkulku Rascal-tiimille (team `RAS`). Työtilan rakenne, issue-oletukset ja säännöt L-1…L-5 ovat CLAUDE.md:ssä — noudata niitä aina.

## CRUD — Linear MCP -työkalut

Kaikki työkalut ovat prefiksillä `mcp__claude_ai_Linear__`.

**Read**
- `list_cycles` (`teamId`, `type: current|previous|next`) — hae aktiivinen cycle.
- `list_issues` (`assignee:"me"`, `cycle`, `project`, `state`, `query`) — mikä on työn alla / cyclessä.
- `get_issue` (id, esim. `RAS-123`) — yksittäisen todon detaljit.
- `list_projects` (`team`, `initiative`) — ShapeUp-batchit. `get_project` koko speksiin.
- `list_issue_statuses`, `list_users` — tarkista statukset / tiimin jäsenet.

**Create / Update** (sama työkalu; `id` mukana ⇒ päivitys, ilman ⇒ luonti)
- `save_issue` — luo/päivitä todo. Luonnissa pakolliset `title` + `team`. Käytä `assignee` (EI `assigneeId`), `state`, `cycle`, `project`, `description` (markdown — oikeat rivinvaihdot, ei `\n`-escapeja).
- `save_project` — luo/päivitä ShapeUp-projekti. Luonnissa `name` + `addTeams:["RAS"]` + `addInitiatives:["Rascal Pages"]`.
- `save_comment` — kommentoi issueta/projektia (`issueId`/`projectId` + `body`).
- Issuen `links`-kenttä (tai `create_attachment_from_upload`) — liitä PR/commit/dokumentti.

## Läpivienti — miten CC ajaa cyclen/projektin

1. **Aloita:** `list_issues assignee:"me" cycle:current state:"Todo"` → valitse seuraava todo.
2. **Ota työn alle:** `save_issue id:RAS-xxx state:"In Progress"`.
3. **Devaa:** branchin nimeen issue-tunnus, esim. `feature/RAS-123-lyhyt-kuvaus`. Kirjoita `RAS-123` commit-/PR-otsikkoon tai -bodyyn → Linear linkittää automaattisesti. `Fixes RAS-123` PR:ssä siirtää issuen Doneen mergessä.
4. **Reviewiin:** PR auki → `save_issue id:RAS-xxx state:"In Review"` ja lisää PR issuen `links`-kenttään.
5. **Valmis:** merge → `Done` (automaattisesti magic wordilla tai `save_issue state:"Done"`).
6. **Työ ilman valmista todoa:** luo ensin issue (oletukset CLAUDE.md:ssä), sitten kohdasta 2 eteenpäin.
