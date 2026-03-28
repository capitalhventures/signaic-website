import { createClient } from "@/lib/supabase/server";
import { ContractsClient } from "@/components/contracts-client";

export const metadata = {
  title: "Government Awards | Signaic",
  description: "Space & defense contracts from USASpending.gov.",
};

export default async function ContractsPage() {
  const supabase = createClient();
  const { data: contracts } = await supabase
    .from("gov_contracts")
    .select("*, companies:company_id(id, name)")
    .order("contract_value", { ascending: false })
    .limit(500);

  return <ContractsClient contracts={contracts || []} />;
}
