-- Ladattavat tiedostot landereille (RAS-1115): lomakkeen lahja (lead magnet)
-- ja painikkeen suora lataus. Yksityinen bucket: kävijä saa tiedoston vain
-- palvelimen allekirjoittamalla, lyhytikäisellä linkillä. Polku on
-- <org_id>/<site_id>/<gated|public>/<tiedosto>, ja kirjoitus on rajattu
-- organisaation jäsenille kuten site-assets-bucketissa.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-downloads',
  'site-downloads',
  false,
  26214400, -- 25 MB
  array[
    'application/pdf',
    'application/zip',
    'application/epub+zip',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/csv',
    'image/png',
    'image/jpeg'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Org members can read site downloads"
  on storage.objects for select
  using (
    bucket_id = 'site-downloads'
    and (storage.foldername(name))[1] in (
      select org_id::text from org_members where auth_user_id = auth.uid()
    )
  );

create policy "Org members can upload site downloads"
  on storage.objects for insert
  with check (
    bucket_id = 'site-downloads'
    and auth.uid() is not null
    and (storage.foldername(name))[1] in (
      select org_id::text from org_members where auth_user_id = auth.uid()
    )
  );

create policy "Org members can delete site downloads"
  on storage.objects for delete
  using (
    bucket_id = 'site-downloads'
    and (storage.foldername(name))[1] in (
      select org_id::text from org_members where auth_user_id = auth.uid()
    )
  );
