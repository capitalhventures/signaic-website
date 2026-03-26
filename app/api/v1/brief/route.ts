import { NextRequest } from "next/server";
import { apiResponse, apiError, getAuthUser, checkRateLimit } from "@/lib/api-utils";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  if (!checkRateLimit(`brief:${user.id}`, 5)) {
    return apiError("Rate limit exceeded. Max 5 brief generations per minute.", 429);
  }

  try {
    const config = await request.json();

    const { sectors = [], entities = [], depth = "standard", dateRange } = config;

    // Generate the brief using Claude
    const depthInstructions = {
      quick: "Provide a concise 2-3 paragraph executive summary.",
      standard: "Provide a comprehensive brief with executive summary, sector analysis, entity watchlist changes, key documents, and your assessment.",
      deep: "Provide an in-depth intelligence report with detailed executive summary, thorough sector analysis for each selected sector, comprehensive entity analysis with competitive context, full document review, and a detailed strategic assessment with forward-looking implications.",
    };

    const prompt = `Generate an intelligence brief for the space and defense sector.

Sectors of interest: ${sectors.join(", ") || "All sectors"}
Entities of interest: ${entities.join(", ") || "All tracked entities"}
Date range: ${dateRange?.start || "Last 7 days"} to ${dateRange?.end || "Today"}
Report depth: ${depth}

${depthInstructions[depth as keyof typeof depthInstructions]}

Structure the report with markdown headers. Include numbered source citations. Mention specific entities, filings, contracts, and regulatory actions.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: depth === "deep" ? 8192 : depth === "standard" ? 4096 : 2048,
        system: "You are Raptor, the AI intelligence analyst powering Signaic. Generate professional intelligence briefs for space and defense sector decision-makers. Be precise, cite sources, and focus on actionable intelligence.",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      return apiError("Failed to generate brief", 500);
    }

    const result = await response.json();
    const content = result.content[0]?.text || "";

    // Save the brief
    const supabase = createClient();
    const title = `${depth.charAt(0).toUpperCase() + depth.slice(1)} Brief - ${new Date().toLocaleDateString()}`;

    const { data: brief, error } = await supabase
      .from("briefs")
      .insert({
        user_id: user.id,
        title,
        config,
        content,
      })
      .select()
      .single();

    if (error) return apiError("Failed to save brief", 500);

    return apiResponse(brief);
  } catch {
    return apiError("Internal server error", 500);
  }
}
