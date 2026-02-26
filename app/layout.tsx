import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "7.css/dist/7.css";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "akryst's crib",
  description: "welcome 2 my digital playground",
  keywords: ["akryst", "retro", "y2k", "personal website", "music"],
  authors: [{ name: "akryst" }],
  openGraph: {
    title: "akryst's crib",
    description: "welcome 2 my digital playground",
    type: "website",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "akryst's crib",
    description: "welcome 2 my digital playground",
    images: ["/og-image.png"],
    creator: "@Akryst_",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
