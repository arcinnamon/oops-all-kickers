import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("kickers migration", () => {
  const file = readdirSync("supabase/migrations").find((f) => f.endsWith("_kickers.sql") && !f.includes("seed"));
  const sql = file ? readFileSync(`supabase/migrations/${file}`, "utf8").toLowerCase() : "";

  it("creates the table with a unique key on league and espn_id", () => {
    expect(file).toBeDefined();
    expect(sql).toContain("create table public.kickers");
    expect(sql).toContain("unique (league, espn_id)");
  });

  it("enables RLS with a single select policy and no write policies", () => {
    expect(sql).toContain("alter table public.kickers enable row level security");
    expect(sql.match(/create policy/g)).toHaveLength(1);
    expect(sql).toMatch(/for select\s+to anon, authenticated\s+using \(true\)/);
    expect(sql).not.toMatch(/for (insert|update|delete|all)/);
  });
});
