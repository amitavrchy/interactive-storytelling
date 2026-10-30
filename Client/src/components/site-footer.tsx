"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Brand from "./brand";
export default function SiteFooter() {
  const path = usePathname();
  if (path === "/story") return null;
  return (
    <footer className="site-footer">
      <Link href="/" aria-label="The Last Lighthouse. Home">
        <Brand small />
      </Link>
      <p>
        An independent story.
        <br />
        <span className="muted">Made for a moment of wonder.</span>
      </p>
      <nav aria-label="Footer navigation">
        <Link href="/about">About the project</Link>
        <Link href="/account">Your account</Link>
        <Link href="/admin">Studio</Link>
      </nav>
      <span className="footer-coordinate">
        58° 36′ N &nbsp; 03° 32′ W<br />
        FICTIONAL COORDINATES
      </span>
    </footer>
  );
}
