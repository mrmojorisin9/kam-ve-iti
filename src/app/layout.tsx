import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import { SponsorWidget } from "@/components/SponsorWidget";
import { PageViewTracker } from "@/components/PageViewTracker";
import { Footer } from "@/components/Footer";
import { getGeneralSponsor } from "@/lib/sponsor";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: "Kam denes",
  description: "Sva javna događanja u Međimurskoj županiji na jednom mjestu.",
  openGraph: {
    siteName: "Kam denes",
    locale: "hr_HR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
  verification: {
    google: "W3PfItF_j2JIN3c-EqU1bLVoOkYkcqmzAfTUfSvGRdo",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const sponsor = await getGeneralSponsor();
  const sponsorReady =
    sponsor?.isActive && sponsor.sponsorName && sponsor.logoUrl && sponsor.linkUrl
      ? {
          sponsorName: sponsor.sponsorName,
          logoUrl: sponsor.logoUrl,
          promoText: sponsor.promoText,
          linkUrl: sponsor.linkUrl,
          displayFrequency: sponsor.displayFrequency,
        }
      : null;

  return (
    <html
      lang="hr"
      className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="bg-night text-parchment flex min-h-full flex-col">
        {children}
        <Footer />
        <PageViewTracker />
        {sponsorReady && <SponsorWidget sponsor={sponsorReady} />}
      </body>
    </html>
  );
}
