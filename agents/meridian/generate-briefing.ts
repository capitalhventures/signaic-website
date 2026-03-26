import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

// Load .env.local when running standalone
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  require("dotenv").config({ path: ".env.local" });
}

const SOURCE_TABLES = [
  "fcc_filings",
  "orbital_data",
  "patents",
  "contracts",
  "sec_filings",
  "news",
  "federal_register",
  "sbir_awards",
  "sam_opportunities",
];

interface BriefingEntity {
  name: string;
  slug: string;
  type: "company" | "agency" | "program";
}

interface BriefingSource {
  id: string;
  title: string;
  type: string;
  url: string;
}

interface BriefingItem {
  headline: string;
  synthesis: string;
  entities: BriefingEntity[];
  impact: "high" | "medium" | "low";
  sources: BriefingSource[];
}

interface BriefingResponse {
  items: BriefingItem[];
  sources_consulted: Record<string, number>;
  data_gaps: string[];
}

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    }
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function queryRecentRecords(supabase: any) {
  const twentyFourHoursAgo = new Date(
    Date.now() - 24 * 60 * 60 * 1000
  ).toISOString();

  const results: Record<string, { count: number; records: unknown[] }> = {};

  for (const table of SOURCE_TABLES) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .gte("created_at", twentyFourHoursAgo)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        // Table likely doesn't exist yet
        console.warn(`[MERIDIAN] Table '${table}' not available: ${error.message}`);
        results[table] = { count: 0, records: [] };
        continue;
      }

      results[table] = { count: data?.length || 0, records: data || [] };
      console.log(`[MERIDIAN] ${table}: ${data?.length || 0} records in last 24h`);
    } catch (err) {
      console.warn(`[MERIDIAN] Error querying '${table}':`, err);
      results[table] = { count: 0, records: [] };
    }
  }

  return results;
}

function buildContextDocument(
  results: Record<string, { count: number; records: unknown[] }>
): string {
  const sections: string[] = [];
  let totalRecords = 0;

  for (const [table, { count, records }] of Object.entries(results)) {
    totalRecords += count;
    if (count === 0) continue;

    sections.push(
      `## ${table.replace(/_/g, " ").toUpperCase()} (${count} records)\n\n` +
        records
          .slice(0, 10)
          .map((r) => JSON.stringify(r, null, 2))
          .join("\n\n")
    );
  }

  if (totalRecords === 0) {
    return "NO DATA AVAILABLE: No source tables have been populated yet. Generate a briefing based on your knowledge of current space and defense industry developments. Note all items as synthesized from general intelligence rather than specific source documents.";
  }

  return `# Intelligence Data Summary\n\nTotal records across all sources: ${totalRecords}\n\n${sections.join("\n\n---\n\n")}`;
}

const MERIDIAN_SYSTEM_PROMPT = `You are MERIDIAN, Signaic's Senior Intelligence Analyst. You have 20 years of experience in space and defense intelligence. Your job is to synthesize raw data from multiple intelligence sources into actionable briefings for senior executives and analysts in the space and defense sector.

You are generating the Daily Intelligence Briefing for {DATE}.

RULES:
- Produce exactly 3 intelligence items, ranked by strategic impact
- Each item must have: a headline (max 15 words), a synthesis paragraph (2-3 sentences explaining what happened, why it matters, and what to watch next), entity tags (companies/agencies/programs mentioned), an impact rating (high/medium/low), and source citations referencing specific documents
- Write in confident, precise intelligence analyst voice. No hedging, no filler.
- Focus on: competitive moves, regulatory changes, contract awards, spectrum allocation shifts, orbital deployments, and patent filings that signal strategic intent
- If insufficient data exists for 3 high-quality items, generate items based on the most significant available data and note data gaps
- Return valid JSON matching this schema:
{
  "items": [
    {
      "headline": "string",
      "synthesis": "string",
      "entities": [{"name": "string", "slug": "string", "type": "company|agency|program"}],
      "impact": "high|medium|low",
      "sources": [{"id": "string", "title": "string", "type": "string", "url": "string"}]
    }
  ],
  "sources_consulted": {"table_name": record_count},
  "data_gaps": ["string"]
}`;

async function generateBriefing(): Promise<{
  success: boolean;
  briefing?: BriefingResponse;
  error?: string;
}> {
  const startTime = Date.now();
  const today = new Date().toISOString().split("T")[0];
  console.log(`[MERIDIAN] Starting briefing generation for ${today}`);

  try {
    // 1. Connect to Supabase
    const supabase = createAdminClient();

    // 2. Query recent records
    const sourceData = await queryRecentRecords(supabase);

    // 3. Build context document
    const context = buildContextDocument(sourceData);

    // 4. Call Claude API
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });

    const systemPrompt = MERIDIAN_SYSTEM_PROMPT.replace("{DATE}", today);

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Here is the intelligence data from the last 24 hours:\n\n${context}\n\nGenerate the Daily Intelligence Briefing. Return only valid JSON.`,
        },
      ],
    });

    // 5. Parse response
    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Extract JSON from potential markdown code blocks
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonStr = jsonMatch ? jsonMatch[1].trim() : responseText.trim();

    const briefing: BriefingResponse = JSON.parse(jsonStr);

    // Add source counts
    const sourcesConsulted: Record<string, number> = {};
    for (const [table, { count }] of Object.entries(sourceData)) {
      sourcesConsulted[table] = count;
    }
    briefing.sources_consulted = sourcesConsulted;

    // 6. Upsert into daily_briefings table
    const { error: upsertError } = await supabase
      .from("daily_briefings")
      .upsert(
        {
          briefing_date: today,
          items: briefing.items,
          sources_consulted: Object.entries(sourcesConsulted).map(
            ([name, count]) => ({ name, count, lastUpdated: new Date().toISOString() })
          ),
          generated_at: new Date().toISOString(),
        },
        { onConflict: "briefing_date" }
      );

    if (upsertError) {
      console.error(`[MERIDIAN] Upsert error:`, upsertError);
      return { success: false, error: upsertError.message };
    }

    // 7. Log to agent_logs
    try {
      await supabase.from("agent_logs").insert({
        agent_name: "meridian",
        run_type: "daily_briefing",
        status: "success",
        summary: `Generated ${briefing.items.length} intelligence items`,
        details: {
          briefing_date: today,
          items_count: briefing.items.length,
          sources_consulted: sourcesConsulted,
          data_gaps: briefing.data_gaps,
          duration_ms: Date.now() - startTime,
        },
      });
    } catch {
      console.warn("[MERIDIAN] Could not write to agent_logs (table may not exist yet)");
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(
      `[MERIDIAN] Briefing generated successfully in ${duration}s - ${briefing.items.length} items`
    );

    return { success: true, briefing };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error(`[MERIDIAN] Failed:`, error);

    // Log failure
    try {
      const supabase = createAdminClient();
      await supabase.from("agent_logs").insert({
        agent_name: "meridian",
        run_type: "daily_briefing",
        status: "error",
        summary: `Briefing generation failed: ${error}`,
        details: { error, duration_ms: Date.now() - startTime },
      });
    } catch {
      // Silently fail if agent_logs doesn't exist
    }

    return { success: false, error };
  }
}

// Export for use in API route
export { generateBriefing };

// Run standalone
if (require.main === module) {
  generateBriefing().then((result) => {
    if (result.success) {
      console.log("\n[MERIDIAN] === BRIEFING ===");
      console.log(JSON.stringify(result.briefing, null, 2));
      process.exit(0);
    } else {
      console.error(`\n[MERIDIAN] FAILED: ${result.error}`);
      process.exit(1);
    }
  });
}
