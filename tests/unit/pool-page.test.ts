import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import { PAGE_SIZE, parsePage } from "@/lib/kickers/pool";

describe("parsePage", () => {
  it.each([
    [undefined, 1],
    ["abc", 1],
    ["0", 1],
    ["-2", 1],
    ["2.5", 1],
    [["2", "3"], 1],
    ["3", 3],
  ])("parses %j as %i", (raw, expected) => {
    expect(parsePage(raw)).toBe(expected);
  });

  it("uses 25 rows per page", () => {
    expect(PAGE_SIZE).toBe(25);
  });
});
