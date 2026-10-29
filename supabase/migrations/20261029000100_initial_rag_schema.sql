-- Context RAG database schema
-- Embedding dimension must stay aligned with lib/config.ts.

create extension if not exists vector with schema extensions;

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  file_name text not null check (length(btrim(file_name)) > 0),
  storage_path text not null unique check (length(btrim(storage_path)) > 0),
  page_count integer not null default 0 check (page_count >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  constraint documents_id_user_id_key unique (id, user_id)
);

create table public.chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  content text not null check (length(btrim(content)) > 0),
  page_number integer not null check (page_number > 0),
  chunk_index integer not null check (chunk_index >= 0),
  embedding extensions.vector(768) not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint chunks_document_owner_fkey
    foreign key (document_id, user_id)
    references public.documents (id, user_id)
    on delete cascade,
  constraint chunks_document_chunk_index_key
    unique (document_id, chunk_index)
);

create index documents_user_created_at_idx
  on public.documents (user_id, created_at desc);

create index chunks_user_document_idx
  on public.chunks (user_id, document_id);

create index chunks_embedding_hnsw_idx
  on public.chunks
  using hnsw (embedding extensions.vector_cosine_ops);

alter table public.documents enable row level security;
alter table public.chunks enable row level security;

create policy "Users can view their documents"
  on public.documents
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their documents"
  on public.documents
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their documents"
  on public.documents
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their documents"
  on public.documents
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can view their chunks"
  on public.chunks
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their chunks"
  on public.chunks
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their chunks"
  on public.chunks
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their chunks"
  on public.chunks
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.match_chunks(
  query_embedding extensions.vector(768),
  match_count integer default 6,
  filter_document_ids uuid[] default null
)
returns table (
  content text,
  page_number integer,
  document_id uuid,
  file_name text,
  similarity double precision
)
language sql
stable
security invoker
set search_path = public, extensions
set hnsw.iterative_scan = 'strict_order'
as $$
  select
    c.content,
    c.page_number,
    c.document_id,
    d.file_name,
    1 - (c.embedding <=> query_embedding) as similarity
  from public.chunks as c
  inner join public.documents as d
    on d.id = c.document_id
    and d.user_id = c.user_id
  where c.user_id = (select auth.uid())
    and (
      coalesce(cardinality(filter_document_ids), 0) = 0
      or c.document_id = any(filter_document_ids)
    )
  order by c.embedding <=> query_embedding
  limit least(greatest(coalesce(match_count, 6), 1), 50);
$$;

revoke all on table public.documents from anon;
revoke all on table public.chunks from anon;
grant select, insert, update, delete on table public.documents to authenticated;
grant select, insert, update, delete on table public.chunks to authenticated;

revoke all on function public.match_chunks(extensions.vector, integer, uuid[])
  from public, anon;
grant execute on function public.match_chunks(extensions.vector, integer, uuid[])
  to authenticated;

comment on table public.documents is
  'Metadata for user-owned PDFs stored in the private documents bucket.';
comment on table public.chunks is
  'Page-aware document chunks and their 768-dimensional Gemini embeddings.';
comment on function public.match_chunks(extensions.vector, integer, uuid[]) is
  'Returns the signed-in user''s most similar chunks, optionally filtered by document IDs.';
