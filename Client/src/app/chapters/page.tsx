import type { Metadata } from "next";
import ChapterLibrary from "@/components/chapter-library";
export const metadata: Metadata = { title: "Chapters" };
export default function Page() { return <ChapterLibrary />; }
