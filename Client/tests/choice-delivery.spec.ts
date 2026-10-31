import { test, expect } from "@playwright/test";

for (const storage of ["damaged", "blocked", "read-only"] as const) {
  test(`choice statistics are delivered when the saved outbox is ${storage}`, async ({
    page,
  }) => {
    if (storage === "damaged")
      await page.addInitScript(() =>
        localStorage.setItem("lighthouse-vote-outbox", "broken-json"),
      );
    else
      await page.addInitScript((readOnly) => {
        if (readOnly)
          localStorage.setItem(
            "lighthouse-vote-outbox",
            JSON.stringify([
              {
                requestId: "11111111-1111-4111-8111-111111111111",
                optionKey: "rescue",
              },
            ]),
          );
        const original = Storage.prototype.setItem;
        Object.defineProperty(Storage.prototype, "setItem", {
          value: function (this: Storage, key: string, value: string) {
            if (key === "lighthouse-vote-outbox")
              throw new DOMException("Storage is blocked", "SecurityError");
            return Reflect.apply(original, this, [key, value]);
          },
        });
      }, storage === "read-only");
    const posted: string[] = [];
    page.on("request", (request) => {
      if (
        request.url().endsWith("/choices/the-last-light/vote") &&
        request.method() === "POST"
      )
        posted.push(request.postDataJSON().requestId);
    });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/story");
    for (let i = 0; i < 3; i++)
      await page
        .getByRole("button", { name: "Next chapter", exact: true })
        .click();
    await page
      .getByRole("button", { name: "Make your choice", exact: true })
      .click();
    const response = page.waitForResponse(
      (response) =>
        response.url().endsWith("/choices/the-last-light/vote") &&
        response.request().method() === "POST" &&
        response.request().postDataJSON().requestId !==
          "11111111-1111-4111-8111-111111111111",
    );
    await page.getByRole("button", { name: /Keep the light burning/ }).click();
    expect((await response).status()).toBe(201);
    await expect(
      page.getByRole("heading", { name: "The light we keep" }),
    ).toBeVisible();
    if (storage === "read-only") expect(posted).toHaveLength(2);
    if (storage === "damaged")
      await expect
        .poll(() =>
          page.evaluate(() => localStorage.getItem("lighthouse-vote-outbox")),
        )
        .toBe("[]");
  });
}
