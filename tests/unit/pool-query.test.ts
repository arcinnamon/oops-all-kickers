import { afterEach, describe, expect, it, vi } from "vitest";
import { getKickerPool } from "@/lib/kickers/pool";

type Kicker = { id: string; name: string; team: string; attempts?: number };

function listPage(kickers: Kicker[], pages = 1) {
  return {
    pagination: { pages },
    categories: [{ name: "kicking", names: ["fieldGoalsMade", "fieldGoalAttempts"] }],
    athletes: kickers.map((k) => ({
      athlete: { id: k.id, displayName: k.name, teamShortName: k.team },
      categories: [{ name: "kicking", values: [0, k.attempts ?? 1] }],
    })),
  };
}

const many = (n: number, prefix: string): Kicker[] =>
  Array.from({ length: n }, (_, i) => ({
    id: prefix + i,
    name: prefix + String(i).padStart(2, "0"),
    team: "T",
  }));

/** Stubs fetch with one list of pages per league and returns the mock. */
function stub(nfl: unknown[], fbs: unknown[]) {
  const f = vi.fn((url: string) => {
    const page = Number(new URL(url).searchParams.get("page"));
    const body = (url.includes("college-football") ? fbs : nfl)[page - 1];
    return Promise.resolve(new Response(JSON.stringify(body)));
  });
  vi.stubGlobal("fetch", f);
  return f;
}
const urls = (f: ReturnType<typeof stub>, part: string) =>
  f.mock.calls.map((c) => String(c[0])).filter((u) => u.includes(part));

afterEach(() => vi.unstubAllGlobals());

describe("getKickerPool", () => {
  it("sorts by league, team, name", async () => {
    stub(
      [listPage([{ id: "1", name: "Zed", team: "MIN" }, { id: "2", name: "Abe", team: "MIN" }, { id: "3", name: "Cy", team: "BAL" }])],
      [listPage([{ id: "9", name: "Moe", team: "UAB" }])],
    );
    expect(await getKickerPool(1)).toEqual({
      status: "ok",
      page: 1,
      totalPages: 1,
      rows: [
        { espnId: "9", league: "fbs", name: "Moe", team: "UAB" },
        { espnId: "3", league: "nfl", name: "Cy", team: "BAL" },
        { espnId: "2", league: "nfl", name: "Abe", team: "MIN" },
        { espnId: "1", league: "nfl", name: "Zed", team: "MIN" },
      ],
    });
  });

  it("serves 25 rows per page", async () => {
    stub([listPage(many(30, "n"))], [listPage(many(30, "f"))]);
    const first = await getKickerPool(1);
    const second = await getKickerPool(2);
    expect(first).toMatchObject({ status: "ok", page: 1, totalPages: 3 });
    if (first.status !== "ok" || second.status !== "ok") throw new Error("unavailable");
    expect(first.rows).toHaveLength(25);
    expect(first.rows[0].name).toBe("f00");
    expect(second.rows[0].name).toBe("f25");
    expect(second.rows[5].name).toBe("n00");
  });

  it("clamps a page past the end to the last page", async () => {
    stub([listPage(many(30, "n"))], [listPage(many(30, "f"))]);
    const r = await getKickerPool(999);
    expect(r).toMatchObject({ status: "ok", page: 3 });
    if (r.status !== "ok") throw new Error("unavailable");
    expect(r.rows).toHaveLength(10);
  });

  it("stops paging NFL at the first kicker without an attempt", async () => {
    const f = stub(
      [listPage([{ id: "1", name: "A", team: "T" }, { id: "2", name: "B", team: "T", attempts: 0 }], 40)],
      [listPage([])],
    );
    const r = await getKickerPool(1);
    expect(urls(f, "/nfl/")).toHaveLength(1);
    expect(r).toMatchObject({ rows: [{ espnId: "1", league: "nfl", name: "A", team: "T" }] });
  });

  it("keeps paging NFL while every kicker has an attempt", async () => {
    const f = stub([listPage(many(2, "a"), 2), listPage(many(2, "b"), 2)], [listPage([])]);
    const r = await getKickerPool(1);
    expect(urls(f, "/nfl/")).toHaveLength(2);
    expect(r).toMatchObject({ rows: [{ name: "a00" }, { name: "a01" }, { name: "b00" }, { name: "b01" }] });
  });

  it("reads every FBS page, attempts or not", async () => {
    const f = stub(
      [listPage([])],
      [listPage([{ id: "1", name: "A", team: "T", attempts: 0 }], 2), listPage([{ id: "2", name: "B", team: "T" }], 2)],
    );
    const r = await getKickerPool(1);
    expect(urls(f, "college-football")).toHaveLength(2);
    expect(urls(f, "college-football")[0]).toContain("isqualified=true");
    expect(urls(f, "/nfl/")[0]).toContain("isqualified=false");
    expect(r).toMatchObject({ rows: [{ name: "A" }, { name: "B" }] });
  });

  it("is unavailable when a request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) =>
        Promise.resolve(
          url.includes("college-football")
            ? new Response("no", { status: 500 })
            : new Response(JSON.stringify(listPage(many(2, "n")))),
        ),
      ),
    );
    expect(await getKickerPool(1)).toEqual({ status: "unavailable" });
  });

  it("is unavailable when ESPN lists no kickers", async () => {
    stub([listPage([])], [listPage([])]);
    expect(await getKickerPool(1)).toEqual({ status: "unavailable" });
  });
});
