import { beforeEach, describe, expect, it, vi } from "vitest";

const createClient = vi.fn();
vi.mock("@/lib/supabase/server", () => ({ createClient: () => createClient() }));

import { getKickerPool } from "@/lib/kickers/pool";

type Resp = { data: unknown; error: unknown; count?: number | null };
const order = vi.fn();
const range = vi.fn();
const limit = vi.fn();
const select = vi.fn();
let pageResp: Resp;
let latestResp: Resp;

function builder(resolve: () => Resp) {
  const b: Record<string, unknown> = {};
  b.order = (...a: unknown[]) => (order(...a), b);
  b.range = (...a: unknown[]) => (range(...a), Promise.resolve(resolve()));
  b.limit = (...a: unknown[]) => (limit(...a), Promise.resolve(resolve()));
  return b;
}

beforeEach(() => {
  [order, range, limit, select, createClient].forEach((m) => m.mockReset());
  pageResp = { data: [{ league: "nfl", name: "A", team: "T" }], error: null, count: 60 };
  latestResp = { data: [{ updated_at: "2026-11-13T12:00:00Z" }], error: null };
  select.mockImplementation((cols: string) => builder(() => (cols === "updated_at" ? latestResp : pageResp)));
  createClient.mockResolvedValue({ from: () => ({ select }) });
});

describe("getKickerPool", () => {
  it("orders by league, team, name and ranges the first page", async () => {
    const r = await getKickerPool(1);
    expect(order.mock.calls.slice(0, 3)).toEqual([["league"], ["team"], ["name"]]);
    expect(range).toHaveBeenCalledWith(0, 24);
    expect(select).toHaveBeenCalledWith("league, name, team", { count: "exact" });
    expect(r).toMatchObject({ status: "ok", page: 1, totalPages: 3, asOf: "2026-11-13T12:00:00Z" });
  });

  it("uses the right range for a middle page", async () => {
    await getKickerPool(2);
    expect(range).toHaveBeenCalledWith(25, 49);
  });

  it("clamps a page past the end to the last page", async () => {
    const r = await getKickerPool(999);
    expect(range).toHaveBeenLastCalledWith(50, 74);
    expect(r).toMatchObject({ status: "ok", page: 3 });
  });

  it("is unavailable on a query error", async () => {
    pageResp = { data: null, error: { message: "boom" }, count: null };
    expect(await getKickerPool(1)).toEqual({ status: "unavailable" });
  });

  it("is unavailable when client creation throws", async () => {
    createClient.mockRejectedValue(new Error("missing env"));
    expect(await getKickerPool(1)).toEqual({ status: "unavailable" });
  });

  it("is unavailable when the table is empty", async () => {
    pageResp = { data: [], error: null, count: 0 };
    expect(await getKickerPool(1)).toEqual({ status: "unavailable" });
  });
});
