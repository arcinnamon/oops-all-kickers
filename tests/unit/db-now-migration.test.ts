import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("db_now migration", () => {
  const file = readdirSync("supabase/migrations").find((f) => f.endsWith("_db_now.sql"));
  const sql = file ? readFileSync(`supabase/migrations/${file}`, "utf8").toLowerCase() : "";

  it("defines a stable security invoker function", () => {
    expect(file).toBeDefined();
    expect(sql).toContain("function public.db_now()");
    expect(sql).toContain("stable");
    expect(sql).toContain("security invoker");
  });

  it("revokes from public and grants only to anon and authenticated", () => {
    expect(sql).toContain("revoke execute on function public.db_now() from public");
    expect(sql).toContain("grant execute on function public.db_now() to anon, authenticated");
    expect(sql).not.toMatch(/to\s+public/);
  });
});
