import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Validates the Vercel cron secret header.
 * Returns true if the request is authorized.
 */
export function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) return false;
  return authHeader === `Bearer ${cronSecret}`;
}

/**
 * Logs cron execution result to the cron_logs table.
 */
export async function logCronExecution(
  source: string,
  status: "success" | "error" | "skipped",
  recordsProcessed: number,
  errorMessage?: string
): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from("cron_logs").insert({
      source,
      status,
      records_processed: recordsProcessed,
      error_message: errorMessage || null,
    });
  } catch {
    console.error(`[cron] Failed to log execution for ${source}`);
  }
}

/**
 * Standard cron error response.
 */
export function cronError(message: string, status = 500) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

/**
 * Standard cron success response.
 */
export function cronSuccess(data: Record<string, unknown>) {
  return NextResponse.json({ ok: true, ...data });
}
