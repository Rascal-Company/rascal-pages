-- Luonnos ja julkaisu erikseen: tallennus ei enää vie muutoksia suoraan liveksi.
-- Nykyiset sarakkeet (pages.content, overlay_variants.changes) pysyvät live-
-- versioina, joten julkiset lukijat eivät muutu. Editori kirjoittaa luonnokseen,
-- ja Julkaise kopioi luonnoksen liveksi.

-- Pages: luonnos omassa taulussaan. pages on julkisesti luettava
-- (published = true), joten luonnossarake siellä vuotaisi julkaisemattoman
-- sisällön. Rivi puuttuu = ei luonnosta.
create table if not exists public.page_drafts (
  page_id uuid primary key references public.pages (id) on delete cascade,
  content jsonb not null,
  updated_at timestamp with time zone not null default now()
);

alter table public.page_drafts enable row level security;

create policy "Org member can manage page drafts"
  on public.page_drafts for all to authenticated
  using (
    exists (
      select 1 from public.pages p
      join public.sites s on s.id = p.site_id
      join public.org_members om on om.org_id = s.user_id
      where p.id = page_drafts.page_id and om.auth_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.pages p
      join public.sites s on s.id = p.site_id
      join public.org_members om on om.org_id = s.user_id
      where p.id = page_drafts.page_id and om.auth_user_id = auth.uid()
    )
  );

grant select, insert, update, delete on public.page_drafts to authenticated;
grant all on public.page_drafts to service_role;

-- Overlay: luonnoksen muutokset (esikatselu ja editori); changes = live.
-- overlay_variants on vain jäsenten luettavissa.
alter table public.overlay_variants
  add column if not exists draft_changes jsonb not null default '[]'::jsonb,
  add column if not exists published_at timestamp with time zone;

update public.overlay_variants
  set draft_changes = coalesce(changes, '[]'::jsonb)
  where draft_changes = '[]'::jsonb and changes is not null;
