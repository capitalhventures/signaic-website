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
const DEFAULT_LIMIT = 8;
const DEFAULT_THRESHOLD = 0.5;

// Common stop words excluded from keyword relevance checks
const STOP_WORDS = new Set([
  "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "could",
  "should", "may", "might", "shall", "can", "need", "dare", "ought",
  "used", "to", "of", "in", "for", "on", "with", "at", "by", "from",
  "as", "into", "through", "during", "before", "after", "above", "below",
  "between", "out", "off", "over", "under", "again", "further", "then",
  "once", "here", "there", "when", "where", "why", "how", "all", "both",
  "each", "few", "more", "most", "other", "some", "such", "no", "nor",
  "not", "only", "own", "same", "so", "than", "too", "very", "just",
  "about", "what", "which", "who", "whom", "this", "that", "these",
  "those", "am", "but", "and", "or", "if", "while", "because", "until",
  "it", "its", "i", "me", "my", "we", "our", "you", "your", "he", "him",
  "his", "she", "her", "they", "them", "their",
]);

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
// extractKeywords — tokenize text into meaningful keywords (no stop words)
// ---------------------------------------------------------------------------

function extractKeywords(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w))
  );
}

// ---------------------------------------------------------------------------
// filterByKeywordRelevance — drop documents with zero keyword overlap
// ---------------------------------------------------------------------------

function filterByKeywordRelevance(
  query: string,
  documents: RetrievedDocument[]
): { relevant: RetrievedDocument[]; excluded: RetrievedDocument[] } {
  const queryKeywords = extractKeywords(query);
  const relevant: RetrievedDocument[] = [];
  const excluded: RetrievedDocument[] = [];

  for (const doc of documents) {
    const docText = `${doc.title ?? ""} ${doc.content.slice(0, 500)}`;
    const docKeywords = extractKeywords(docText);

    let overlap = 0;
    Array.from(queryKeywords).forEach((kw) => {
      if (docKeywords.has(kw)) overlap++;
    });

    if (overlap > 0) {
      relevant.push(doc);
    } else {
      excluded.push(doc);
    }
  }

  return { relevant, excluded };
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

  // Keyword relevance filter: exclude documents with zero keyword overlap
  const { relevant, excluded } = filterByKeywordRelevance(query, documents);

  if (excluded.length > 0) {
    console.log(
      `[RAG] Keyword filter excluded ${excluded.length} document(s):`,
      excluded.map((d) => `"${d.title}" (similarity=${d.similarity.toFixed(3)})`)
    );
  }

  if (relevant.length === 0) {
    console.log("[RAG] All documents excluded by keyword filter");
    return {
      documents: [],
      contextBlock: "",
      sources: [],
    };
  }

  // Build numbered source references and context block from relevant docs only
  const sources: Source[] = relevant.map((doc, i) => ({
    id: doc.id,
    title: doc.title ?? `Source ${i + 1}`,
    type: doc.source_type,
    url: doc.source_url ?? undefined,
    snippet: doc.content.slice(0, 200),
    date: (doc.metadata?.published_at as string) ?? undefined,
  }));

  const contextBlock = relevant
    .map(
      (doc, i) =>
        `[${i + 1}] ${doc.title ?? "Untitled"} (${doc.source_type}` +
        `${doc.source_url ? `, ${doc.source_url}` : ""})` +
        `\n${doc.content}`
    )
    .join("\n\n");

  return { documents: relevant, contextBlock, sources };
}

// ---------------------------------------------------------------------------
// buildSystemPrompt — assemble the full system prompt with RAG context
// ---------------------------------------------------------------------------

export function buildSystemPrompt(ragContext: RAGContext): string {
  const basePrompt = `You are Raptor, the AI intelligence analyst powering Signaic's competitive intelligence platform for the space and defense sector. You are confident, precise, and analytical. You ALWAYS provide substantive, multi-paragraph answers to intelligence queries.`;

  if (ragContext.documents.length === 0) {
    return (
      basePrompt +
      `\n\nINSTRUCTIONS:
No relevant documents were found in the Signaic intelligence database for this query.

Your response MUST use this structure:

## Strategic Analysis
- Answer the question using your general knowledge of the space and defense sector.
- Provide a thorough, multi-paragraph response with clear headers and sub-sections.
- NEVER include citation brackets like [1], [2], or [Source: ...] in this section. This is your expert analysis, not database-sourced intelligence.
- When mentioning companies, agencies, or programs, highlight them clearly.
- Focus on actionable intelligence and strategic implications.
- End with a note: "This analysis is based on general intelligence knowledge. As Signaic's database expands coverage of this topic, future responses will include sourced intelligence."`
    );
  }

  return (
    basePrompt +
    `\n\nINSTRUCTIONS:
Your response MUST be split into exactly two sections in this order:

## Intelligence from Signaic Database
- ONLY include this section if one or more of the provided documents are DIRECTLY relevant to answering the question.
- Every factual claim in this section MUST cite a specific document using the format: [Source: {document title}, {source type}].
- Only cite a document if the claim you are making actually appears in or is directly supported by that document's content. Do NOT cite a document just because it was retrieved — read the content and verify the match.
- If you cannot tie a specific claim to a specific document, that claim belongs in Strategic Analysis, not here.
- If NONE of the provided documents are directly relevant, SKIP this section entirely and only write Strategic Analysis.

## Strategic Analysis
- Provide your expert analysis, synthesis, broader context, and any information from general knowledge.
- NEVER include any citation brackets [1], [2], [Source: ...] or references to documents in this section. This section is clearly your AI analysis and synthesis.
- This section should always be substantive — provide strategic implications, competitive context, and forward-looking assessment.

CRITICAL RULES:
- A citation in "Intelligence from Signaic Database" must match actual content in the cited document. Mismatched citations destroy credibility.
- "Strategic Analysis" must NEVER have citations. Period.
- If the documents below are about a different topic than the user's question, SKIP "Intelligence from Signaic Database" entirely.

INTELLIGENCE DOCUMENTS:
${ragContext.contextBlock}`
  );
}
