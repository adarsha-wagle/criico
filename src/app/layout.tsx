import type { Metadata } from "next";
import { Barlow_Semi_Condensed, Public_Sans } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

/* Public Sans for interface text and tables (tabular figures). */
const publicSans = Public_Sans({
  subsets: ["latin"],
  variable: "--font-public-sans",
  display: "swap",
});

/* Barlow Semi Condensed for page titles, stats and scores: scoreboard lettering. */
const barlow = Barlow_Semi_Condensed({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-barlow-condensed",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Criico", template: "%s · Criico" },
  description:
    "Player records, match results and an Impact Score leaderboard for local cricket clubs.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${publicSans.variable} ${barlow.variable}`}>
      <body className="min-h-dvh font-sans">
        {children}
        <Toaster
          theme="light"
          position="top-center"
          toastOptions={{
            classNames: {
              toast:
                "!rounded-lg !border !border-border !font-sans !text-sm !shadow-md",
            },
          }}
        />
      </body>
    </html>
  );
}
