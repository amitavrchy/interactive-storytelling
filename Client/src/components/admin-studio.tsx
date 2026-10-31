"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, RefreshCw, ArrowUpRight, Plus, Trash2 } from "lucide-react";
import { z } from "zod";
import { useAuth } from "./auth-provider";
import { api, apiConfigured, errorMessage } from "@/lib/api";
import { chapters } from "@/lib/story-content";
import Dialog from "./dialog";
type RecordItem = { slug: string; title: string; [key: string]: unknown };
type Analytics = {
  choices: { optionKey: string; count: number }[];
  total: number;
};
const flags = z.enum([
  "shore",
  "keeper",
  "storm",
  "choice",
  "dawn",
  "complete",
]);
const contentSchema = z.object({
  label: z.string().min(1).max(100),
  subtitle: z.string().min(1).max(300),
  scene: z.enum(["fog", "lighthouse", "storm", "choice", "dawn", "epilogue"]),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  location: z.string().min(1).max(180),
  unlockFlag: flags,
  paragraphs: z.array(z.string().max(3000)).max(12),
  quote: z.string().min(1).max(500),
  caption: z.string().min(1).max(500),
  endings: z
    .object({
      beacon: z.object({
        title: z.string().min(1).max(160),
        eyebrow: z.string().min(1).max(160),
        description: z.string().min(1).max(500),
        paragraphs: z.array(z.string().max(3000)).min(1).max(12),
      }),
      rescue: z.object({
        title: z.string().min(1).max(160),
        eyebrow: z.string().min(1).max(160),
        description: z.string().min(1).max(500),
        paragraphs: z.array(z.string().max(3000)).min(1).max(12),
      }),
    })
    .optional(),
});
const chapterSchema = z.object({
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(80),
  title: z.string().min(1).max(160),
  sortOrder: z.number().int().min(0).max(100),
  published: z.boolean(),
  contentJson: contentSchema,
});
const loreSchema = z.object({
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(80),
  title: z.string().min(1).max(160),
  body: z.string().min(1).max(10000),
  category: z.string().min(1).max(80),
  date: z.string().min(1).max(100),
  unlockFlag: flags,
});
function editable(record: RecordItem) {
  const { id, ...value } = record;
  void id;
  return JSON.stringify(value, null, 2);
}
export default function AdminStudio() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const client = useQueryClient();
  const [tab, setTab] = useState<"chapters" | "lore">("chapters");
  const [selected, setSelected] = useState("");
  const [draft, setDraft] = useState("");
  const [savedDraft, setSavedDraft] = useState("");
  const [discarding, setDiscarding] = useState(false);
  const pendingAction = useRef<(() => void) | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const dirty = draft !== savedDraft;
  useEffect(() => {
    if (!dirty) return;
    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const beforeNavigation = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const link =
        event.target instanceof Element
          ? event.target.closest<HTMLAnchorElement>("a[href]")
          : null;
      if (!link || link.download || (link.target && link.target !== "_self"))
        return;
      const destination = new URL(link.href, window.location.href);
      if (
        destination.origin !== window.location.origin ||
        destination.pathname + destination.search ===
          window.location.pathname + window.location.search
      )
        return;
      event.preventDefault();
      event.stopPropagation();
      pendingAction.current = () =>
        router.push(
          destination.pathname + destination.search + destination.hash,
        );
      setDiscarding(true);
    };
    window.addEventListener("beforeunload", beforeUnload);
    window.addEventListener("click", beforeNavigation, true);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      window.removeEventListener("click", beforeNavigation, true);
    };
  }, [dirty, router]);
  function changeSelection(action: () => void) {
    if (dirty) {
      pendingAction.current = action;
      setDiscarding(true);
    } else action();
  }
  function changeTab(next: "chapters" | "lore") {
    if (next === tab) return;
    changeSelection(() => {
      setTab(next);
      setDraft("");
      setSavedDraft("");
      setSelected("");
      setCreating(false);
      setError("");
      setMessage("");
    });
  }
  const allowed = apiConfigured && user?.role === "ADMIN";
  const records = useQuery({
    queryKey: ["admin", tab],
    queryFn: async ({ signal }) =>
      (await api.get<RecordItem[]>(`/admin/${tab}`, { signal })).data,
    enabled: allowed,
    retry: false,
  });
  const stats = useQuery({
    queryKey: ["analytics"],
    queryFn: async ({ signal }) =>
      (await api.get<Analytics>("/admin/analytics", { signal })).data,
    enabled: allowed,
    retry: false,
    refetchInterval: allowed ? 30000 : false,
  });
  function select(item: RecordItem) {
    setSelected(item.slug);
    setDraft(editable(item));
    setSavedDraft(editable(item));
    setCreating(false);
    setError("");
    setMessage("");
  }
  async function save() {
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const parsed = JSON.parse(draft);
      const result = (
        tab === "chapters" ? chapterSchema : loreSchema
      ).safeParse(parsed);
      if (!result.success)
        throw new Error(
          result.error.issues
            .map((i) => `${i.path.join(".")}: ${i.message}`)
            .join(" · "),
        );
      if (!creating && parsed.slug !== selected)
        throw new Error(
          "The slug identifies this entry and cannot be changed.",
        );
      if (creating) await api.post(`/admin/${tab}`, result.data);
      else await api.put(`/admin/${tab}/${selected}`, result.data);
      setSavedDraft(draft);
      setSelected(parsed.slug);
      setCreating(false);
      await client.invalidateQueries({ queryKey: ["admin", tab] });
      await client.invalidateQueries({ queryKey: [tab] });
      setMessage(
        "Published. Readers will receive the new edition on their next visit.",
      );
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    setBusy(true);
    setError("");
    try {
      await api.delete(`/admin/${tab}/${selected}`);
      setDraft("");
      setSavedDraft("");
      setSelected("");
      setDeleting(false);
      await client.invalidateQueries({ queryKey: ["admin", tab] });
      await client.invalidateQueries({ queryKey: [tab] });
      setMessage("Entry removed.");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  function addLore() {
    setSavedDraft("");
    setSelected("");
    setCreating(true);
    setDraft(
      JSON.stringify(
        {
          slug: "new-memory",
          title: "An untold memory",
          category: "Personal effects",
          date: "October, 1987",
          unlockFlag: "complete",
          body: "Write the memory here.",
        },
        null,
        2,
      ),
    );
    setError("");
    setMessage("");
  }
  const coreChapter =
    tab === "chapters" && chapters.some((c) => c.slug === selected);
  return (
    <main id="main" className="studio-page section-wrap">
      <div className="page-heading">
        <p className="eyebrow">NORTH POINT STUDIO</p>
        <h1>
          Keep the
          <br />
          <em>story alive.</em>
        </h1>
        <p>
          Shape the words. Preserve the atmosphere. See where readers choose to
          go.
        </p>
      </div>
      {!apiConfigured ? (
        <div className="notice">
          This edition is running without a connected studio. Configure the
          story API to manage content and view shared analytics.
        </div>
      ) : loading ? (
        <p role="status">Opening the studio…</p>
      ) : !allowed ? (
        <div className="empty-state">
          <h2>
            A keeper&apos;s key <em>is required.</em>
          </h2>
          <p>
            Sign in with an administrator account to edit chapters, manage
            memories and view choice analytics.
          </p>
          <Link className="button button-gold" href="/account">
            Sign in
            <ArrowUpRight size={17} />
          </Link>
        </div>
      ) : (
        <>
          <section className="analytics-panel" aria-label="Choice analytics">
            <div>
              <p className="eyebrow">THE CHOICES WE MAKE</p>
              <h2>
                {stats.data?.total ?? "—"}
                <span> decisions recorded</span>
              </h2>
              <button
                className="control-button"
                onClick={() => stats.refetch()}
              >
                <RefreshCw size={13} />
                Refresh analytics
              </button>
            </div>
            <div className="analytics-bars">
              {["beacon", "rescue"].map((option) => {
                const count =
                  stats.data?.choices
                    .filter((c) => c.optionKey === option)
                    .reduce((n, c) => n + c.count, 0) || 0;
                const percent = stats.data?.total
                  ? Math.round((count / stats.data.total) * 100)
                  : 0;
                return (
                  <div key={option}>
                    <p>
                      {option === "beacon"
                        ? "Keep the light burning"
                        : "Take the rescue launch"}
                      <span>
                        {count} · {percent}%
                      </span>
                    </p>
                    <div className="stat-track">
                      <span style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
              {stats.isError && (
                <p className="notice error">{errorMessage(stats.error)}</p>
              )}
            </div>
          </section>
          <div className="studio-toolbar">
            <div className="filter-tabs">
              <button
                aria-pressed={tab === "chapters"}
                disabled={busy}
                onClick={() => changeTab("chapters")}
              >
                Chapters
              </button>
              <button
                aria-pressed={tab === "lore"}
                disabled={busy}
                onClick={() => changeTab("lore")}
              >
                Archive memories
              </button>
            </div>
            {tab === "lore" && (
              <button
                className="control-button"
                onClick={() => changeSelection(addLore)}
                disabled={busy}
              >
                <Plus size={15} />
                New memory
              </button>
            )}
          </div>
          <section className="studio-editor">
            <aside aria-label="Entries">
              {records.isLoading && <p role="status">Loading entries…</p>}
              {records.isError && (
                <p className="notice error">{errorMessage(records.error)}</p>
              )}
              {records.data?.map((item) => (
                <button
                  key={item.slug}
                  disabled={busy}
                  className={selected === item.slug ? "selected" : ""}
                  onClick={() => {
                    if (item.slug !== selected || creating)
                      changeSelection(() => select(item));
                  }}
                >
                  <span>{item.title}</span>
                  <small>{item.slug}</small>
                </button>
              ))}
            </aside>
            <div className="editor-body">
              {draft ? (
                <>
                  <div className="editor-heading">
                    <p className="eyebrow">
                      {creating ? "NEW MEMORY" : selected}
                      {dirty && (
                        <span className="draft-indicator">
                          {" "}
                          · Unsaved changes
                        </span>
                      )}
                    </p>
                    <div>
                      {!coreChapter && !creating && (
                        <button
                          className="icon-button delete-button"
                          aria-label="Delete entry"
                          disabled={busy}
                          onClick={() => setDeleting(true)}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                      <button
                        className="button button-gold"
                        disabled={busy}
                        onClick={save}
                      >
                        <Save size={15} />
                        {busy ? "Publishing…" : "Publish changes"}
                      </button>
                    </div>
                  </div>
                  <label className="field-label">
                    Content JSON
                    <textarea
                      className="json-editor"
                      disabled={busy}
                      spellCheck={false}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      rows={24}
                    />
                  </label>
                  <p className="fineprint">
                    Copy and atmosphere captions accept plain text. HTML is
                    never executed. Core story chapters remain published to keep
                    the narrative complete.
                  </p>
                </>
              ) : (
                <div className="empty-state">
                  <h2>
                    A story in <em>your hands.</em>
                  </h2>
                  <p>Select an entry to begin editing.</p>
                </div>
              )}
              {error && (
                <p className="notice error" role="alert">
                  {error}
                </p>
              )}
              {message && (
                <p className="notice success" role="status">
                  {message}
                </p>
              )}
            </div>
          </section>
        </>
      )}
      <Dialog
        open={discarding}
        onClose={() => {
          setDiscarding(false);
          pendingAction.current = null;
        }}
        title="Your words are still here"
      >
        <h2>
          Keep your
          <br />
          <em>changes?</em>
        </h2>
        <p className="muted">
          This entry has unpublished changes. Stay to finish editing, or discard
          the draft before opening another entry.
        </p>
        <button
          className="button button-gold full-width"
          onClick={() => {
            setDiscarding(false);
            pendingAction.current = null;
          }}
        >
          Keep editing
        </button>
        <button
          className="button button-quiet full-width"
          onClick={() => {
            const action = pendingAction.current;
            pendingAction.current = null;
            setDiscarding(false);
            action?.();
          }}
        >
          Discard changes
        </button>
      </Dialog>
      <Dialog
        open={deleting}
        onClose={() => setDeleting(false)}
        title="Remove this memory"
      >
        <h2>
          Let this
          <br />
          <em>fragment go?</em>
        </h2>
        <p className="muted">
          This permanently removes “{selected}” from the shared archive.
        </p>
        <button
          className="button button-gold full-width"
          disabled={busy}
          onClick={remove}
        >
          Delete entry
          <Trash2 size={16} />
        </button>
        <button
          className="button button-quiet full-width"
          onClick={() => setDeleting(false)}
        >
          Keep this memory
        </button>
      </Dialog>
    </main>
  );
}
