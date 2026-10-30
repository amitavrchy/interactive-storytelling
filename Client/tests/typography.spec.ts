import { test, expect, type Page } from "@playwright/test";

async function checkTypography(page: Page) {
  const violations = await page.evaluate(() => {
    const elements = new Set<HTMLElement>();
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
    );
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const parent = node.parentElement;
      if (
        node.textContent?.trim() &&
        parent &&
        !parent.closest("script, style, svg, noscript")
      )
        elements.add(parent);
    }
    for (const element of document.querySelectorAll<HTMLElement>(
      "input, textarea, select",
    ))
      elements.add(element);
    return [...elements].flatMap((element) => {
      const style = getComputedStyle(element);
      if (
        !element.getClientRects().length ||
        style.visibility !== "visible" ||
        style.opacity === "0"
      )
        return [];
      const size = Number.parseFloat(style.fontSize);
      return size < 14
        ? [
            {
              element: element.tagName,
              text: element.textContent?.trim().slice(0, 65),
              size,
            },
          ]
        : [];
    });
  });
  expect(violations, `Text below 14px on ${page.url()}`).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    `Horizontal overflow on ${page.url()}`,
  ).toBe(true);
}

test("every page and reader preferences render text at least 14px", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const path of [
    "/",
    "/chapters",
    "/archive",
    "/about",
    "/account",
    "/admin",
    "/ending/beacon",
    "/ending/rescue",
    "/story",
  ]) {
    await page.goto(path);
    await page.getByRole("heading", { level: 1 }).waitFor();
    await checkTypography(page);
  }
  await page.getByRole("button", { name: "Reading preferences" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await checkTypography(page);
});

test("360px layouts keep the 14px minimum without clipping navigation or controls", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const path of ["/", "/archive", "/chapters", "/story"]) {
    await page.goto(path);
    await page.getByRole("heading", { level: 1 }).waitFor();
    await checkTypography(page);
  }
});

test("production standalone serves image assets with security headers", async ({
  request,
}) => {
  const page = await request.get("/");
  expect(page.status()).toBe(200);
  expect(page.headers()["x-powered-by"]).toBeUndefined();
  expect(page.headers()["x-content-type-options"]).toBe("nosniff");
  expect(page.headers()["x-frame-options"]).toBe("DENY");
  const image = await request.get("/images/north-point.webp");
  expect(image.status()).toBe(200);
  expect(image.headers()["content-type"]).toContain("image/webp");
});
