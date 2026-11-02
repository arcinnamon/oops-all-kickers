import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseKicking, parseScoreboard } from "@/lib/kickers/espn";

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
