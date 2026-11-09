import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getDbStatus = vi.fn();
vi.mock("@/lib/db-status", async (orig) => ({
  ...(await orig<typeof import("@/lib/db-status")>()),
  getDbStatus: () => getDbStatus(),
}));
vi.mock("next/server", () => ({ connection: async () => {} }));

import { DbStatus } from "@/components/DbStatus";

beforeEach(() => getDbStatus.mockReset());

describe("DbStatus", () => {
  it("shows connected with the time", async () => {
    getDbStatus.mockResolvedValue({ status: "ok", time: new Date("2026-11-09T14:03:22Z") });
    const html = renderToStaticMarkup(await DbStatus());
    expect(html).toContain("Database: connected, time 2026-11-09 14:03:22 UTC");
  });
  it("shows unreachable without details", async () => {
    getDbStatus.mockResolvedValue({ status: "unreachable" });
    const html = renderToStaticMarkup(await DbStatus());
    expect(html).toContain("Database: unreachable");
    expect(html).not.toMatch(/error|boom/i);
  });
});
