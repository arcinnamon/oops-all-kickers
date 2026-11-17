import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("kickers migration", () => {
  const file = readdirSync("supabase/migrations").find((f) => f.endsWith("_kickers.sql"));
  const sql = file ? readFileSync(`supabase/migrations/${file}`, "utf8").toLowerCase() : "";

  it("creates the table with row-level security enabled", () => {
    expect(file).toBeDefined();
    expect(sql).toContain("create table public.kickers");
    expect(sql).toContain("alter table public.kickers enable row level security");
  });

  it("allows reads only", () => {
    expect(sql).toMatch(/on public\.kickers for select\s+to anon, authenticated/);
    expect(sql).not.toMatch(/for (insert|update|delete|all)/);
  });
});
