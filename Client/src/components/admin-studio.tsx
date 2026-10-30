"use client";
import { useState } from "react";
import Link from "next/link";
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
  const { user, loading } = useAuth();
  const client = useQueryClient();
  const [tab, setTab] = useState<"chapters" | "lore">("chapters");
  const [selected, setSelected] = useState("");
  const [draft, setDraft] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const allowed = apiConfigured && user?.role === "ADMIN";
  const records = useQuery({
    queryKey: ["admin", tab],
    queryFn: async () => (await api.get<RecordItem[]>(`/admin/${tab}`)).data,
    enabled: allowed,
    retry: false,
  });
  const stats = useQuery({
    queryKey: ["analytics"],
    queryFn: async () => (await api.get<Analytics>("/admin/analytics")).data,
    enabled: allowed,
    retry: false,
    refetchInterval: allowed ? 30000 : false,
  });
  function select(item: RecordItem) {
    setSelected(item.slug);
    setDraft(editable(item));
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
                onClick={() => {
                  setTab("chapters");
                  setDraft("");
                  setSelected("");
                  setError("");
                  setMessage("");
                }}
              >
                Chapters
              </button>
              <button
                aria-pressed={tab === "lore"}
                disabled={busy}
                onClick={() => {
                  setTab("lore");
                  setDraft("");
                  setSelected("");
                  setError("");
                  setMessage("");
                }}
              >
                Archive memories
              </button>
            </div>
            {tab === "lore" && (
              <button
                className="control-button"
                onClick={addLore}
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
                  onClick={() => select(item)}
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
