import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BookOpen } from "lucide-react";
import { endings, type Ending } from "@/lib/story-content";
import ShareEnding from "@/components/share-ending";
export function generateStaticParams() {
  return [{ ending: "beacon" }, { ending: "rescue" }];
}
function isEnding(value: string): value is Ending {
  return value === "beacon" || value === "rescue";
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ ending: string }>;
}): Promise<Metadata> {
  const { ending } = await params;
  if (!isEnding(ending)) return { title: "Ending not found" };
  const item = endings[ending];
  return {
    title: item.title,
    description: item.description,
    openGraph: {
      title: `${item.title} · The Last Lighthouse`,
      description: item.description,
      images: [`/ending/${ending}/opengraph-image`],
    },
    twitter: {
      card: "summary_large_image",
      title: item.title,
      description: item.description,
      images: [`/ending/${ending}/opengraph-image`],
    },
  };
}
export default async function Page({
  params,
}: {
  params: Promise<{ ending: string }>;
}) {
  const { ending } = await params;
  if (!isEnding(ending)) notFound();
  const item = endings[ending];
  return (
    <main id="main" className={`ending-page ending-${ending}`}>
      <Image
        src={ending === "rescue" ? "/images/rescue.webp" : "/images/dawn.webp"}
        alt="The North Point lighthouse overlooking the sea after a long night"
        fill
        priority
        sizes="100vw"
        className="ending-background"
      />
      <div className="ending-page-content">
        <p className="eyebrow">{item.eyebrow}</p>
        <span className="star-mark">✳</span>
        <h1>
          {item.title}
          <span className="title-period">.</span>
        </h1>
        <p>{item.description}</p>
        <blockquote>
          “Nothing is truly lost while someone remembers the way home.”
        </blockquote>
        <ShareEnding ending={ending} title={item.title} />
        <div className="ending-page-links">
          <Link className="text-link" href="/story">
            Experience the story
            <ArrowRight size={16} />
          </Link>
          <Link className="text-link" href="/archive">
            The archive
            <BookOpen size={16} />
          </Link>
        </div>
        <p className="fineprint">
          One night. Two ways home. A light that stays with you.
        </p>
      </div>
    </main>
  );
}
