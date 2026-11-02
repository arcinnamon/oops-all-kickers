import { describe, expect, it } from "vitest";
import { aggregateKickers, topKickers } from "@/lib/kickers/rank";

const k = (name: string, made: number, attempts: number, longest: number, team = "T") => ({
  name,
  team,
  made,
  attempts,
  longest,
});

describe("aggregateKickers", () => {
  it("sums multiple games and keeps the longest", () => {
    const rows = aggregateKickers([k("A", 2, 3, 40), k("A", 1, 2, 50)]);
    expect(rows).toEqual([k("A", 3, 5, 50)]);
  });

  it("drops kickers with 0 made", () => {
    expect(aggregateKickers([k("A", 0, 2, 0)])).toEqual([]);
  });

  it("breaks ties by made, longest, attempts, then name", () => {
    const rows = aggregateKickers([
      k("D", 2, 2, 40),
      k("C", 2, 3, 40),
      k("B", 2, 2, 50),
      k("A", 3, 5, 30),
      k("E", 2, 2, 40),
    ]);
    expect(rows.map((r) => r.name)).toEqual(["A", "B", "D", "E", "C"]);
  });

  it("returns empty for empty input", () => {
    expect(aggregateKickers([])).toEqual([]);
    expect(topKickers([], 3)).toEqual([]);
  });
});

describe("topKickers", () => {
  it("cuts to n", () => {
    const rows = [k("A", 4, 4, 1), k("B", 3, 4, 1), k("C", 2, 4, 1), k("D", 1, 4, 1)];
    expect(topKickers(rows, 3).map((r) => r.name)).toEqual(["A", "B", "C"]);
  });
});
