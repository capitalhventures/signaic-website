import { Suspense } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { NewsClient } from "@/components/news-client";

export const metadata = {
  title: "News | Signaic",
  description: "Space & defense industry news aggregated from multiple sources.",
};

export default async function NewsPage() {
  const supabase = createAdminClient();
  const { data: news } = await supabase
    .from("news")
    .select("*, companies:company_id(id, name)")
    .order("published_date", { ascending: false })
    .limit(200);

  return (
    <Suspense fallback={<div className="flex items-center justify-center py-12"><span className="text-sm text-slate-400">Loading news...</span></div>}>
      <NewsClient news={news || []} />
    </Suspense>
  );
}
