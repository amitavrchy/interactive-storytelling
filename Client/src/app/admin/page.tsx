import type { Metadata } from "next";
import AdminStudio from "@/components/admin-studio";
export const metadata: Metadata = { title: "North Point Studio", robots: { index: false, follow: false } };
export default function Page() { return <AdminStudio />; }
