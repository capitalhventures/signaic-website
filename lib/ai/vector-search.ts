import { createAdminClient } from "@/lib/supabase/admin";
import { generateEmbedding } from "@/lib/ai/embeddings";

export interface VectorSearchResult {
  id: string;
  content: string;
  metadata: Record<string, unknown>;
  source_type: string;
  source_url: string | null;
  title: string | null;
  similarity: number;
}

export async function searchDocuments(
  query: string,
  threshold: number = 0.7,
  limit: number = 20
): Promise<VectorSearchResult[]> {
  const embedding = await generateEmbedding(query);
  if (embedding.length === 0) return [];

  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("match_documents", {
    query_embedding: JSON.stringify(embedding),
    match_threshold: threshold,
    match_count: limit,
  });

  if (error) {
    console.error("Vector search error:", error);
    return [];
  }

  return (data as VectorSearchResult[]) || [];
}
