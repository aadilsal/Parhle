import React from "react";
import AppShell from "@/components/dashboard/app-shell";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://parhle.ai"),
  title: "Parhle AI-PDF Note Taker",
  description:
    "Parhle is an AI-powered PDF note taker with real-time sync, markdown support, and intelligent organization. Capture, organize, and access notes extracted from PDFs.",
  keywords: [
    "AI note-taking",
    "real-time sync",
    "markdown notes",
    "productivity",
  "Parhle",
    "Supabase",
    "Next.js",
    "typescript",
    "note app",
  ],
  authors: [{ name: "Hasnain" }],
  creator: "Hasnain",
  openGraph: {
    title: "Parhle AI-PDF Note Taker",
    description:
      "An AI-powered PDF note taker with real-time sync and markdown support.",
    url: "https://parhle.ai",
    siteName: "Parhle",
    images: [
      {
  url: "/opengraph-image.png",
  width: 1200,
  height: 630,
  alt: "Parhle App Screenshot",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Parhle AI-PDF Note Taker",
    description:
      "An AI-powered PDF note taker with real-time sync and markdown support.",
    images: ["/opengraph-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
            {/* AppShell is a client-side app-wide shell that provides TopBar, Sidebar and Footer
              and will render the page content inside its main area. It also listens for
              Supabase auth state and shows consistent UI for signed-in users. */}
            <AppShell>{children}</AppShell>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
