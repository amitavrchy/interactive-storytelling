import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
export const metadata: Metadata = { title: "Behind the Light" };
export default function Page() {
  return (
    <main id="main">
      <div className="page-heading section-wrap">
        <p className="eyebrow">BEHIND THE LIGHT</p>
        <h1>
          A small story.
          <br />
          <em>An open sea.</em>
        </h1>
        <p>
          An independent experiment in stories you feel, places you inhabit, and
          choices that stay with you.
        </p>
      </div>
      <div className="about-image">
        <Image
          src="/images/north-point.webp"
          alt="North Point lighthouse above a rugged Atlantic sea"
          fill
          sizes="100vw"
        />
      </div>
      <article className="about-editorial section-wrap">
        <aside>
          <p className="eyebrow">FIELD NOTES / 001</p>
          <p className="muted">
            The making of
            <br />
            The Last Lighthouse
          </p>
        </aside>
        <div>
          <h2>
            What if a website
            <br />
            could feel like <em>a memory?</em>
          </h2>
          <p>
            The Last Lighthouse begins with a simple idea: the most important
            things we inherit aren&apos;t things. They&apos;re the rituals,
            silences, and small acts of care that tell us where we belong.
          </p>
          <p>
            Set on a fictional Atlantic coast in 1987, the story follows a
            homecoming across a single storm-filled night. You choose how
            quickly the world unfolds, and what it means to keep a light alive.
          </p>
          <blockquote>
            “A short film you steer
            <br />
            <em>with your scroll.”</em>
          </blockquote>
          <h3>Built to let you be here.</h3>
          <p>
            The atmosphere responds to your movement: sea mist, a turning beam,
            the restlessness of a storm. Every scene is paired with readable
            text. Sound is optional. Reduced motion replaces the cinematic
            sequence with a calm reading experience.
          </p>
          <h3>A place for everyone.</h3>
          <p>
            Use a mouse, touch, or keyboard. In the story, Escape opens the
            chapter menu. Tab moves between controls; Enter or Space makes a
            choice. Your place saves on this device. An optional account carries
            it across devices.
          </p>
          <h3>Credits &amp; craft</h3>
          <p>
            An original interactive narrative. Artwork created with generative
            tools and composed for this experience. Ocean ambience synthesised
            in your browser. Set in Instrument Serif and Inter, by the Open
            Source Type community. The setting, characters and events are
            fictional.
          </p>
          <div className="about-colophon">
            <span>
              Story &amp; creative direction
              <br />
              <strong>The Last Lighthouse project</strong>
            </span>
            <span>
              Format
              <br />
              <strong>Six chapters · Two endings</strong>
            </span>
          </div>
          <Link href="/story" className="button button-gold">
            Step into the story
            <ArrowUpRight size={17} />
          </Link>
        </div>
      </article>
    </main>
  );
}
