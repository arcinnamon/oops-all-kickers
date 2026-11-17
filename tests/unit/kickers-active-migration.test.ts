import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("kickers active migration", () => {
  const sql = readFileSync("supabase/migrations/20261114120000_kickers_active.sql", "utf8").toLowerCase();

  it("adds the active column", () => {
    expect(sql).toContain("add column");
    expect(sql).toContain("active boolean not null default true");
  });

  it("does not touch policies or drop anything", () => {
    expect(sql).not.toContain("policy");
    expect(sql).not.toContain("drop");
  });
});
