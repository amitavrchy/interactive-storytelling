"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  ArrowLeft,
  BookOpen,
  Compass,
  Check,
  Menu,
  Radio,
  Sun,
  Share2,
} from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { chapters, endings, type Ending } from "@/lib/story-content";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import {
  chooseEnding,
  completeStory,
  visitChapter,
} from "@/features/story/storySlice";
import { useChapters } from "@/lib/api";
import { flushVotes, recordChoice } from "@/lib/choice-queue";
import ReaderControls from "../reader-controls";
import Dialog from "../dialog";
const Atmosphere = dynamic(() => import("./scenes/atmosphere"), { ssr: false });
gsap.registerPlugin(ScrollTrigger);

export default function StoryReader() {
  const story = useAppSelector((s) => s.story);
  const dispatch = useAppDispatch();
  const search = useSearchParams();
  const router = useRouter();
  const { data } = useChapters();
  const seed = chapters[story.chapterIndex];
  const chapter = data?.find((c) => c.slug === seed.slug) || seed;
  const ending = story.ending ? endings[story.ending] : null;
  const paragraphs =
    story.chapterIndex === 4 && ending ? ending.paragraphs : chapter.paragraphs;
  const [menu, setMenu] = useState(false);
  const [choice, setChoice] = useState(false);
  const [progress, setProgress] = useState(0);
  const container = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const smooth = useRef<Lenis | null>(null);
  const initialized = useRef(false);
  const trigger = useRef<ScrollTrigger | null>(null);
  const reduced = story.reducedMotion;

  useEffect(() => {
    if (!story.hydrated || initialized.current) return;
    initialized.current = true;
    const requested = chapters.findIndex(
      (c) => c.slug === search.get("chapter"),
    );
    dispatch(
      visitChapter(
        requested >= 0 && requested <= story.furthestChapter
          ? requested
          : story.chapterIndex,
      ),
    );
  }, [
    dispatch,
    search,
    story.hydrated,
    story.furthestChapter,
    story.chapterIndex,
  ]);

  useEffect(() => {
    void flushVotes();
    window.addEventListener("online", flushVotes);
    return () => window.removeEventListener("online", flushVotes);
  }, []);

  useEffect(() => {
    if (!story.hydrated || !container.current || !stage.current) return;
    window.scrollTo({ top: 0, behavior: "instant" });
    stage.current
      .querySelector<HTMLHeadingElement>("h1")
      ?.focus({ preventScroll: true });
    if (reduced) return;
    const lenis = new Lenis({ duration: 1.05, smoothWheel: true });
    smooth.current = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    const ctx = gsap.context(() => {
      const panels = gsap.utils.toArray<HTMLElement>(
        ".narrative-panel",
        stage.current!,
      );
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: container.current,
          start: "top top",
          end: () => `+=${window.innerHeight * (panels.length + 1) * 0.85}`,
          pin: stage.current,
          scrub: 0.65,
          onUpdate: (self) => setProgress(Math.round(self.progress * 100)),
          invalidateOnRefresh: true,
        },
      });
      trigger.current = timeline.scrollTrigger!;
      timeline.to(
        ".chapter-title-card",
        { opacity: 0, y: -35, duration: 0.7 },
        0.5,
      );
      panels.forEach((panel, i) => {
        const at = i + 1;
        timeline.fromTo(
          panel,
          { autoAlpha: 0, y: 28 },
          { autoAlpha: 1, y: 0, duration: 0.6 },
          at,
        );
        if (i < panels.length - 1)
          timeline.to(panel, { autoAlpha: 0, y: -28, duration: 0.4 }, at + 0.8);
      });
      timeline.to({}, { duration: 0.5 });
      timeline.fromTo(
        ".story-background",
        { scale: 1 },
        { scale: 1.07, duration: timeline.duration(), ease: "none" },
        0,
      );
    }, container);
    // Pinning changes document height after Lenis measures its initial scroll limit.
    // Refresh both together so a reader's very first wheel/touch gesture is retained.
    const resize = () => lenis.resize();
    ScrollTrigger.addEventListener("refresh", resize);
    ScrollTrigger.refresh();
    lenis.resize();
    return () => {
      ScrollTrigger.removeEventListener("refresh", resize);
      ctx.revert();
      gsap.ticker.remove(tick);
      lenis.destroy();
      smooth.current = null;
      trigger.current = null;
    };
  }, [story.hydrated, story.chapterIndex, reduced, paragraphs.length]);

  useEffect(() => {
    if (choice || menu) smooth.current?.stop();
    else smooth.current?.start();
  }, [choice, menu]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !document.querySelector("dialog[open]")) {
        event.preventDefault();
        setMenu((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const goTo = useCallback(
    (index: number) => {
      setProgress(0);
      dispatch(visitChapter(index));
      setMenu(false);
    },
    [dispatch],
  );
  function continueStory() {
    if (story.chapterIndex === 5 && story.completed) {
      router.push(`/ending/${story.ending}`);
      return;
    }
    if (!reduced && progress < 98 && trigger.current) {
      const st = trigger.current;
      const total = paragraphs.length + 2;
      const next = Math.min(
        1,
        (Math.floor(st.progress * total) + 1) / total + 0.04,
      );
      smooth.current?.scrollTo(st.start + (st.end - st.start) * next, {
        duration: 0.8,
      });
      return;
    }
    if (story.chapterIndex === 3 && !story.ending) {
      setChoice(true);
      return;
    }
    if (story.chapterIndex < 5) goTo(story.chapterIndex + 1);
    else dispatch(completeStory());
  }
  function selectEnding(value: Ending) {
    dispatch(chooseEnding(value));
    recordChoice(value);
    setChoice(false);
    goTo(4);
  }
  if (!story.hydrated)
    return (
      <main id="main" className="story-loading">
        <p className="eyebrow">FINDING THE SHORE…</p>
      </main>
    );

  return (
    <main
      id="main"
      className={`story-reader ${reduced ? "reading-mode" : "cinematic-mode"}`}
    >
      <nav className="progress-rail" aria-label="Chapter progress">
        {chapters.map((c, i) => (
          <button
            key={c.slug}
            disabled={i > story.furthestChapter}
            className={
              i === story.chapterIndex
                ? "active"
                : i < story.chapterIndex
                  ? "past"
                  : ""
            }
            onClick={() => goTo(i)}
            aria-label={`Chapter ${i + 1}: ${c.label}`}
            aria-current={i === story.chapterIndex ? "step" : undefined}
          >
            <span>0{i + 1}</span>
            <i />
            <span className="rail-label">{c.label}</span>
          </button>
        ))}
      </nav>
      <section
        ref={container}
        className="chapter-scroll"
        key={`${story.chapterIndex}-${reduced}`}
      >
        <div ref={stage} className={`chapter-stage scene-${chapter.scene}`}>
          <div className="story-background" aria-hidden="true" />
          <div className="story-vignette" aria-hidden="true" />
          {!reduced && <Atmosphere key={chapter.slug} scene={chapter.scene} />}
          <div className="chapter-meta">
            <span className="eyebrow">{chapter.location}</span>
            <span className="chapter-clock">{chapter.time}</span>
          </div>
          <div className="chapter-title-card">
            <p className="eyebrow">
              CHAPTER 0{story.chapterIndex + 1} <span> / </span> {chapter.label}
            </p>
            <h1 tabIndex={-1}>
              {story.chapterIndex === 4 && ending
                ? ending.title
                : chapter.title}
            </h1>
            <p className="chapter-subtitle">
              {story.chapterIndex === 4 && ending
                ? ending.description
                : chapter.subtitle}
            </p>
            <div className="chapter-ornament">
              <span />
              <Compass size={20} strokeWidth={1} />
              <span />
            </div>
            <p className="chapter-instruction">
              {reduced
                ? "Take your time. The story is yours."
                : "SCROLL TO LET THE STORY UNFOLD"}
            </p>
          </div>
          {paragraphs.map((paragraph, i) => (
            <div className="narrative-panel" key={`${chapter.slug}-${i}`}>
              <span className="passage-number">
                0{i + 1} / 0{paragraphs.length}
              </span>
              <p>{paragraph}</p>
            </div>
          ))}
          <div className="narrative-panel narrative-quote">
            <span className="star-mark">✳</span>
            <blockquote>“{chapter.quote}”</blockquote>
            {story.chapterIndex === 5 && (
              <div className="ending-card">
                {!story.completed ? (
                  <button
                    className="button button-gold"
                    onClick={() => dispatch(completeStory())}
                  >
                    Finish the story
                    <Check size={16} />
                  </button>
                ) : (
                  <>
                    <p className="eyebrow">YOUR JOURNEY IS COMPLETE</p>
                    <div className="ending-actions">
                      <Link
                        className="button button-gold"
                        href={`/ending/${story.ending}`}
                      >
                        Share your ending
                        <Share2 size={16} />
                      </Link>
                      <Link className="text-link" href="/archive">
                        Open your archive
                        <BookOpen size={16} />
                      </Link>
                    </div>
                    <p className="fineprint">
                      An original story by The Last Lighthouse project.
                      <br />
                      Thank you for keeping the light.
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
          {story.captions && (
            <p className="caption-track">
              <AudioCaption />
              {chapter.caption}
            </p>
          )}
        </div>
      </section>
      <div className="story-toolbar">
        <button
          className="control-button chapter-menu-trigger"
          onClick={() => setMenu(true)}
        >
          <Menu size={16} />
          <span>
            0{story.chapterIndex + 1} <span className="muted">/ 06</span>
            <span className="toolbar-chapter-name"> — {chapter.label}</span>
          </span>
        </button>
        <div
          className="chapter-progress"
          role="progressbar"
          aria-label="Progress through this chapter"
          aria-valuenow={reduced ? undefined : progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <span style={{ width: `${reduced ? 100 : progress}%` }} />
        </div>
        <ReaderControls compact />
        <button className="story-next" onClick={continueStory}>
          {story.chapterIndex === 5 && story.completed
            ? "Your ending"
            : reduced || progress >= 98
              ? story.chapterIndex === 3 && !story.ending
                ? "Make your choice"
                : story.chapterIndex === 5
                  ? "Finish"
                  : "Next chapter"
              : "Continue"}
          <ArrowRight size={16} />
        </button>
      </div>
      <Dialog
        open={menu}
        onClose={() => setMenu(false)}
        title="Find your place"
      >
        <h2>
          The way
          <br />
          <em>through the night.</em>
        </h2>
        <div className="chapter-menu-list">
          {chapters.map((c, i) => (
            <button
              key={c.slug}
              disabled={i > story.furthestChapter}
              onClick={() => goTo(i)}
              aria-current={i === story.chapterIndex ? "step" : undefined}
            >
              <span>0{i + 1}</span>
              {c.label}
              {i === story.chapterIndex ? (
                <Compass size={15} />
              ) : i <= story.furthestChapter ? (
                <ArrowUpRight size={15} />
              ) : (
                <span className="muted">Locked</span>
              )}
            </button>
          ))}
        </div>
        <Link
          href="/chapters"
          className="text-link"
          onClick={() => setMenu(false)}
        >
          <ArrowLeft size={14} />
          Leave the story · Your place is saved
        </Link>
      </Dialog>
      <Dialog
        open={choice}
        onClose={() => setChoice(false)}
        wide
        title="The choice is yours"
      >
        <div className="choice-heading">
          <p className="eyebrow">23:47 · NORTH POINT</p>
          <h2>
            What kind of light
            <br />
            <em>will you be?</em>
          </h2>
          <p>
            You can keep the lamp alive, or carry its fuel to the rescue launch.
            <br />
            Either way, someone is counting on you.
          </p>
        </div>
        <div className="choice-options">
          <button
            className="choice-option choice-beacon"
            onClick={() => selectEnding("beacon")}
          >
            <Sun size={30} strokeWidth={1} />
            <span className="eyebrow">KEEP THE PROMISE</span>
            <strong>Keep the light burning</strong>
            <span>
              Guide the boat through the reef. Trust the light that brought you
              home.
            </span>
            <ArrowRight size={20} />
          </button>
          <button
            className="choice-option choice-rescue"
            onClick={() => selectEnding("rescue")}
          >
            <Radio size={30} strokeWidth={1} />
            <span className="eyebrow">FIND ANOTHER WAY</span>
            <strong>Take the rescue launch</strong>
            <span>
              Let the tower go dark. Take its light to the people who need it.
            </span>
            <ArrowRight size={20} />
          </button>
        </div>
        <p className="fineprint choice-note">
          There is no wrong way to care. Choose with Enter or Space.
        </p>
      </Dialog>
    </main>
  );
}
function AudioCaption() {
  return (
    <span className="caption-icon" aria-label="Atmosphere">
      ♪
    </span>
  );
}
