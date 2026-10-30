import Link from "next/link";
export default function NotFound() {
  return (
    <main id="main" className="section-wrap lost-page">
      <p className="eyebrow">BEYOND THE CHART</p>
      <h1>
        A little
        <br />
        <em>off course.</em>
      </h1>
      <p className="muted">
        This part of the coast isn&apos;t on our map. The light is still there.
      </p>
      <Link className="button button-gold" href="/">
        Find your way home →
      </Link>
    </main>
  );
}
