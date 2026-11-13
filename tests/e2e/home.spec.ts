import { expect, test } from "@playwright/test";

test("home page shows NFL and FBS kicker tables", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.ok()).toBeTruthy();
  await expect(page.getByRole("heading", { level: 1, name: "Oops All Kickers" })).toBeVisible();
  for (const title of ["NFL kickers", "FBS kickers"]) {
    await expect(page.getByRole("heading", { level: 2, name: title })).toBeVisible();
  }
  for (const header of ["Name", "Team", "FG made", "FG attempts", "Longest"]) {
    await expect(page.getByRole("columnheader", { name: header, exact: true })).toHaveCount(2);
  }
});

test("kicker pool appears above the scoring tables", async ({ page }) => {
  await page.goto("/");
  const pool = page.getByRole("heading", { level: 2, name: "Kicker pool" });
  await expect(pool).toBeVisible();
  const poolY = (await pool.boundingBox())!.y;
  const nflY = (await page.getByRole("heading", { level: 2, name: "NFL kickers" }).boundingBox())!.y;
  expect(poolY).toBeLessThan(nflY);
  const table = page.getByRole("table", { name: /Roster as of|All kickers/ });
  if (await table.count()) {
    for (const header of ["League", "Name", "Team"]) {
      await expect(table.getByRole("columnheader", { name: header, exact: true })).toBeVisible();
    }
  } else {
    await expect(page.getByText("Kicker list unavailable, try again later")).toBeVisible();
  }
});

test("kicker pool next link goes to page 2 when there is more than one page", async ({ page }) => {
  await page.goto("/");
  const next = page.getByRole("navigation", { name: "Kicker pool pages" }).getByRole("link", { name: "Next" });
  if (await next.count()) {
    await expect(next).toHaveAttribute("href", "/?page=2");
  }
});

test("bad page values do not crash the home page", async ({ page }) => {
  for (const value of ["999", "abc"]) {
    const response = await page.goto(`/?page=${value}`);
    expect(response?.ok()).toBeTruthy();
    await expect(page.getByRole("heading", { level: 2, name: "Kicker pool" })).toBeVisible();
  }
});

test("home page shows the database status line and keeps the tables", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText(/Database: (connected, time|unreachable)/)).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "NFL kickers" })).toBeVisible();
});
