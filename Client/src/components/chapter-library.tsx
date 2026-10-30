"use client";
import Link from "next/link";
import { ArrowUpRight, LockKeyhole, Check, RotateCcw } from "lucide-react";
import { useState } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { useChapters } from "@/lib/api";
import { chapters } from "@/lib/story-content";
import { restart } from "@/features/story/storySlice";
import Dialog from "./dialog";
export default function ChapterLibrary() {
  const story = useAppSelector(s => s.story); const dispatch = useAppDispatch();
  const { data, isError } = useChapters(); const [confirm, setConfirm] = useState(false);
  return <main id="main"><div className="page-heading section-wrap"><p className="eyebrow">A NIGHT AT NORTH POINT</p><h1>Every chapter.<br /><em>A little closer.</em></h1><p>Six moments between dusk and dawn. Follow them in order, or return to a place you remember.</p><div className="page-status"><span className="status-dot" />{story.completed ? "Your journey is complete" : `${story.flags.length ? story.furthestChapter + 1 : 0} of 6 chapters discovered`}<span>·</span>Progress saved on this device</div>{!story.storageAvailable && <p className="notice">Your browser is blocking storage. Keep this tab open to keep your place.</p>}{isError && <p className="notice">The studio is offline. You&apos;re reading the original edition.</p>}</div><div className="library-list section-wrap">{chapters.map((seed, index) => {
    const chapter = data?.find(c => c.slug === seed.slug) || seed;
    const unlocked = index === 0 || (story.hydrated && index <= story.furthestChapter);
    const read = index < story.furthestChapter || story.completed;
    const inner = <><span className="chapter-number">0{index + 1}</span><div className={`chapter-thumbnail thumbnail-${index}`} aria-hidden="true" /><div className="library-copy"><p className="eyebrow">{chapter.label} <span>· {chapter.time}</span></p><h2>{chapter.title}</h2><p>{unlocked ? chapter.subtitle : "The story will bring you here."}</p></div><span className="library-status">{read ? <><Check size={13} />Revisit</> : unlocked ? <>Enter<ArrowUpRight size={16} /></> : <><LockKeyhole size={14} />Undiscovered</>}</span></>;
    return unlocked ? <Link className="library-row" href={`/story?chapter=${chapter.slug}`} key={chapter.slug}>{inner}</Link> : <div className="library-row locked" key={chapter.slug} aria-label={`${chapter.label}, locked`}>{inner}</div>;
  })}<div className="library-bottom"><p className="fineprint">Your decisions shape what waits at first light.</p>{story.flags.length > 0 && <button className="control-button" onClick={() => setConfirm(true)}><RotateCcw size={14} />Begin a new journey</button>}</div></div><Dialog open={confirm} onClose={() => setConfirm(false)} title="A new beginning"><h2>Return to<br /><em>the shore?</em></h2><p className="muted">This resets the chapters, ending and archive saved on this device. Your reading preferences stay with you.</p><button className="button button-gold full-width" onClick={() => { dispatch(restart()); setConfirm(false); }}>Begin again<RotateCcw size={16} /></button><button className="button button-quiet full-width" onClick={() => setConfirm(false)}>Keep my journey</button></Dialog></main>;
}
