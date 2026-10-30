import { test, expect } from "@playwright/test";

test("landing, navigation, mobile layout and sound opt-in", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "The Last Lighthouse." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await expect(
    page.getByRole("button", { name: "Turn sound on" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Turn sound on" }).click();
  await expect(
    page.getByRole("button", { name: "Turn sound off" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Turn sound off" }).click();
  await page.getByRole("button", { name: "Reading preferences" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.goto("/chapters");
  await expect(
    page.getByRole("link", { name: /Where the sea remembers/ }),
  ).toBeVisible();
  await expect(page.locator(".library-row.locked")).toHaveCount(5);
  expect(errors).toEqual([]);
});

for (const ending of ["beacon", "rescue"] as const) {
  test(`complete the reduced-motion story with ${ending} ending, persist and unlock archive`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/story");
    await expect(page.locator(".reading-mode")).toBeVisible();
    await expect(page.locator("canvas")).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: "Where the sea remembers" }),
    ).toBeVisible();
    for (let index = 0; index < 3; index++)
      await page
        .getByRole("button", { name: "Next chapter", exact: true })
        .click();
    await page
      .getByRole("button", { name: "Make your choice", exact: true })
      .click();
    await page
      .getByRole("button", {
        name:
          ending === "beacon"
            ? /Keep the light burning/
            : /Take the rescue launch/,
      })
      .click();
    await expect(
      page.getByRole("heading", {
        name: ending === "beacon" ? "The light we keep" : "The light we carry",
      }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByRole("heading", {
        name: ending === "beacon" ? "The light we keep" : "The light we carry",
      }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Next chapter", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Finish the story", exact: true })
      .click();
    await expect(
      page.getByText("YOUR JOURNEY IS COMPLETE", { exact: true }),
    ).toBeVisible();
    await page.goto("/archive");
    await expect(page.getByText("6 of 6 memories collected")).toBeVisible();
    await page
      .getByRole("button", { name: "Read The letter", exact: true })
      .click();
    await expect(page.getByRole("dialog")).toContainText(
      "Come before the light goes out.",
    );
    await page.keyboard.press("Escape");
    await page.getByRole("searchbox").fill("brass");
    await expect(page.locator(".archive-card")).toHaveCount(1);
    await page.goto(`/ending/${ending}`);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      "content",
      /The light we/,
    );
    const image = await page.request.get(`/ending/${ending}/opengraph-image`);
    expect(image.status()).toBe(200);
    expect(image.headers()["content-type"]).toContain("image/png");
    await page.getByRole("button", { name: "Copy ending link" }).click();
    await expect(page.getByRole("status")).toContainText("Link copied");
  });
}

test("cinematic scroll updates progress and Escape opens the chapter menu", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/story");
  await expect(page.locator(".cinematic-mode")).toBeVisible();
  await expect(page.locator(".pin-spacer")).toBeVisible();
  await page.mouse.move(300, 300);
  await page.mouse.wheel(0, 1000);
  await expect
    .poll(async () =>
      Number(await page.getByRole("progressbar").getAttribute("aria-valuenow")),
    )
    .toBeGreaterThan(0);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.getByRole("button", { name: "Reading preferences" }).click();
  await page.getByRole("checkbox", { name: /Reduced motion/ }).check();
  await page.getByRole("button", { name: "Ready when you are" }).click();
  await expect(page.locator(".reading-mode")).toBeVisible();
});

test("reader account validates, saves cloud progress and restores after local reset", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/story");
  await page.getByRole("button", { name: "Next chapter", exact: true }).click();
  await page.goto("/account");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await page.getByRole("textbox", { name: "Your name" }).fill("A Reader");
  await page
    .getByRole("textbox", { name: "Email address" })
    .fill(`reader-${Date.now()}@example.test`);
  await page
    .getByLabel("Password", { exact: true })
    .fill("browser-reader-password-0123");
  await page
    .locator("form")
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Save to cloud", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("safely saved");
  await page.goto("/chapters");
  await page.getByRole("button", { name: "Begin a new journey" }).click();
  await page.getByRole("button", { name: "Begin again", exact: true }).click();
  await page.goto("/account");
  await page
    .getByRole("button", { name: "Restore from cloud", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Restore from cloud", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("now on this device");
  await page.goto("/story");
  await expect(
    page.getByRole("heading", { name: "A keeper of small things" }),
  ).toBeVisible();
});

test("administrator edits copy, publishes a memory and sees real choice analytics", async ({
  page,
}) => {
  // Exercise an in-flight publish while immediately trying to change sections.
  await page.route("**/admin/chapters/*", async (route) => {
    if (route.request().method() === "PUT")
      await new Promise((resolve) => setTimeout(resolve, 250));
    await route.continue();
  });
  await page.goto("/admin");
  await expect(page.getByText("A keeper's key is required.")).toBeVisible();
  await page.goto("/account");
  await page
    .getByRole("textbox", { name: "Email address" })
    .fill("studio@example.test");
  await page
    .getByLabel("Password", { exact: true })
    .fill("browser-test-only-password-0123");
  await page
    .locator("form")
    .getByRole("button", { name: "Sign in", exact: true })
    .click();
  await page.getByRole("link", { name: "Open the studio" }).click();
  await expect(page.getByText(/decisions recorded/)).toBeVisible();
  await page.getByRole("button", { name: /Where the sea remembers/ }).click();
  const editor = page.getByRole("textbox", { name: "Content JSON" });
  const original = await editor.inputValue();
  const content = JSON.parse(original);
  content.contentJson.caption = "The sea speaks softly. A browser test.";
  await editor.fill(JSON.stringify(content, null, 2));
  await page.getByRole("button", { name: "Publish changes" }).click();
  await expect(page.getByRole("status")).toContainText("Published.");
  await editor.fill(original);
  await page.getByRole("button", { name: "Publish changes" }).click();
  await page
    .getByRole("button", { name: "Archive memories", exact: true })
    .click();
  await page.getByRole("button", { name: "New memory" }).click();
  const memory = JSON.parse(await editor.inputValue());
  memory.slug = `test-memory-${Date.now()}`;
  memory.title = "A browser memory";
  await editor.fill(JSON.stringify(memory, null, 2));
  await page.getByRole("button", { name: "Publish changes" }).click();
  await expect(page.getByRole("status")).toContainText("Published.");
  await page.getByRole("button", { name: "Delete entry" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete entry" })
    .click();
  await expect(page.getByRole("status")).toContainText("Entry removed.");
});

test("a failed API and damaged local save still allow the full reader to begin", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("lighthouse-progress-v1", "damaged-json"),
  );
  await page.route("http://localhost:4100/**", (route) => route.abort());
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/story");
  await expect(
    page.getByRole("heading", { name: "Where the sea remembers" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Next chapter", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "A keeper of small things" }),
  ).toBeVisible();
});

test("keyboard choice is focus-trapped and clipboard refusal offers a selectable link", async ({
  page,
  context,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/story");
  for (let i = 0; i < 3; i++)
    await page
      .getByRole("button", { name: "Next chapter", exact: true })
      .click();
  await page
    .getByRole("button", { name: "Make your choice", exact: true })
    .click();
  const option = page.getByRole("button", { name: /Keep the light burning/ });
  await option.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: "The light we keep" }),
  ).toBeVisible();
  await context.clearPermissions();
  await page.goto("/ending/beacon");
  await page.getByRole("button", { name: "Copy ending link" }).click();
  await expect(page.getByRole("textbox", { name: "Ending link" })).toHaveValue(
    "http://localhost:3100/ending/beacon",
  );
});
