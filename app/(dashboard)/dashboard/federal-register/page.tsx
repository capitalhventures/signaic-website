import { createAdminClient } from "@/lib/supabase/admin";
import { FederalRegisterClient } from "@/components/federal-register-client";

export const metadata = {
  title: "Federal Register | Signaic",
  description: "Proposed rules, final rules, and notices from federal agencies.",
};

export default async function FederalRegisterPage() {
  const supabase = createAdminClient();
  const { data: documents, error } = await supabase
    .from("federal_register")
    .select("*")
    .order("publication_date", { ascending: false })
    .limit(500);

  return (
    <FederalRegisterClient
      documents={documents || []}
      error={error?.message}
    />
  );
}
