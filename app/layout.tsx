import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "CFB Pick'em",
  description: "College football pick'em pool - weekly ATS picks, playoff pool, and Heisman pool.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-50 text-neutral-900">
        <header className="bg-lsuPurple text-white">
          <nav className="mx-auto flex max-w-4xl flex-wrap items-center gap-4 px-4 py-3">
            <Link href="/" className="text-lg font-bold hover:text-lsuGold">
              CFB Pick&apos;em
            </Link>
            <div className="flex flex-wrap gap-4 text-sm">
              <Link href="/" className="hover:text-lsuGold">
                Home
              </Link>
              <Link href="/picks" className="hover:text-lsuGold">
                Make Picks
              </Link>
              <Link href="/picks/preseason" className="hover:text-lsuGold">
                Preseason Picks
              </Link>
              <Link href="/standings" className="hover:text-lsuGold">
                Standings
              </Link>
              <Link href="/admin" className="hover:text-lsuGold">
                Admin
              </Link>
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
