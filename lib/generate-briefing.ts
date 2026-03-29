import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase/admin";

const SYSTEM_PROMPT = `You are MERIDIAN, Signaic's intelligence analyst. Generate a daily intelligence briefing for space and defense professionals. The briefing should be structured as:

## Daily Intelligence Briefing - {DATE}

### Executive Summary
3-4 sentence overview of the most significant developments in the last 24 hours.

### Key Developments
Top 5 developments, each with:
- A clear headline
- 2-3 sentence analysis of significance
- Source attribution

### Sector Analysis
Brief analysis organized by sector:
- Launch & Access to Space
- Satellite Operations & Communications
- Defense & National Security
- Policy & Regulation
- Commercial & Investment

### Risk & Opportunity Watch
2-3 items that analysts should monitor.

### Data Summary
- Total sources analyzed: {TOTAL_COUNT}
- New contracts identified: {CONTRACT_COUNT}
- Regulatory updates: {REGULATORY_COUNT}
- Space weather status: {WEATHER_SUMMARY}

Be concise, analytical, and actionable. Write for senior executives and analysts who need to make decisions based on this intelligence.`;

interface SourceQueryResult {
  table: string;
  count: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  records: any[];
}

async function queryAllSources(supabase: ReturnType<typeof createAdminClient>): Promise<SourceQueryResult[]> {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const results: SourceQueryResult[] = [];

  // News - latest 20 by published_at
  try {
    const { data } = await supabase
      .from("news")
      .select("title, summary, source, published_at, url")
      .gte("published_at", twentyFourHoursAgo)
      .order("published_at", { ascending: false })
      .limit(20);
    results.push({ table: "news", count: data?.length || 0, records: data || [] });
  } catch { results.push({ table: "news", count: 0, records: [] }); }

  // RSS feeds - latest 30 by published_at
  try {
    const { data } = await supabase
      .from("rss_feeds")
      .select("title, description, source, published_at, url")
      .gte("published_at", twentyFourHoursAgo)
      .order("published_at", { ascending: false })
      .limit(30);
    results.push({ table: "rss_feeds", count: data?.length || 0, records: data || [] });
  } catch { results.push({ table: "rss_feeds", count: 0, records: [] }); }

  // Government contracts - latest 10 by created_at
  try {
    const { data } = await supabase
      .from("gov_contracts")
      .select("title, agency, amount, contractor, description, created_at")
      .gte("created_at", twentyFourHoursAgo)
      .order("created_at", { ascending: false })
      .limit(10);
    results.push({ table: "gov_contracts", count: data?.length || 0, records: data || [] });
  } catch { results.push({ table: "gov_contracts", count: 0, records: [] }); }

  // SEC filings - latest 10 by filed_date
  try {
    const { data } = await supabase
      .from("sec_filings")
      .select("company_name, form_type, filed_date, description")
      .gte("created_at", twentyFourHoursAgo)
      .order("filed_date", { ascending: false })
      .limit(10);
    results.push({ table: "sec_filings", count: data?.length || 0, records: data || [] });
  } catch { results.push({ table: "sec_filings", count: 0, records: [] }); }

  // Federal Register - latest 10 by publication_date
  try {
    const { data } = await supabase
      .from("federal_register")
      .select("title, agency, type, publication_date, abstract")
      .gte("created_at", twentyFourHoursAgo)
      .order("publication_date", { ascending: false })
      .limit(10);
    results.push({ table: "federal_register", count: data?.length || 0, records: data || [] });
  } catch { results.push({ table: "federal_register", count: 0, records: [] }); }

  // SAM opportunities - latest 5 by created_at
  try {
    const { data } = await supabase
      .from("sam_opportunities")
      .select("title, agency, type, posted_date, description")
      .gte("created_at", twentyFourHoursAgo)
      .order("created_at", { ascending: false })
      .limit(5);
    results.push({ table: "sam_opportunities", count: data?.length || 0, records: data || [] });
  } catch { results.push({ table: "sam_opportunities", count: 0, records: [] }); }

  // Space weather - latest 5 by issue_time
  try {
    const { data } = await supabase
      .from("space_weather")
      .select("*")
      .order("issue_time", { ascending: false })
      .limit(5);
    results.push({ table: "space_weather", count: data?.length || 0, records: data || [] });
  } catch { results.push({ table: "space_weather", count: 0, records: [] }); }

  // Conjunction events - top 5 closest approaches
  try {
    const { data } = await supabase
      .from("conjunction_events")
      .select("*")
      .order("min_range_km", { ascending: true })
      .limit(5);
    results.push({ table: "conjunction_events", count: data?.length || 0, records: data || [] });
  } catch { results.push({ table: "conjunction_events", count: 0, records: [] }); }

  return results;
}

function buildContextDocument(sources: SourceQueryResult[]): string {
  const sections: string[] = [];

  for (const { table, count, records } of sources) {
    if (count === 0) {
      sections.push(`## ${table.replace(/_/g, " ").toUpperCase()}\nNo new records in the last 24 hours.`);
      continue;
    }
    const recordText = records
      .map((r) => JSON.stringify(r, null, 2))
      .join("\n\n");
    sections.push(`## ${table.replace(/_/g, " ").toUpperCase()} (${count} records)\n\n${recordText}`);
  }

  return `# Intelligence Data - Last 24 Hours\n\n${sections.join("\n\n---\n\n")}`;
}

