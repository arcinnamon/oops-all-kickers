import { createClient } from "@/lib/supabase/server";

export const PAGE_SIZE = 25;

export type PoolRow = { league: "nfl" | "fbs"; name: string; team: string };
export type PoolResult =
  | { status: "ok"; rows: PoolRow[]; page: number; totalPages: number; asOf: string | null }
  | { status: "unavailable" };

/** Positive integer from a `?page=` value; anything else gives 1. */
export function parsePage(raw: string | string[] | undefined): number {
  if (typeof raw !== "string" || !/^\d+$/.test(raw)) return 1;
  const n = Number(raw);
  return Number.isSafeInteger(n) && n >= 1 ? n : 1;
}

export async function getKickerPool(page: number): Promise<PoolResult> {
  try {
    const supabase = await createClient();
    const fetchPage = (p: number) =>
      supabase
        .from("kickers")
        .select("league, name, team", { count: "exact" })
        .order("league")
        .order("team")
        .order("name")
        .range((p - 1) * PAGE_SIZE, p * PAGE_SIZE - 1);

    let current = Math.max(1, page);
    let res = await fetchPage(current);
    if (res.error || !res.count) return { status: "unavailable" };
    const totalPages = Math.ceil(res.count / PAGE_SIZE);
    if (current > totalPages) {
      current = totalPages;
      res = await fetchPage(current);
      if (res.error) return { status: "unavailable" };
    }

    const latest = await supabase
      .from("kickers")
      .select("updated_at")
      .order("updated_at", { ascending: false })
      .limit(1);
    const asOf = latest.error ? null : (latest.data?.[0]?.updated_at ?? null);
    return { status: "ok", rows: (res.data ?? []) as PoolRow[], page: current, totalPages, asOf };
  } catch {
    return { status: "unavailable" };
  }
}
