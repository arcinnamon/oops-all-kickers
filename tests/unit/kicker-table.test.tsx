import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { KickerTable } from "@/components/KickerTable";

const row = (name: string, made: number) => ({ name, team: "KC", made, attempts: made + 1, longest: 50 });

describe("KickerTable", () => {
  it("renders headers and rows in order", () => {
    const html = renderToStaticMarkup(
      <KickerTable title="NFL kickers" result={{ status: "ok", rows: [row("Ann", 4), row("Bob", 3)] }} />,
    );
    for (const h of ["Name", "Team", "FG made", "FG attempts", "Longest"]) {
      expect(html).toContain('<th scope="col">' + h + "</th>");
    }
    expect(html.indexOf("Ann")).toBeLessThan(html.indexOf("Bob"));
    expect(html).toContain("NFL kickers");
  });

  it.each([
    ["unavailable", "Data unavailable"],
    ["no-games", "No games found for this week."],
  ] as const)("shows the %s message and keeps headers", (status, text) => {
    const html = renderToStaticMarkup(<KickerTable title="FBS kickers" result={{ status, rows: [] }} />);
    expect(html).toContain(text);
    expect(html).toContain("FG made");
  });

  it("shows an empty message when no kicker made a FG", () => {
    const html = renderToStaticMarkup(<KickerTable title="FBS kickers" result={{ status: "ok", rows: [] }} />);
    expect(html).toContain("No kicker made a field goal this week.");
  });
});