function extractKeyDevelopments(content: string): { title: string; source: string; significance: string }[] {
  const developments: { title: string; source: string; significance: string }[] = [];
  const keyDevSection = content.match(/### Key Developments\n([\s\S]*?)(?=\n### |$)/);
  if (!keyDevSection) return developments;

  const items = keyDevSection[1].match(/(?:\d+\.\s*|\-\s*)\*\*([^*]+)\*\*[:\s]*([\s\S]*?)(?=(?:\d+\.\s*|\-\s*)\*\*|$)/g);
  if (!items) return developments;

  for (const item of items.slice(0, 5)) {
    const titleMatch = item.match(/\*\*([^*]+)\*\*/);
    const title = titleMatch ? titleMatch[1].trim() : "Development";
    const bodyText = item.replace(/(?:\d+\.\s*|\-\s*)\*\*[^*]+\*\*[:\s]*/, "").trim();
    const sourceMatch = bodyText.match(/\*Source:?\s*([^*]+)\*/i) || bodyText.match(/Source:?\s*(.+?)(?:\n|$)/i);
    const source = sourceMatch ? sourceMatch[1].trim() : "Multiple sources";
    const significance = bodyText.replace(/\*?Source:?[^*\n]+\*?/i, "").trim().split("\n")[0];
    developments.push({ title, source, significance });
  }

  return developments;
}

function extractSectors(content: string): string[] {
  const sectors: string[] = [];
  const sectorNames = [
    "Launch & Access to Space",
    "Satellite Operations & Communications",
    "Defense & National Security",
    "Policy & Regulation",
    "Commercial & Investment",
  ];
  for (const sector of sectorNames) {
    if (content.includes(sector)) {
      sectors.push(sector);
    }
  }
  return sectors.length > 0 ? sectors : sectorNames;
}

function extractSummary(content: string): string {
  const summaryMatch = content.match(/### Executive Summary\n([\s\S]*?)(?=\n### |$)/);
  return summaryMatch ? summaryMatch[1].trim() : "";
}

export async function generateDailyBriefing(): Promise<{
  ok: boolean;
  briefingId?: string;
  sourceCount?: number;
  error?: string;
}> {
  const admin = createAdminClient();
  const today = new Date().toISOString().split("T")[0];

  // 1. Query all data sources
  const sources = await queryAllSources(admin);
  const totalSourceCount = sources.reduce((sum, s) => sum + s.count, 0);

  // 2. Build context document
  const context = buildContextDocument(sources);

  // 3. Get specific counts for the prompt
  const contractCount = sources.find((s) => s.table === "gov_contracts")?.count || 0;
  const regulatoryCount =
    (sources.find((s) => s.table === "federal_register")?.count || 0) +
    (sources.find((s) => s.table === "sec_filings")?.count || 0);
  const weatherRecords = sources.find((s) => s.table === "space_weather")?.records || [];
  const weatherSummary = weatherRecords.length > 0
    ? `${weatherRecords.length} alerts/reports in monitoring`
    : "No recent alerts";

  // 4. Call Anthropic API
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

  const systemPrompt = SYSTEM_PROMPT
    .replace("{DATE}", today)
    .replace("{TOTAL_COUNT}", String(totalSourceCount))
    .replace("{CONTRACT_COUNT}", String(contractCount))
    .replace("{REGULATORY_COUNT}", String(regulatoryCount))
    .replace("{WEATHER_SUMMARY}", weatherSummary);

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `Here is the intelligence data from the last 24 hours across all monitored sources:\n\n${context}\n\nGenerate the Daily Intelligence Briefing for ${today}. Write in full markdown format.`,
      },
    ],
  });

  const fullContent = message.content[0].type === "text" ? message.content[0].text : "";

  // 5. Parse and extract structured data
  const summary = extractSummary(fullContent);
  const keyDevelopments = extractKeyDevelopments(fullContent);
  const sectorsCovered = extractSectors(fullContent);

  // 6. Write to daily_briefings table
  const { data: briefing, error: insertError } = await admin
    .from("daily_briefings")
    .upsert(
      {
        briefing_date: today,
        title: `Daily Intelligence Briefing - ${today}`,
        summary,
        content: fullContent,
        sectors_covered: sectorsCovered,
        source_count: totalSourceCount,
        key_developments: keyDevelopments,
        items: keyDevelopments,
        sources_consulted: sources.map((s) => ({
          name: s.table,
          count: s.count,
          lastUpdated: new Date().toISOString(),
        })),
        generated_at: new Date().toISOString(),
      },
      { onConflict: "briefing_date" }
    )
    .select("id")
    .single();

  if (insertError) {
    throw new Error(`Failed to write briefing: ${insertError.message}`);
  }

  return {
    ok: true,
    briefingId: briefing?.id,
    sourceCount: totalSourceCount,
  };
}
