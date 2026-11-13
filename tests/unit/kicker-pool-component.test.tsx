import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getKickerPool = vi.fn();
vi.mock("@/lib/kickers/pool", () => ({ getKickerPool: (p: number) => getKickerPool(p) }));
vi.mock("next/server", () => ({ connection: async () => {} }));

import { KickerPool } from "@/components/KickerPool";

const ok = (page: number) => ({
  status: "ok",
  rows: [{ id: 1, league: "nfl", name: "Justin Tucker", team: "Baltimore Ravens" }],
  page,
  totalPages: 3,
  asOf: "2026-11-13T12:00:00Z",
});

async function render(page: number) {
  getKickerPool.mockResolvedValue(ok(page));
  return renderToStaticMarkup(await KickerPool({ page }));
}

beforeEach(() => getKickerPool.mockReset());

describe("KickerPool", () => {
  it("renders headers, rows and the roster date", async () => {
    const html = await render(1);
    for (const h of ["League", "Name", "Team"]) expect(html).toContain(`>${h}</th>`);
    expect(html).toContain("<h2>Kicker pool</h2>");
    expect(html).toContain("NFL");
    expect(html).toContain("Justin Tucker");
    expect(html).toContain("Roster as of 2026-11-13");
    expect(html).toContain("Page 1 of 3");
  });

  it("first page has Next only", async () => {
    const html = await render(1);
    expect(html).toContain('href="/?page=2"');
    expect(html).not.toContain("Previous");
  });

  it("middle page has both links", async () => {
    const html = await render(2);
    expect(html).toContain('href="/?page=1"');
    expect(html).toContain('href="/?page=3"');
  });

  it("last page has Previous only", async () => {
    const html = await render(3);
    expect(html).toContain('href="/?page=2"');
    expect(html).not.toContain("Next");
  });

  it("shows the unavailable message", async () => {
    getKickerPool.mockResolvedValue({ status: "unavailable" });
    const html = renderToStaticMarkup(await KickerPool({ page: 1 }));
    expect(html).toContain("Kicker list unavailable, try again later");
    expect(html).not.toContain("<table");
  });
});
