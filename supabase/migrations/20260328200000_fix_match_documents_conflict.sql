-- Fix: Drop the old match_documents function from the original repo
-- which queries individual tables with embedded columns.
-- Keep only the new version that queries the centralized embeddings table.

-- Drop the old 3-param version (query_embedding, match_threshold, match_count)
DROP FUNCTION IF EXISTS public.match_documents(vector, float, int);

-- Drop and recreate the new version cleanly
DROP FUNCTION IF EXISTS public.match_documents(vector, int, float, text[]);

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
    (1 - (e.embedding <=> query_embedding))::FLOAT AS similarity
  FROM embeddings e
  WHERE
    (1 - (e.embedding <=> query_embedding)) > match_threshold
    AND (filter_source_types IS NULL OR e.source_type = ANY(filter_source_types))
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
