import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { PokeballIcon } from "@/components/icons";
import { Search } from "@/components/Search";
import "./globals.css";

export const metadata: Metadata = {
  title: "Better Dex",
  description: "Ein Pokédex zum Entdecken: Typen, Stärken, Schwächen und Entwicklungen aller Pokémon.",
};

export const viewport: Viewport = {
  themeColor: "#fdeee4",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body>
        <header className="topbar">
          <Link href="/" className="logo">
            <PokeballIcon />
            Better Dex
          </Link>
          <Search />
        </header>
        {children}
      </body>
    </html>
  );
}
