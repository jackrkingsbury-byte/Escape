import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "Life OS — Level Up Your Real Life",
    template: "%s · Life OS",
  },
  description:
    "AI-generated daily missions, streaks, XP and an always-on coach. Turn self-improvement into a game you actually want to play.",
  openGraph: {
    title: "Life OS — Level Up Your Real Life",
    description:
      "AI-generated daily missions, streaks, XP and an always-on coach. Duolingo for your life.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="min-h-screen font-sans">
        {/* Ambient background: radial glow + faint grid */}
        <div className="pointer-events-none fixed inset-0 -z-10 bg-radial-spot" />
        <div className="pointer-events-none fixed inset-0 -z-10 bg-grid-faint [background-size:48px_48px]" />
        {children}
      </body>
    </html>
  );
}
