-- =============================================================================
-- Session C: RAG Pipeline — Embeddings table + pgvector search
-- =============================================================================

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- =============================================================================
-- Embeddings table: stores chunked document embeddings for RAG
-- =============================================================================
CREATE TABLE IF NOT EXISTS embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  source_type TEXT NOT NULL,           -- e.g. 'news', 'contract', 'orbital', 'regulatory', 'brief'
  source_url TEXT,
  title TEXT,
  embedding vector(1536) NOT NULL,     -- text-embedding-3-small = 1536 dimensions
  embedding_model TEXT NOT NULL DEFAULT 'text-embedding-3-small',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_embeddings_source_type ON embeddings(source_type);
CREATE INDEX IF NOT EXISTS idx_embeddings_created_at ON embeddings(created_at DESC);

-- HNSW index for fast cosine similarity search
CREATE INDEX IF NOT EXISTS idx_embeddings_vector_hnsw ON embeddings
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- =============================================================================
-- RPC function: match_documents
-- Performs cosine similarity search against embeddings table
-- =============================================================================
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(1536),
  match_count INT DEFAULT 10,
  match_threshold FLOAT DEFAULT 0.7,
  filter_source_types TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  metadata JSONB,
  source_type TEXT,
  source_url TEXT,
  title TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.content,
    e.metadata,
    e.source_type,
    e.source_url,
    e.title,
    1 - (e.embedding <=> query_embedding) AS similarity
  FROM embeddings e
  WHERE
    (1 - (e.embedding <=> query_embedding)) > match_threshold
    AND (filter_source_types IS NULL OR e.source_type = ANY(filter_source_types))
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- =============================================================================
-- RLS policies for embeddings table
-- =============================================================================
ALTER TABLE embeddings ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read embeddings (shared intelligence data)
CREATE POLICY "Authenticated users can read embeddings"
  ON embeddings
  FOR SELECT
  TO authenticated
  USING (true);

-- Only service role (agents) can insert/update/delete embeddings
-- No explicit policy needed — service role bypasses RLS
