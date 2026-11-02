import { describe, expect, it } from "vitest";
import { lastCompletedWeek } from "@/lib/week";

describe("lastCompletedWeek", () => {
  it("returns the previous Tue-Mon window for a mid-week date", () => {
    // Thu 2025-10-30 12:00 CDT
    const w = lastCompletedWeek(new Date("2025-10-30T17:00:00Z"));
    expect(w.startDate).toBe("2025-10-21");
    expect(w.endDate).toBe("2025-10-27");
    expect(w.start.toISOString()).toBe("2025-10-21T05:01:00.000Z");
    expect(w.end.toISOString()).toBe("2025-10-28T04:59:59.000Z");
    expect(w.label).toBe("Oct 21 to Oct 27, 2025");
  });

  it("treats Tuesday 00:00 and 00:01 the same: the week that just ended", () => {
    const at0000 = lastCompletedWeek(new Date("2025-10-28T05:00:00Z"));
    const at0001 = lastCompletedWeek(new Date("2025-10-28T05:01:00Z"));
    expect(at0000.endDate).toBe("2025-10-27");
    expect(at0001.endDate).toBe("2025-10-27");
  });

  it("returns the earlier week during Monday 23:59", () => {
    const w = lastCompletedWeek(new Date("2025-10-28T04:59:00Z"));
    expect(w.endDate).toBe("2025-10-20");
  });

  it("handles the March daylight-saving change (CST to CDT)", () => {
    // Window Tue 2025-03-04 .. Mon 2025-03-10 spans the change on Mar 9.
    const w = lastCompletedWeek(new Date("2025-03-12T18:00:00Z"));
    expect(w.startDate).toBe("2025-03-04");
    expect(w.start.toISOString()).toBe("2025-03-04T06:01:00.000Z"); // CST
    expect(w.end.toISOString()).toBe("2025-03-11T04:59:59.000Z"); // CDT
  });

  it("handles the November daylight-saving change (CDT to CST)", () => {
    // Window Tue 2025-10-28 .. Mon 2025-11-03 spans the change on Nov 2.
    const w = lastCompletedWeek(new Date("2025-11-05T18:00:00Z"));
    expect(w.startDate).toBe("2025-10-28");
    expect(w.start.toISOString()).toBe("2025-10-28T05:01:00.000Z"); // CDT
    expect(w.end.toISOString()).toBe("2025-11-04T05:59:59.000Z"); // CST
  });
});
