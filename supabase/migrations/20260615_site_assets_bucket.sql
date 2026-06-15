-- Storage bucket for Pages site images (hero/about/features/cases/OG).
-- Public bucket so published sites can serve images via the CDN; writes are
-- gated to org members, mirroring the existing `user-logos` convention where
-- the first path segment is the owning org id.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-assets',
  'site-assets',
  true,
  5242880, -- 5 MB
  array[
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    'image/avif'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Org members can read site assets"
  on storage.objects for select
  using (
    bucket_id = 'site-assets'
    and (storage.foldername(name))[1] in (
      select org_id::text from org_members where auth_user_id = auth.uid()
    )
  );

create policy "Org members can upload site assets"
  on storage.objects for insert
  with check (
    bucket_id = 'site-assets'
    and auth.uid() is not null
    and (storage.foldername(name))[1] in (
      select org_id::text from org_members where auth_user_id = auth.uid()
    )
  );

create policy "Org members can update site assets"
  on storage.objects for update
  using (
    bucket_id = 'site-assets'
    and (storage.foldername(name))[1] in (
      select org_id::text from org_members where auth_user_id = auth.uid()
    )
  );

create policy "Org members can delete site assets"
  on storage.objects for delete
  using (
    bucket_id = 'site-assets'
    and (storage.foldername(name))[1] in (
      select org_id::text from org_members where auth_user_id = auth.uid()
    )
  );
