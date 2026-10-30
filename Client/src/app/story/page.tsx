import { Suspense } from "react";
import type { Metadata } from "next";
import StoryReader from "@/components/story/story-reader";
export const metadata: Metadata = {
  title: "The Story",
  description: "Your journey from dusk to dawn begins at North Point.",
};
export default function Page() {
  return (
    <Suspense
      fallback={
        <main id="main" className="story-loading">
          <p className="eyebrow">FINDING THE SHORE…</p>
        </main>
      }
    >
      <StoryReader />
    </Suspense>
  );
}
