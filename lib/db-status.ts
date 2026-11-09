import { createClient } from "@/lib/supabase/server";

export type DbStatus = { status: "ok"; time: Date } | { status: "unreachable" };

export async function getDbStatus(): Promise<DbStatus> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("db_now");
    if (error || typeof data !== "string") return { status: "unreachable" };
    const time = new Date(data);
    if (Number.isNaN(time.getTime())) return { status: "unreachable" };
    return { status: "ok", time };
  } catch {
    return { status: "unreachable" };
  }
}

/** Formats as `YYYY-MM-DD HH:mm:ss UTC`. */
export function formatDbTime(time: Date): string {
  return time.toISOString().slice(0, 19).replace("T", " ") + " UTC";
}
