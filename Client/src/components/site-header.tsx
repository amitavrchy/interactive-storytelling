"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { useState } from "react";
import Brand from "./brand";
import { useAppSelector } from "@/lib/store";
const links = [
  { href: "/", label: "The experience" },
  { href: "/chapters", label: "Chapters" },
  { href: "/archive", label: "The archive" },
  { href: "/about", label: "Behind the light" },
];
export default function SiteHeader() {
  const pathname = usePathname();
  const [menu, setMenu] = useState(false);
  const story = useAppSelector((s) => s.story);
  return (
    <header
      className={`site-header ${pathname === "/story" ? "header-story" : ""}`}
    >
      <Link
        href="/"
        aria-label="The Last Lighthouse home"
        onClick={() => setMenu(false)}
      >
        <Brand />
      </Link>
      <nav className="desktop-nav" aria-label="Main navigation">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={pathname === link.href ? "active" : ""}
            aria-current={pathname === link.href ? "page" : undefined}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <Link href="/story" className="header-cta">
        {story.flags.length ? "Continue story" : "Enter the story"}
        <ArrowUpRight size={16} />
      </Link>
      <button
        className="mobile-menu-button icon-button"
        aria-label={menu ? "Close navigation" : "Open navigation"}
        aria-expanded={menu}
        aria-controls="mobile-navigation"
        onClick={() => setMenu(!menu)}
      >
        {menu ? <X /> : <Menu />}
      </button>
      {menu && (
        <nav
          id="mobile-navigation"
          className="mobile-nav"
          aria-label="Mobile navigation"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenu(false)}
              aria-current={pathname === link.href ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
          <Link href="/account" onClick={() => setMenu(false)}>
            Your account
          </Link>
        </nav>
      )}
    </header>
  );
}
