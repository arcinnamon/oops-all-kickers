import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("kickers season stats migration", () => {
  const sql = readFileSync(
    "supabase/migrations/20261116210000_kickers_season_stats.sql",
    "utf8",
  ).toLowerCase();
  const columns = [
    "games_played",
    "fg_made",
    "fg_attempts",
    "longest",
    "fg_made_1_19",
    "fg_made_20_29",
    "fg_made_30_39",
    "fg_made_40_49",
    "fg_made_50_plus",
    "fg_attempts_1_19",
    "fg_attempts_20_29",
    "fg_attempts_30_39",
    "fg_attempts_40_49",
    "fg_attempts_50_plus",
    "xp_made",
    "xp_attempts",
  ];

  it("adds the season and stat columns", () => {
    for (const column of ["season", ...columns]) {
      expect(sql).toContain(`add column ${column} integer`);
    }
  });

  it("has a unique constraint on league, season and ESPN id", () => {
    expect(sql).toContain("unique (league, season, espn_id)");
  });

  it("does not recreate the table or touch policies", () => {
    expect(sql).not.toContain("create table");
    expect(sql).not.toContain("policy");
  });
});
