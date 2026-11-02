import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getTopKickers } from "@/lib/kickers/fetch";
import { lastCompletedWeek } from "@/lib/week";

const load = (f: string) => JSON.parse(readFileSync("tests/fixtures/" + f, "utf8"));
const week = lastCompletedWeek(new Date("2025-10-30T17:00:00Z"));
const ok = (body: unknown) => Promise.resolve(new Response(JSON.stringify(body)));

afterEach(() => vi.unstubAllGlobals());

describe("getTopKickers", () => {
  it("aggregates kickers across games", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => ok(url.includes("scoreboard") ? load("scoreboard.json") : load("summary.json"))),
    );
    const res = await getTopKickers("nfl", week);
    expect(res.status).toBe("ok");
    // Two in-window games, each with the same kicker line.
    expect(res.rows).toEqual([
      { name: "Harrison Butker", team: "KC", made: 6, attempts: 8, longest: 52 },
    ]);
  });

  it("uses the FBS group filter", async () => {
    const f = vi.fn(() => ok({ events: [] }));
    vi.stubGlobal("fetch", f);
    await getTopKickers("fbs", week);
    expect(String((f.mock.calls[0] as unknown[])[0])).toContain("groups=80");
  });

  it("requests the scoreboard one day at a time, never a date range", async () => {
    const f = vi.fn((url: string) => ok(url.includes("scoreboard") ? { events: [] } : {}));
    vi.stubGlobal("fetch", f);
    await getTopKickers("nfl", week);
    const dates = f.mock.calls
      .map((c) => new URL(String((c as unknown[])[0])).searchParams.get("dates"))
      .sort();
    // Tue Oct 21 05:01Z to Tue Oct 28 04:59Z, padded a day each side.
    expect(dates).toEqual([
      "20251020",
      "20251021",
      "20251022",
      "20251023",
      "20251024",
      "20251025",
      "20251026",
      "20251027",
      "20251028",
      "20251029",
    ]);
  });

  it("reports unavailable when one scoreboard day fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => {
        if (url.includes("dates=20251026")) return Promise.resolve(new Response("no", { status: 400 }));
        return ok(url.includes("scoreboard") ? load("scoreboard.json") : load("summary.json"));
      }),
    );
    expect(await getTopKickers("nfl", week)).toEqual({ status: "unavailable", rows: [] });
  });

  it("reports no-games", async () => {
    vi.stubGlobal("fetch", vi.fn(() => ok({ events: [] })));
    expect(await getTopKickers("nfl", week)).toEqual({ status: "no-games", rows: [] });
  });

  it("reports unavailable when the scoreboard fails", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(new Response("no", { status: 500 }))));
    expect(await getTopKickers("nfl", week)).toEqual({ status: "unavailable", rows: [] });
  });

  it("reports unavailable when every summary fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) =>
        url.includes("scoreboard")
          ? ok(load("scoreboard.json"))
          : Promise.resolve(new Response("no", { status: 500 })),
      ),
    );
    expect(await getTopKickers("nfl", week)).toEqual({ status: "unavailable", rows: [] });
  });

  it("skips a single failed summary", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => {
        if (url.includes("scoreboard")) return ok(load("scoreboard.json"));
        if (url.includes("event=401")) return Promise.resolve(new Response("no", { status: 500 }));
        return ok(load("summary.json"));
      }),
    );
    const res = await getTopKickers("nfl", week);
    expect(res.rows[0].made).toBe(3);
  });
});
