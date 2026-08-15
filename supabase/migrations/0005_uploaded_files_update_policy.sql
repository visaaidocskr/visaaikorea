-- Fix: ARC-front (and any "Replace file") upload failed with
-- "new row violates row-level security policy for table uploaded_files".
--
-- registerUploadedFile() uses upsert (INSERT ... ON CONFLICT DO UPDATE) keyed
-- on (application_id, file_type). When a row already exists for that file_type
-- the upsert performs an UPDATE, but uploaded_files only had SELECT/INSERT/
-- DELETE policies — no UPDATE policy — so RLS rejected it. First-time uploads
-- (plain INSERT) worked, which is why only the re-uploaded file (ARC front)
-- failed. Add the missing owner UPDATE policy mirroring the INSERT policy.

drop policy if exists uploaded_files_update on public.uploaded_files;
create policy uploaded_files_update on public.uploaded_files
  for update
  using (user_id = auth.uid() and public.owns_application(application_id))
  with check (user_id = auth.uid() and public.owns_application(application_id));
