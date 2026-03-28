import OpenAI from "openai";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Source } from "@/lib/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RetrievedDocument {
  id: string;
  content: string;
  metadata: Record<string, unknown>;
  source_type: string;
  source_url: string | null;
  title: string | null;
  similarity: number;
}

export interface SearchOptions {
  limit?: number;
  threshold?: number;
  sourceTypes?: string[];
}

export interface RAGContext {
  documents: RetrievedDocument[];
  contextBlock: string;
  sources: Source[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EMBEDDING_MODEL = "text-embedding-3-small";
const DEFAULT_LIMIT = 10;
const DEFAULT_THRESHOLD = 0.7;

const NO_CONTEXT_INSTRUCTION =
  "I don't have enough data in the intelligence database to answer this question. " +
  "Try refining your query or check back after the next data refresh.";

// ---------------------------------------------------------------------------
// OpenAI client (lazy singleton)
// ---------------------------------------------------------------------------

let _openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!_openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not configured");
    }
    _openai = new OpenAI({ apiKey });
  }
  return _openai;
}

// ---------------------------------------------------------------------------
// embedQuery — generate embedding vector for a query string
// ---------------------------------------------------------------------------

export async function embedQuery(query: string): Promise<number[]> {
  const openai = getOpenAI();

  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: query,
  });

  return response.data[0].embedding;
}

// ---------------------------------------------------------------------------
// searchDocuments — cosine similarity search via Supabase pgvector
// ---------------------------------------------------------------------------

export async function searchDocuments(
  embedding: number[],
  options?: SearchOptions
): Promise<RetrievedDocument[]> {
  const supabase = createAdminClient();

  const limit = options?.limit ?? DEFAULT_LIMIT;
  const threshold = options?.threshold ?? DEFAULT_THRESHOLD;
  const sourceTypes = options?.sourceTypes?.length
    ? options.sourceTypes
    : null;

  const { data, error } = await supabase.rpc("match_documents", {
    query_embedding: JSON.stringify(embedding),
    match_count: limit,
    match_threshold: threshold,
    filter_source_types: sourceTypes,
  });

  if (error) {
    console.error("[RAG] match_documents error:", error);
    return [];
  }

  return (data ?? []) as RetrievedDocument[];
}

// ---------------------------------------------------------------------------
// retrieveContext — full RAG pipeline: embed query → search → format
// ---------------------------------------------------------------------------

export async function retrieveContext(
  query: string,
  options?: SearchOptions
): Promise<RAGContext> {
  const embedding = await embedQuery(query);
  const documents = await searchDocuments(embedding, options);

  if (documents.length === 0) {
    return {
      documents: [],
      contextBlock: "",
      sources: [],
    };
  }

  // Build numbered source references and context block
  const sources: Source[] = documents.map((doc, i) => ({
    id: doc.id,
    title: doc.title ?? `Source ${i + 1}`,
    type: doc.source_type,
    url: doc.source_url ?? undefined,
    snippet: doc.content.slice(0, 200),
    date: (doc.metadata?.published_at as string) ?? undefined,
  }));

  const contextBlock = documents
    .map(
      (doc, i) =>
        `[${i + 1}] ${doc.title ?? "Untitled"} (${doc.source_type}` +
        `${doc.source_url ? `, ${doc.source_url}` : ""})` +
        `\n${doc.content}`
    )
    .join("\n\n");

  return { documents, contextBlock, sources };
}

// ---------------------------------------------------------------------------
// buildSystemPrompt — assemble the full system prompt with RAG context
// ---------------------------------------------------------------------------

export function buildSystemPrompt(ragContext: RAGContext): string {
  const basePrompt = `You are Raptor, the AI intelligence analyst powering Signaic's competitive intelligence platform for the space and defense sector. You are confident, precise, and analytical.`;

  if (ragContext.documents.length === 0) {
    return (
      basePrompt +
      `\n\nIMPORTANT: You have no relevant intelligence documents for this query. ` +
      `You MUST respond with exactly: "${NO_CONTEXT_INSTRUCTION}"\n` +
      `Do NOT fabricate, speculate, or use general knowledge. Only cite documents provided to you.`
    );
  }

  return (
    basePrompt +
    `\n\nINSTRUCTIONS:
- Answer ONLY based on the intelligence documents provided below.
- Cite sources using numbered references [1], [2], etc. that correspond to the documents below.
- Structure your responses with clear headers and sections.
- When mentioning companies, agencies, or programs, highlight them clearly.
- Focus on actionable intelligence and strategic implications.
- If the provided documents do not contain enough information to fully answer the query, say so explicitly. Do NOT fabricate information.
- NEVER cite sources that are not in the provided documents.

INTELLIGENCE DOCUMENTS:
${ragContext.contextBlock}`
  );
}
