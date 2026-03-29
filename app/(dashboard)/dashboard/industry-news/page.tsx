import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { IndustryNewsClient } from "@/components/industry-news-client";

export const metadata: Metadata = {
  title: "Industry News | Signaic",
  description: "Space and defense industry RSS feed aggregator from top sources.",
};

export default async function IndustryNewsPage() {
  const supabase = createClient();

  const { data: articles } = await supabase
    .from("rss_feeds")
    .select("*")
    .order("published_at", { ascending: false })
    .limit(500);

  const { data: latestRecord } = await supabase
    .from("rss_feeds")
    .select("created_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return (
    <IndustryNewsClient
      articles={articles || []}
      lastRefreshed={latestRecord?.created_at || null}
    />
  );
}
