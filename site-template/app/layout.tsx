import type { Metadata } from "next";
import "./globals.css";
import { loadSiteConfig } from "@/lib/content";

const { meta } = loadSiteConfig();

export const metadata: Metadata = {
  title: meta.name || "Rascal Site",
  description: undefined,
  metadataBase: meta.url ? new URL(meta.url) : undefined,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fi">
      <body className="antialiased">{children}</body>
    </html>
  );
}
