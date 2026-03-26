import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/lib/api-utils";
import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase/admin";

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

export async function POST(request: NextRequest) {
  // Authenticate with AGENT_SECRET_KEY
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token || token !== process.env.AGENT_SECRET_KEY) {
    return apiError("Unauthorized", 401);
  }

  const startTime = Date.now();
  const today = new Date().toISOString().split("T")[0];

  try {
    const supabase = createAdminClient();

    // Query recent records from all source tables
    const twentyFourHoursAgo = new Date(
      Date.now() - 24 * 60 * 60 * 1000
    ).toISOString();

    const sourcesConsulted: Record<string, number> = {};
    const contextSections: string[] = [];

    for (const table of SOURCE_TABLES) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select("*")
          .gte("created_at", twentyFourHoursAgo)
          .order("created_at", { ascending: false })
          .limit(50);

        if (error) {
          sourcesConsulted[table] = 0;
          continue;
        }

        sourcesConsulted[table] = data?.length || 0;
        if (data && data.length > 0) {
          contextSections.push(
            `## ${table.replace(/_/g, " ").toUpperCase()} (${data.length} records)\n\n` +
              data
                .slice(0, 10)
                .map((r) => JSON.stringify(r, null, 2))
                .join("\n\n")
          );
        }
      } catch {
        sourcesConsulted[table] = 0;
      }
    }

    const totalRecords = Object.values(sourcesConsulted).reduce(
      (a, b) => a + b,
      0
    );

    const context =
      totalRecords === 0
        ? "NO DATA AVAILABLE: No source tables have been populated yet. Generate a briefing based on your knowledge of current space and defense industry developments. Note all items as synthesized from general intelligence rather than specific source documents."
        : `# Intelligence Data Summary\n\nTotal records: ${totalRecords}\n\n${contextSections.join("\n\n---\n\n")}`;

    // Call Claude API
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: MERIDIAN_SYSTEM_PROMPT.replace("{DATE}", today),
      messages: [
        {
          role: "user",
          content: `Here is the intelligence data from the last 24 hours:\n\n${context}\n\nGenerate the Daily Intelligence Briefing. Return only valid JSON.`,
        },
      ],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonStr = jsonMatch ? jsonMatch[1].trim() : responseText.trim();
    const briefing = JSON.parse(jsonStr);
    briefing.sources_consulted = sourcesConsulted;

    // Upsert into daily_briefings
    const { error: upsertError } = await supabase
      .from("daily_briefings")
      .upsert(
        {
          briefing_date: today,
          items: briefing.items,
          sources_consulted: Object.entries(sourcesConsulted).map(
            ([name, count]) => ({
              name,
              count,
              lastUpdated: new Date().toISOString(),
            })
          ),
          generated_at: new Date().toISOString(),
        },
        { onConflict: "briefing_date" }
      );

    if (upsertError) {
      throw new Error(`Upsert failed: ${upsertError.message}`);
    }

    // Log success
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
      // agent_logs table may not exist yet
    }

    return apiResponse({
      success: true,
      briefing_date: today,
      items_count: briefing.items.length,
      briefing,
      duration_ms: Date.now() - startTime,
    });
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);

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
      // Silently fail
    }

    return apiError(`Meridian failed: ${error}`, 500);
  }
}
