"use client";

import { useSyncExternalStore } from "react";

export const DIALOG_CHANGE_EVENT = "lighthouse:dialog-change";
const motionQuery = "(prefers-reduced-motion: reduce)";

function subscribeMotion(changed: () => void) {
  const media = window.matchMedia(motionQuery);
  media.addEventListener("change", changed);
  return () => media.removeEventListener("change", changed);
}

export function useSystemReducedMotion() {
  return useSyncExternalStore(
    subscribeMotion,
    () => window.matchMedia(motionQuery).matches,
    () => false,
  );
}

function subscribePaused(changed: () => void) {
  window.addEventListener(DIALOG_CHANGE_EVENT, changed);
  document.addEventListener("visibilitychange", changed);
  return () => {
    window.removeEventListener(DIALOG_CHANGE_EVENT, changed);
    document.removeEventListener("visibilitychange", changed);
  };
}

export function readerIsPaused() {
  return document.hidden || document.querySelector("dialog[open]") !== null;
}

export function useReaderPaused() {
  return useSyncExternalStore(subscribePaused, readerIsPaused, () => false);
}
