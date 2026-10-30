import type { Metadata } from "next";
import Archive from "@/components/archive";
export const metadata: Metadata = { title: "The Archive" };
export default function Page() { return <Archive />; }
