import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseKicking, parseLeaderboard, parseScoreboard } from "@/lib/kickers/espn";

const load = (f: string) => JSON.parse(readFileSync("tests/fixtures/" + f, "utf8"));
const week = {
  start: new Date("2025-10-21T05:01:00Z"),
  end: new Date("2025-10-28T04:59:59Z"),
};

describe("parseScoreboard", () => {
  it("keeps completed games inside the window only", () => {
    const ids = parseScoreboard(load("scoreboard.json"), week).map((g) => g.id);
    expect(ids).toEqual(["401", "402"]);
  });

  it("returns empty for malformed input", () => {
    expect(parseScoreboard(null, week)).toEqual([]);
    expect(parseScoreboard({ events: "x" }, week)).toEqual([]);
  });
});

describe("parseKicking", () => {
  it("reads FG made, attempts and long", () => {
    expect(parseKicking(load("summary.json"))).toEqual([
      { name: "Harrison Butker", team: "KC", made: 3, attempts: 4, longest: 52 },
    ]);
  });

  it("returns empty for a game with no kicker", () => {
    expect(parseKicking({ boxscore: { players: [{ team: {}, statistics: [] }] } })).toEqual([]);
  });

  it("returns empty for malformed payloads", () => {
    expect(parseKicking(undefined)).toEqual([]);
    expect(parseKicking({ boxscore: { players: [{ statistics: [{ name: "kicking" }] }] } })).toEqual(
      [],
    );
  });
});

describe("parseLeaderboard", () => {
  it("reads id, name, team and the page count", () => {
    expect(parseLeaderboard(load("leaderboard.json"), false)).toEqual({
      kickers: [
        { espnId: "3124679", name: "Jason Sanders", team: "NYJ" },
        { espnId: "4567104", name: "Will Reichard", team: "MIN" },
        { espnId: "2977680", name: "Bradley Pinion", team: "MIA" },
      ],
      pages: 40,
      sawZeroAttempts: false,
    });
  });

  it("drops kickers without an attempt when asked", () => {
    const res = parseLeaderboard(load("leaderboard.json"), true);
    expect(res.kickers.map((k) => k.name)).toEqual(["Jason Sanders", "Will Reichard"]);
    expect(res.sawZeroAttempts).toBe(true);
  });

  it("returns no kickers for malformed input", () => {
    expect(parseLeaderboard(null, true).kickers).toEqual([]);
    expect(parseLeaderboard({ athletes: "x" }, false).kickers).toEqual([]);
    expect(parseLeaderboard({ athletes: [{ athlete: { id: "1", displayName: "A" } }] }, true).kickers).toEqual([]);
  });
});
