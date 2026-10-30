"use client";
import { useState } from "react";
import { Share2, Check, Copy } from "lucide-react";
export default function ShareEnding({ ending, title }: { ending: string; title: string }) {
  const [copied, setCopied] = useState(false); const [fallback, setFallback] = useState("");
  async function copy() { const url = `${location.origin}/ending/${ending}`; try { await navigator.clipboard.writeText(url); setCopied(true); } catch { setFallback(url); } }
  async function share() { if (navigator.share) try { await navigator.share({ title: `${title} · The Last Lighthouse`, text: "Some lights are worth keeping. Discover your ending.", url: `${location.origin}/ending/${ending}` }); } catch (err) { if ((err as Error).name !== "AbortError") await copy(); } else await copy(); }
  return <div className="share-controls"><button className="button button-gold" onClick={share}>Share this ending<Share2 size={16} /></button><button className="icon-button" aria-label="Copy ending link" onClick={copy}>{copied ? <Check size={17} /> : <Copy size={17} />}</button>{copied && <p className="fineprint" role="status">Link copied. Let the light travel.</p>}{fallback && <label className="fineprint">Copy this link<input readOnly value={fallback} onFocus={e => e.target.select()} aria-label="Ending link" /></label>}</div>;
}
