import { apiResponse, getAuthUser, apiError } from "@/lib/api-utils";

export async function POST() {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  return apiResponse({ status: "not_implemented", source: "contracts" });
}
