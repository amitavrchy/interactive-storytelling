import { test, expect } from "@playwright/test";

test("temporary API failure preserves a saved session and offers a working reconnect", async ({
  page,
}) => {
  await page.addInitScript(() =>
    sessionStorage.setItem(
      "lighthouse-token",
      "saved-session-for-browser-test",
    ),
  );
  let available = false;
  await page.route("**/auth/me", (route) =>
    route.fulfill({
      status: available ? 200 : 503,
      contentType: "application/json",
      body: JSON.stringify(
        available
          ? {
              id: "returning-reader",
              name: "Returning Reader",
              email: "returning@example.test",
              role: "READER",
            }
          : { message: "The API is starting." },
      ),
    }),
  );
  await page.goto("/account");
  await expect(
    page.getByRole("button", { name: "Reconnect to your account" }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => sessionStorage.getItem("lighthouse-token")),
  ).toBe("saved-session-for-browser-test");
  available = true;
  await page.getByRole("button", { name: "Reconnect to your account" }).click();
  await expect(
    page.getByRole("heading", { name: "Returning Reader." }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Save to cloud", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Reconnect to your account" }),
  ).not.toBeVisible();
});

test("a rejected authenticated request clears the expired session and returns to sign-in", async ({
  page,
}) => {
  await page.goto("/account");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await page.getByRole("textbox", { name: "Your name" }).fill("Session Reader");
  await page
    .getByRole("textbox", { name: "Email address" })
    .fill(`session-${Date.now()}@example.test`);
  await page
    .getByLabel("Password", { exact: true })
    .fill("browser-session-password-0123");
  await page
    .locator("form")
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Save to cloud", exact: true }),
  ).toBeVisible();
  await page.route("**/progress", (route) =>
    route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({
        message: "Your session has expired. Please sign in again.",
      }),
    }),
  );
  await page
    .getByRole("button", { name: "Save to cloud", exact: true })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Email address" }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => sessionStorage.getItem("lighthouse-token")),
  ).toBeNull();
  await expect(
    page.getByRole("button", { name: "Reconnect to your account" }),
  ).not.toBeVisible();
});
