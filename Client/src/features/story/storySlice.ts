import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { z } from "zod";
import { chapters, type Ending } from "@/lib/story-content";

export const progressSchema = z.object({
  chapterIndex: z.number().int().min(0).max(5),
  furthestChapter: z.number().int().min(0).max(5),
  flags: z.array(z.string().max(40)).max(20),
  ending: z.enum(["beacon", "rescue"]).nullable(),
  completed: z.boolean(),
  reducedMotion: z.boolean(),
  captions: z.boolean(),
});
export type SavedProgress = z.infer<typeof progressSchema>;
export type StoryState = SavedProgress & {
  hydrated: boolean;
  soundEnabled: boolean;
  storageAvailable: boolean;
};
export const initialProgress: SavedProgress = {
  chapterIndex: 0,
  furthestChapter: 0,
  flags: [],
  ending: null,
  completed: false,
  reducedMotion: false,
  captions: true,
};
const initialState: StoryState = {
  ...initialProgress,
  hydrated: false,
  soundEnabled: false,
  storageAvailable: true,
};

export function normalizeProgress(saved: SavedProgress): SavedProgress {
  const ceiling = saved.ending ? 5 : 3;
  const furthestChapter = Math.min(saved.furthestChapter, ceiling);
  const chapterIndex = Math.min(saved.chapterIndex, furthestChapter);
  const allowed = chapters
    .slice(0, furthestChapter + 1)
    .map((c) => c.unlockFlag);
  return {
    ...saved,
    chapterIndex,
    furthestChapter,
    completed: !!saved.ending && saved.completed,
    flags: saved.flags.filter(
      (flag) =>
        allowed.includes(flag) &&
        (flag !== "complete" || (!!saved.ending && saved.completed)),
    ),
  };
}

const slice = createSlice({
  name: "story",
  initialState,
  reducers: {
    hydrate(state, action: PayloadAction<SavedProgress>) {
      Object.assign(state, normalizeProgress(action.payload), {
        hydrated: true,
      });
    },
    visitChapter(state, action: PayloadAction<number>) {
      const index = Math.max(0, Math.min(action.payload, state.ending ? 5 : 3));
      state.chapterIndex = index;
      state.furthestChapter = Math.max(state.furthestChapter, index);
      // Completion is awarded by reaching the final chapter's closing card.
      const flag = chapters[index].unlockFlag;
      if (flag !== "complete" && !state.flags.includes(flag))
        state.flags.push(flag);
    },
    chooseEnding(state, action: PayloadAction<Ending>) {
      state.ending = action.payload;
    },
    completeStory(state) {
      if (state.ending) {
        state.completed = true;
        if (!state.flags.includes("complete")) state.flags.push("complete");
      }
    },
    setReducedMotion(state, action: PayloadAction<boolean>) {
      state.reducedMotion = action.payload;
    },
    setCaptions(state, action: PayloadAction<boolean>) {
      state.captions = action.payload;
    },
    setSound(state, action: PayloadAction<boolean>) {
      state.soundEnabled = action.payload;
    },
    storageUnavailable(state) {
      state.storageAvailable = false;
    },
    restart(state) {
      Object.assign(state, initialProgress, {
        reducedMotion: state.reducedMotion,
        captions: state.captions,
      });
    },
  },
});
export const {
  hydrate,
  visitChapter,
  chooseEnding,
  completeStory,
  setReducedMotion,
  setCaptions,
  setSound,
  restart,
  storageUnavailable,
} = slice.actions;
export default slice.reducer;
