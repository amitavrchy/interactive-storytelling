import type { Metadata } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import Providers from "@/components/providers";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import "./globals.css";
import "./story.css";
import "lenis/dist/lenis.css";
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});
const serif = Instrument_Serif({
  variable: "--font-instrument",
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
});
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ),
  title: {
    default: "The Last Lighthouse — An Interactive Story",
    template: "%s · The Last Lighthouse",
  },
  description:
    "Some lights are worth keeping. An atmospheric, scroll-driven story about memory, belonging, and finding your way home. Six chapters. One choice. Your ending.",
  openGraph: {
    title: "The Last Lighthouse",
    description: "A short film you steer with your scroll.",
    images: [{ url: "/images/north-point.webp", width: 1881, height: 836 }],
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${serif.variable}`}>
      <body>
        <Providers>
          <a className="skip-link" href="#main">
            Skip to content
          </a>
          <SiteHeader />
          {children}
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
