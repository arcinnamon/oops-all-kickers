import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("kickers season stats migration", () => {
  const sql = readFileSync(
    "supabase/migrations/20261116210000_kickers_season_stats.sql",
    "utf8",
  ).toLowerCase();
  const scraper = readFileSync("scripts/scrape_kickers.py", "utf8");

  it("adds every column the scraper writes", () => {
    const block = scraper.slice(scraper.indexOf("COLUMNS = {"), scraper.indexOf("\n}\n"));
    const columns = [...block.matchAll(/^\s+"(\w+)":/gm)].map((m) => m[1]);
    expect(columns).toHaveLength(16);
    for (const column of ["season", ...columns]) {
      expect(sql).toContain(`add column ${column} integer`);
    }
  });

  it("has a unique constraint matching the scraper's upsert key", () => {
    expect(scraper).toContain("on_conflict=league,season,espn_id");
    expect(sql).toContain("unique (league, season, espn_id)");
  });

  it("does not recreate the table or touch policies", () => {
    expect(sql).not.toContain("create table");
    expect(sql).not.toContain("policy");
  });
});
