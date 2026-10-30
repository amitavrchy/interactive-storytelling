"use client";

import { useEffect, useRef, useState } from "react";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "framer-motion";
import AuthProvider from "./auth-provider";
import { makeStore, type AppStore, useAppSelector } from "@/lib/store";
import { hydrate, initialProgress, progressSchema, storageUnavailable } from "@/features/story/storySlice";

function Preferences({ children }: { children: React.ReactNode }) {
  const reduced = useAppSelector(s => s.story.reducedMotion);
  return <MotionConfig reducedMotion={reduced ? "always" : "user"}>{children}</MotionConfig>;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<AppStore | null>(null);
  if (!storeRef.current) storeRef.current = makeStore();
  const store = storeRef.current;
  const [queryClient] = useState(() => new QueryClient());
  useEffect(() => {
    try {
      const raw = localStorage.getItem("lighthouse-progress-v1");
      const parsed = raw ? progressSchema.safeParse(JSON.parse(raw)) : null;
      store.dispatch(hydrate(parsed?.success ? parsed.data : { ...initialProgress, reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches }));
    } catch { store.dispatch(hydrate(initialProgress)); store.dispatch(storageUnavailable()); }
    return store.subscribe(() => {
      const { hydrated, ...saved } = store.getState().story;
      if (!hydrated) return;
      try { localStorage.setItem("lighthouse-progress-v1", JSON.stringify(saved)); }
      catch { if (store.getState().story.storageAvailable) store.dispatch(storageUnavailable()); }
    });
  }, [store]);
  return <Provider store={store}><QueryClientProvider client={queryClient}><AuthProvider><Preferences>{children}</Preferences></AuthProvider></QueryClientProvider></Provider>;
}
