-- Store the clearance captured by the extension.
-- Apply in the Supabase SQL editor for project aeoyohqyhawxulisdvqj.

alter table public.jobs add column if not exists clearance text;
alter table public.extension_job_submissions add column if not exists clearance text;
