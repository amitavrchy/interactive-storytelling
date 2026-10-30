import content from "../content/story.json";

export type Chapter = (typeof content.chapters)[number];
export type LoreEntry = (typeof content.lore)[number];
export type Ending = keyof typeof content.endings;
export const chapters = content.chapters;
export const lore = content.lore;
export const endings = content.endings;
export const CHOICE_ID = "the-last-light";
export function chapterIndex(slug: string) {
  return chapters.findIndex((chapter) => chapter.slug === slug);
}
