import { test, expect } from "@playwright/test";

test("a library deep link advances its URL and restores the current chapter after refresh", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/story");
  await page.getByRole("button", { name: "Next chapter", exact: true }).click();
  await page.goto("/chapters");
  await page.getByRole("link", { name: /A keeper of small things/ }).click();
  await expect(page).toHaveURL(/chapter=the-keeper/);
  await page.getByRole("button", { name: "Next chapter", exact: true }).click();
  await expect(page).toHaveURL(/chapter=the-storm/);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "What the dark brings in" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /03.*06/ }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /01.*Prologue/ })
    .click();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Where the sea remembers" }),
  ).toBeVisible();
});

test("a locked deep link resumes the saved chapter instead of bypassing the choice", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/story?chapter=epilogue");
  await expect(
    page.getByRole("heading", { name: "Where the sea remembers" }),
  ).toBeVisible();
  await expect(page).toHaveURL(/chapter=prologue/);
});
