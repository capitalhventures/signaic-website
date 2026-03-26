import { apiResponse, apiError, getAuthUser, checkRateLimit } from "@/lib/api-utils";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  if (!checkRateLimit(`briefing:${user.id}`, 60)) {
    return apiError("Rate limit exceeded", 429);
  }

  try {
    const supabase = createClient();
    const today = new Date().toISOString().split("T")[0];

    const { data: briefing, error } = await supabase
      .from("daily_briefings")
      .select("*")
      .eq("briefing_date", today)
      .single();

    if (error || !briefing) {
      // Return sample data if no briefing exists yet
      return apiResponse({
        id: "sample",
        briefing_date: today,
        items: [
          {
            headline: "SpaceX Secures $1.8B NRO Launch Contract Extension",
            synthesis: "The National Reconnaissance Office has extended its launch services contract with SpaceX by $1.8 billion through 2028. This solidifies SpaceX's position as the primary launch provider for classified payloads and may impact ULA's competitive positioning for future NSSL Phase 3 awards.",
            entities: [
              { id: "1", name: "SpaceX", slug: "spacex", type: "company" },
              { id: "2", name: "NRO", slug: "nro", type: "agency" },
              { id: "3", name: "ULA", slug: "ula", type: "company" },
            ],
            impact: "high",
            sources: [
              { id: "s1", title: "NRO Contract Award Notice", type: "contract", url: "#" },
              { id: "s2", title: "SAM.gov Opportunity FA8811-24-R-0001", type: "sam", url: "#" },
            ],
          },
          {
            headline: "FCC Approves Kuiper Gen2 Constellation Modification",
            synthesis: "Amazon's Project Kuiper received FCC approval for its Gen2 constellation modification, allowing deployment of 7,774 satellites across revised orbital shells. This directly competes with Starlink's V2 Mini constellation and signals accelerating commercial broadband competition in LEO.",
            entities: [
              { id: "4", name: "Amazon Kuiper", slug: "amazon-kuiper", type: "program" },
              { id: "5", name: "FCC", slug: "fcc", type: "agency" },
              { id: "6", name: "SpaceX Starlink", slug: "spacex-starlink", type: "program" },
            ],
            impact: "high",
            sources: [
              { id: "s3", title: "FCC Order DA-24-1847", type: "fcc", url: "#" },
              { id: "s4", title: "Federal Register Notice Vol. 89", type: "federal_register", url: "#" },
            ],
          },
          {
            headline: "L3Harris Patents New Satellite Servicing Mechanism",
            synthesis: "L3Harris Technologies filed a patent for an autonomous satellite servicing mechanism designed for GEO orbit operations. This aligns with DARPA's Robotic Servicing of Geosynchronous Satellites (RSGS) program requirements and positions L3Harris ahead of Northrop Grumman's MEV technology.",
            entities: [
              { id: "7", name: "L3Harris", slug: "l3harris", type: "company" },
              { id: "8", name: "DARPA", slug: "darpa", type: "agency" },
              { id: "9", name: "Northrop Grumman", slug: "northrop-grumman", type: "company" },
            ],
            impact: "medium",
            sources: [
              { id: "s5", title: "USPTO Patent Application 2024/0187432", type: "patent", url: "#" },
              { id: "s6", title: "DARPA RSGS Program Update", type: "news", url: "#" },
            ],
          },
        ],
        sources_consulted: [
          { name: "Government Contracts", count: 847, lastUpdated: new Date().toISOString() },
          { name: "FCC Filings", count: 2341, lastUpdated: new Date().toISOString() },
          { name: "SEC Filings", count: 156, lastUpdated: new Date().toISOString() },
          { name: "Patents", count: 1203, lastUpdated: new Date().toISOString() },
          { name: "Federal Register", count: 432, lastUpdated: new Date().toISOString() },
          { name: "News", count: 5621, lastUpdated: new Date().toISOString() },
        ],
        generated_at: new Date().toISOString(),
      });
    }

    return apiResponse(briefing);
  } catch {
    return apiError("Internal server error", 500);
  }
}
