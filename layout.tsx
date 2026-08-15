import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "CFB Pick 'Em",
  description: "College football pick 'em league",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header className="bg-maroon text-white">
          <nav className="max-w-4xl mx-auto flex items-center gap-6 px-4 py-3">
            <Link href="/" className="font-bold text-lg">
              🏈 Pick &apos;Em
            </Link>
            <Link href="/picks" className="hover:underline">
              Make Picks
            </Link>
            <Link href="/standings" className="hover:underline">
              Standings
            </Link>
            <Link href="/admin" className="hover:underline ml-auto text-sm opacity-80">
              Admin
            </Link>
          </nav>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
