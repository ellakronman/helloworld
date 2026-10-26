import "server-only";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
function auditClient() {
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
export async function startGeneration(userId: string, kind: string) {
  try {
    const db = auditClient();
    if (!db) return null;
    const { data, error } = await db.from("generation_requests")
      .insert({ user_id: userId, request_type: kind, status: "pending" })
      .select("id").single();
    if (error) { console.warn("Generation audit unavailable:", error.message); return null; }
    return data.id as string;
  } catch { return null; }
}
export async function finishGeneration(id: string | null, status: "completed" | "failed", output?: string) {
  if (!id) return;
  try {
    const db = auditClient();
    if (!db) return;
    const { error } = await db.from("generation_requests").update({ status }).eq("id", id);
    if (error) console.warn("Generation audit update unavailable:", error.message);
    if (status === "completed" && output) {
      const { error: responseError } = await db.from("llm_responses").insert({ request_id: id, content: output });
      if (responseError) console.warn("Generation response audit unavailable:", responseError.message);
    }
  } catch { /* Do not fail a generation because its audit log is unavailable. */ }
}
