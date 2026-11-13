import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("kickers seed migration", () => {
  const file = readdirSync("supabase/migrations").find((f) => f.endsWith("_seed_kickers.sql"));
  const sql = file ? readFileSync(`supabase/migrations/${file}`, "utf8") : "";
  const rows = [...sql.matchAll(/^\s*\('([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)'\)/gm)];

  it("has rows, each with league, espn_id, name and team", () => {
    expect(file).toBeDefined();
    expect(rows.length).toBeGreaterThan(0);
    for (const r of rows) {
      expect(["nfl", "fbs"]).toContain(r[1]);
      expect(r[2]).not.toBe("");
      expect(r[3]).not.toBe("");
      expect(r[4]).not.toBe("");
    }
  });

  it("upserts on conflict", () => {
    expect(sql.toLowerCase()).toContain("on conflict (league, espn_id) do update");
  });
});
