import { beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.fn();
const createClient = vi.fn();
vi.mock("@/lib/supabase/server", () => ({ createClient: () => createClient() }));

import { formatDbTime, getDbStatus } from "@/lib/db-status";

beforeEach(() => {
  rpc.mockReset();
  createClient.mockReset();
  createClient.mockResolvedValue({ rpc });
});

describe("getDbStatus", () => {
  it("returns ok with the time", async () => {
    rpc.mockResolvedValue({ data: "2026-11-09T14:03:22.123+00:00", error: null });
    const r = await getDbStatus();
    expect(r.status).toBe("ok");
    expect(rpc).toHaveBeenCalledWith("db_now");
  });
  it("is unreachable on rpc error", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "boom" } });
    expect(await getDbStatus()).toEqual({ status: "unreachable" });
  });
  it("is unreachable when client creation throws", async () => {
    createClient.mockRejectedValue(new Error("missing env"));
    expect(await getDbStatus()).toEqual({ status: "unreachable" });
  });
  it("is unreachable on an invalid value", async () => {
    rpc.mockResolvedValue({ data: "not a date", error: null });
    expect(await getDbStatus()).toEqual({ status: "unreachable" });
  });
});

describe("formatDbTime", () => {
  it("formats as UTC", () => {
    expect(formatDbTime(new Date("2026-11-09T14:03:22Z"))).toBe("2026-11-09 14:03:22 UTC");
  });
});
