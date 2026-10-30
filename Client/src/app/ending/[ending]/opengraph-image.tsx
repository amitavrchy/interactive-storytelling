import { ImageResponse } from "next/og";
import { endings } from "@/lib/story-content";
export const alt = "The Last Lighthouse — your ending";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default async function Image({ params }: { params: Promise<{ ending: string }> }) {
  const { ending } = await params; const item = ending === "rescue" ? endings.rescue : endings.beacon;
  return new ImageResponse(<div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#0c1825", color: "#e7eef6", padding: "70px 80px", border: "1px solid #f2c14e", justifyContent: "space-between" }}><div style={{ display: "flex", fontSize: 20, letterSpacing: 5, color: "#f2c14e" }}>THE LAST LIGHTHOUSE</div><div style={{ display: "flex", flexDirection: "column", gap: 24 }}><div style={{ fontSize: 16, color: "#9aabb7", display: "flex", letterSpacing: 4 }}>{item.eyebrow.toUpperCase()}</div><div style={{ fontSize: 88, fontFamily: "serif", display: "flex" }}>{item.title}.</div><div style={{ fontSize: 24, color: "#b7c4cd", display: "flex" }}>{item.description}</div></div><div style={{ display: "flex", fontSize: 16, color: "#f2c14e", letterSpacing: 2 }}>SOME LIGHTS ARE WORTH KEEPING.</div></div>,size);
}
