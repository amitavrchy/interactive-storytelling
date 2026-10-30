# The Last Lighthouse · project guide

A cinematic story about memory, belonging and finding a way home. Six chapters, two endings and five original environments connect a fictional Atlantic homecoming across a single storm-filled night.

## Reading

Scroll or use **Continue** to advance. The timeline moves text, atmosphere and the camera together. Only the active chapter's WebGL scene is mounted; pixel ratio is capped at 1.5. Sound is off until explicitly enabled and pauses when the tab is hidden.

**Reduced motion** provides readable stacked chapters without WebGL or pinned scrolling. The reader honours the system preference on first visit. Atmosphere captions default to on; narrative text is always available. UI labels, controls, captions, footnotes and form fields never use a font below 14px, including mobile overrides.

Escape opens the chapter menu. Dialogs trap focus; Escape dismisses them. Tab navigates controls and Enter/Space chooses an ending. Progress saves on the device, and damaged saves are discarded safely. API failure falls back to the original local edition.

## Accounts and studio

Accounts use 12-hour JWT sessions. Cloud sync is explicit: **Save to cloud** replaces account progress; **Restore from cloud** replaces device progress after confirmation. Device data is never silently replaced when signing in.

An administrator can edit chapter JSON, create/edit/delete archive entries and inspect real branch totals. Validation runs in the browser and API. The six core chapters remain published and cannot be deleted. Supplementary chapter CRUD exists in the API; changing the six-part journey requires changing the narrative model.

Set an unused `ADMIN_EMAIL` and strong `ADMIN_PASSWORD` in the backend environment to provision an administrator on startup. There is no default administrator password. Remove the provisioning password after creation; startup does not overwrite an existing account's credentials.

## Sharing

`/ending/beacon` and `/ending/rescue` have different scenes, copy and Open Graph images. Clipboard refusal provides a selectable link. Set the public site origin before the production frontend build for correct social URLs.

## Development and release

Use the [Client README](../README.md) for install/run/test commands, the [Server README](../../Server/README.md) for API setup, and the [deployment guide](../../Server/docs/DEPLOYMENT.md) for production configuration.

The only application directories at repository root are `Client/` and `Server/`. Their package files, scripts, content and documentation are self-contained. `.github/workflows/verify.yml` stays at repository root so GitHub can discover CI.
