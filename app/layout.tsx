import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cue & Ledger — Snooker Parlor Manager",
  description: "Table sessions, billing, and daily history for the parlor.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
