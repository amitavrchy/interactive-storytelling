export default function Brand({ small = false }: { small?: boolean }) {
  return <span className={`brand ${small ? "brand-small" : ""}`}><svg width="28" height="38" viewBox="0 0 28 38" fill="none" aria-hidden="true"><path d="M9 14h10l3 21H6l3-21ZM8 14h12M8 8h12v6H8V8ZM14 2l7 6H7l7-6ZM14 19v4M4 35h20M2 10l-2-1M26 10l2-1" stroke="currentColor" strokeWidth="1.3"/><path d="M11 11h6" stroke="currentColor" strokeWidth="2"/></svg><span>THE LAST<br />LIGHTHOUSE<span className="brand-dot">.</span></span></span>;
}
