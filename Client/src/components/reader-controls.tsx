"use client";
import { useState } from "react";
import {
  AudioLines,
  VolumeX,
  SlidersHorizontal,
  Check,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import {
  setCaptions,
  setReducedMotion,
  setSound,
} from "@/features/story/storySlice";
import { startAmbient, stopAmbient } from "@/lib/ambient";
import Dialog from "./dialog";
import { useSystemReducedMotion } from "@/lib/reader-environment";
export default function ReaderControls({
  compact = false,
}: {
  compact?: boolean;
}) {
  const story = useAppSelector((s) => s.story);
  const dispatch = useAppDispatch();
  const systemReducedMotion = useSystemReducedMotion();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  async function toggleSound() {
    if (story.soundEnabled) {
      stopAmbient();
      dispatch(setSound(false));
      return;
    }
    try {
      await startAmbient();
      dispatch(setSound(true));
      setError("");
    } catch {
      setError("Sound couldn't start. Try again in a supported browser.");
    }
  }
  return (
    <>
      <div className={`reader-controls ${compact ? "compact" : ""}`}>
        <button
          className="control-button"
          onClick={toggleSound}
          aria-pressed={story.soundEnabled}
          aria-label={
            story.soundEnabled
              ? "Sound on. Turn sound off"
              : "Sound off. Turn sound on"
          }
        >
          {story.soundEnabled ? (
            <AudioLines size={16} />
          ) : (
            <VolumeX size={16} />
          )}
          <span>Sound {story.soundEnabled ? "on" : "off"}</span>
        </button>
        <span className="control-divider" />
        <button
          className="control-button"
          onClick={() => setOpen(true)}
          aria-label="Reading preferences"
        >
          <SlidersHorizontal size={15} />
          <span>Preferences</span>
        </button>
      </div>
      {error && (
        <span role="status" className="small-error">
          {error}
        </span>
      )}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Make yourself comfortable"
      >
        <h2>
          Your way
          <br />
          <em>into the story.</em>
        </h2>
        <p className="muted">
          A few small adjustments for a better experience.
        </p>
        <label className="preference-row">
          <span>
            <strong>Reduced motion</strong>
            <small>
              {systemReducedMotion
                ? "Enabled by your device's motion preference."
                : "A calm, page-by-page story. No 3D or scrolling effects."}
            </small>
          </span>
          <input
            type="checkbox"
            checked={story.reducedMotion || systemReducedMotion}
            disabled={systemReducedMotion}
            onChange={(e) => dispatch(setReducedMotion(e.target.checked))}
          />
          <span className="toggle" aria-hidden="true">
            <Check size={12} />
          </span>
        </label>
        <label className="preference-row">
          <span>
            <strong>Atmosphere captions</strong>
            <small>Read the sounds and atmosphere of each scene.</small>
          </span>
          <input
            type="checkbox"
            checked={story.captions}
            onChange={(e) => dispatch(setCaptions(e.target.checked))}
          />
          <span className="toggle" aria-hidden="true">
            <Check size={12} />
          </span>
        </label>
        <p className="fineprint">
          Narrative text is always available. Sound starts only when you turn it
          on.
        </p>
        <Link
          className="text-link"
          href="/account"
          onClick={() => setOpen(false)}
        >
          Save your place across devices <ArrowUpRight size={16} />
        </Link>
        <button
          className="button button-gold full-width"
          onClick={() => setOpen(false)}
        >
          Ready when you are
        </button>
      </Dialog>
    </>
  );
}
