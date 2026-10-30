import type { Metadata } from "next";
import { Work_Sans } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const workSans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-work-sans",
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
    <html lang="en" className={workSans.variable}>
      <body className="min-h-dvh font-sans">
        {children}
        {/* Flat toasts: square, 1px border, no shadow. Light theme to match the app. */}
        <Toaster
          theme="light"
          position="top-center"
          toastOptions={{
            classNames: {
              toast:
                "!rounded-none !border !border-border !shadow-none !font-sans",
            },
          }}
        />
      </body>
    </html>
  );
}
