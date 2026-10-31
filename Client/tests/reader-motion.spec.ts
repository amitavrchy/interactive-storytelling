import { test, expect } from "@playwright/test";

test("preferences freeze the story while their own content remains scrollable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 540 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/story");
  await expect(page.locator(".pin-spacer")).toBeVisible();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect
    .poll(async () =>
      Number(await page.getByRole("progressbar").getAttribute("aria-valuenow")),
    )
    .toBeGreaterThan(0);
  await page.getByRole("button", { name: "Reading preferences" }).click();
  await expect(page.locator("html")).toHaveClass(/lenis-stopped/);
  const before = await page.evaluate(() => scrollY);
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.hover();
  await page.mouse.wheel(0, 700);
  await expect
    .poll(() => dialog.evaluate((element) => element.scrollTop))
    .toBeGreaterThan(0);
  expect(await page.evaluate(() => scrollY)).toBe(before);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(page.locator("html")).not.toHaveClass(/lenis-stopped/);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(before);
});

test("changing the device motion preference immediately switches to a readable, canvas-free story", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/story");
  await expect(page.locator(".cinematic-mode")).toBeVisible();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".reading-mode")).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
  await page.getByRole("button", { name: "Reading preferences" }).click();
  await expect(
    page.getByRole("checkbox", { name: /Reduced motion/ }),
  ).toBeChecked();
  await expect(
    page.getByRole("checkbox", { name: /Reduced motion/ }),
  ).toBeDisabled();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(page.locator(".cinematic-mode")).toBeVisible();
  await expect(page.locator("html")).toHaveClass(/lenis-stopped/);
  await page.keyboard.press("Escape");
  await expect(page.locator("html")).not.toHaveClass(/lenis-stopped/);
});

test("a browser that rejects WebGL still has an operable cinematic reading path", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      value: function (
        this: HTMLCanvasElement,
        kind: string,
        ...args: unknown[]
      ) {
        if (kind.startsWith("webgl"))
          throw new Error("WebGL is disabled by this browser.");
        return Reflect.apply(original, this, [kind, ...args]);
      },
    });
  });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/story");
  await expect(page.locator(".pin-spacer")).toBeVisible();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect
    .poll(async () =>
      Number(await page.getByRole("progressbar").getAttribute("aria-valuenow")),
    )
    .toBeGreaterThan(0);
  await expect(page.locator("canvas")).toHaveCount(0);
  expect(errors).toEqual([]);
});
