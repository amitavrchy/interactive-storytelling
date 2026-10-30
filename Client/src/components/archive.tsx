"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  ArrowUpRight,
  LockKeyhole,
  FileText,
  KeyRound,
  Radio,
  Map,
  Flower2,
  BookOpen,
} from "lucide-react";
import { useAppSelector } from "@/lib/store";
import { useLore } from "@/lib/api";
import { lore, type LoreEntry } from "@/lib/story-content";
import Dialog from "./dialog";
const icons = [FileText, KeyRound, BookOpen, Radio, Map, Flower2];
export default function Archive() {
  const flags = useAppSelector((s) => s.story.flags);
  const { data, isError } = useLore();
  const [entry, setEntry] = useState<LoreEntry | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const entries = data || lore;
  const unlockedCount = entries.filter((item) =>
    flags.includes(item.unlockFlag),
  ).length;
  const filtered = useMemo(
    () =>
      entries.filter(
        (item) =>
          (filter !== "found" || flags.includes(item.unlockFlag)) &&
          (!search ||
            (flags.includes(item.unlockFlag) &&
              `${item.title} ${item.body} ${item.category}`
                .toLowerCase()
                .includes(search.toLowerCase()))),
      ),
    [entries, filter, flags, search],
  );
  return (
    <main id="main">
      <div className="page-heading section-wrap">
        <p className="eyebrow">THINGS THE TIDE LEFT BEHIND</p>
        <h1>
          Small things.
          <br />
          <em>Long memories.</em>
        </h1>
        <p>
          A letter. A key. A voice in the static. As you travel through the
          story, its fragments find a home here.
        </p>
        <div className="page-status">
          <span className="status-dot" />
          {unlockedCount} of {entries.length} memories collected
        </div>
        {isError && (
          <p className="notice">
            The studio is offline. The original archive is still here.
          </p>
        )}
      </div>
      <section
        className="archive-section section-wrap"
        aria-label="Collected memories"
      >
        <div className="archive-toolbar">
          <div className="filter-tabs" aria-label="Filter memories">
            <button
              aria-pressed={filter === "all"}
              onClick={() => setFilter("all")}
            >
              All fragments <span>{entries.length}</span>
            </button>
            <button
              aria-pressed={filter === "found"}
              onClick={() => setFilter("found")}
            >
              Collected <span>{unlockedCount}</span>
            </button>
          </div>
          <label className="search-field">
            <Search size={15} />
            <input
              placeholder="Search your memories"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search collected memories"
              type="search"
            />
          </label>
        </div>
        <div className="archive-grid">
          {filtered.map((item) => {
            const unlocked = flags.includes(item.unlockFlag);
            const index = lore.findIndex((l) => l.slug === item.slug);
            const Icon = icons[Math.max(0, index) % icons.length];
            return (
              <button
                className={`archive-card ${unlocked ? "found" : "locked"}`}
                key={item.slug}
                disabled={!unlocked}
                onClick={() => setEntry(item)}
                aria-label={
                  unlocked ? `Read ${item.title}` : "Undiscovered memory"
                }
              >
                <div className="archive-object">
                  <Icon strokeWidth={0.8} size={70} />
                  {!unlocked && (
                    <span className="object-lock">
                      <LockKeyhole size={13} />
                    </span>
                  )}
                </div>
                <div className="archive-card-copy">
                  <p className="eyebrow">
                    {unlocked ? item.category : "YET TO BE FOUND"}
                  </p>
                  <h2>{unlocked ? item.title : "A hidden memory"}</h2>
                  <div className="archive-card-bottom">
                    <span>
                      {unlocked ? item.date : "Continue the story to discover"}
                    </span>
                    {unlocked && <ArrowUpRight size={17} />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        {filtered.length === 0 && (
          <div className="empty-state">
            <h2>
              No memories here. <em>Yet.</em>
            </h2>
            <p>
              {search
                ? "Try another search, or clear the field to see all fragments."
                : "The story has something waiting for you."}
            </p>
            <Link href="/story" className="text-link">
              Follow the light
              <ArrowUpRight size={16} />
            </Link>
          </div>
        )}
      </section>
      <Dialog
        open={!!entry}
        onClose={() => setEntry(null)}
        title={entry?.category || "Memory"}
      >
        <p className="eyebrow muted">{entry?.date}</p>
        <h2 className="memory-title">{entry?.title}</h2>
        <div className="memory-body">
          {entry?.body.split("\n\n").map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        <p className="memory-signature">From the North Point collection</p>
      </Dialog>
    </main>
  );
}
