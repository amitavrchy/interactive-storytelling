import { test, expect, type Page } from "@playwright/test";

async function openStudio(page: Page) {
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
}

test("unpublished editor changes survive section and site navigation until explicitly discarded", async ({
  page,
}) => {
  await openStudio(page);
  await page.getByRole("button", { name: /Where the sea remembers/ }).click();
  const editor = page.getByRole("textbox", { name: "Content JSON" });
  const draft = JSON.parse(await editor.inputValue());
  draft.title = "A draft that should not be lost";
  await editor.fill(JSON.stringify(draft, null, 2));
  await page
    .getByRole("button", { name: "Archive memories", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Your words are still here" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Keep editing", exact: true }).click();
  await expect(editor).toHaveValue(/A draft that should not be lost/);
  await page
    .getByRole("link", { name: "About the project", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Your words are still here" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(editor).toHaveValue(/A draft that should not be lost/);
  await page
    .getByRole("button", { name: "Archive memories", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Discard changes", exact: true })
    .click();
  await expect(page.getByRole("button", { name: "New memory" })).toBeVisible();
  await expect(editor).not.toBeVisible();
});

test("a published ending variant is the copy a reader actually receives", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openStudio(page);
  await page.getByRole("button", { name: /The shape of a new day/ }).click();
  const editor = page.getByRole("textbox", { name: "Content JSON" });
  const original = JSON.parse(await editor.inputValue());
  const edited = structuredClone(original);
  edited.contentJson.endings.beacon.title = "A light published from the studio";
  edited.contentJson.endings.beacon.paragraphs[0] =
    "This passage travelled from the editor to the shore.";
  const token = await page.evaluate(() =>
    sessionStorage.getItem("lighthouse-token"),
  );
  try {
    await editor.fill(JSON.stringify(edited, null, 2));
    await page.getByRole("button", { name: "Publish changes" }).click();
    await expect(page.getByRole("status")).toContainText("Published.");
    await page.goto("/story");
    for (let index = 0; index < 3; index++)
      await page
        .getByRole("button", { name: "Next chapter", exact: true })
        .click();
    await page
      .getByRole("button", { name: "Make your choice", exact: true })
      .click();
    await page.getByRole("button", { name: /Keep the light burning/ }).click();
    await expect(
      page.getByRole("heading", { name: "A light published from the studio" }),
    ).toBeVisible();
    await expect(
      page.getByText("This passage travelled from the editor to the shore."),
    ).toBeVisible();
  } finally {
    const response = await page.request.put(
      "http://localhost:5101/admin/chapters/first-light",
      { headers: { Authorization: `Bearer ${token}` }, data: original },
    );
    expect(response.ok()).toBe(true);
  }
});
