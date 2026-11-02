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
