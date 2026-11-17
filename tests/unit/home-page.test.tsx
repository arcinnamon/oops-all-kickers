import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/KickerPool", () => ({ KickerPool: ({ page }: { page: number }) => <p>POOL page {page}</p> }));
vi.mock("@/components/KickerTable", () => ({ KickerTable: ({ title }: { title: string }) => <p>TABLE {title}</p> }));
vi.mock("@/components/DbStatus", () => ({ DbStatus: () => <p>DB</p> }));
vi.mock("@/lib/kickers/fetch", () => ({ getTopKickers: async () => ({ status: "ok", rows: [] }) }));

import Home from "@/app/page";

describe("home page", () => {
  it("renders the pool before the scoring tables and passes the page", async () => {
    const html = renderToStaticMarkup(await Home({ searchParams: Promise.resolve({ page: "2" }) }));
    expect(html).toContain("POOL page 2");
    expect(html.indexOf("POOL")).toBeLessThan(html.indexOf("TABLE NFL kickers"));
    expect(html.indexOf("POOL")).toBeLessThan(html.indexOf("TABLE FBS kickers"));
  });

  it("falls back to page 1 for junk", async () => {
    const html = renderToStaticMarkup(await Home({ searchParams: Promise.resolve({ page: "abc" }) }));
    expect(html).toContain("POOL page 1");
  });
});
