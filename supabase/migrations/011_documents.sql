-- Documents table for PDF ingestion
create table documents (
  id uuid primary key default gen_random_uuid(),
  artefact_id uuid references standalone_artefacts(id) on delete cascade,
  filename text not null,
  mime_type text not null,
  size_bytes integer,
  file_url text,           -- Supabase storage URL
  thumbnail_url text,      -- First page preview
  extracted_text text,     -- The "useable form" for AI
  page_count integer,
  status text default 'processing' check (status in ('processing', 'ready', 'error')),
  error_message text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_documents_artefact on documents(artefact_id);
create index idx_documents_status on documents(status);

-- RLS policies
alter table documents enable row level security;

-- Users can view documents for artefacts they own
create policy "Users can view own documents"
  on documents for select
  using (
    artefact_id in (
      select id from standalone_artefacts where user_id = auth.uid()
    )
  );

-- Users can insert documents for artefacts they own
create policy "Users can insert own documents"
  on documents for insert
  with check (
    artefact_id in (
      select id from standalone_artefacts where user_id = auth.uid()
    )
  );

-- Users can update their own documents
create policy "Users can update own documents"
  on documents for update
  using (
    artefact_id in (
      select id from standalone_artefacts where user_id = auth.uid()
    )
  );

-- Users can delete their own documents
create policy "Users can delete own documents"
  on documents for delete
  using (
    artefact_id in (
      select id from standalone_artefacts where user_id = auth.uid()
    )
  );

-- Trigger for updated_at
create trigger documents_updated_at
  before update on documents
  for each row
  execute function update_updated_at_column();
