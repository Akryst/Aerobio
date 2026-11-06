import type { Metadata } from "next";
import "7.css/dist/7.css";
import "./globals.css";

const siteUrl = process.env.SITE_URL;

export const metadata: Metadata = {
  metadataBase: siteUrl ? new URL(siteUrl) : undefined,
  title: "akryst's crib",
  description: "welcome 2 my digital playground",
  keywords: ["akryst", "retro", "y2k", "personal website", "music"],
  authors: [{ name: "akryst" }],
  openGraph: {
    title: "akryst's crib",
    description: "welcome 2 my digital playground",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "akryst's crib",
    description: "welcome 2 my digital playground",
    images: ["/opengraph-image.png"],
    creator: "@Akryst_",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
