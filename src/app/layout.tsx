import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Sidebar } from "@/components/layout/sidebar";
import { DataSeeder } from "@/components/data-seeder";
import { Toaster } from "@/components/ui/toaster";
import { FontSizeManager } from "@/components/font-size-manager";
import { TutorialOverlay } from "@/components/tutorial-overlay";
import { TimerProvider } from "@/components/providers/timer-provider";
import { MessageBanner } from "@/components/message-banner";

export const metadata: Metadata = {
  title: "Athena",
  description: "A premium study management dashboard for tracking subjects, revisions, daily planning, and analytics. Wisdom in every session.",
  keywords: ["athena", "study tracker", "study planner", "revision tracker", "productivity", "student"],
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.svg",
    apple: "/pwa-icon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Athena",
    startupImage: [
      "/pwa-icon.svg"
    ]
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen gradient-bg">
        <Providers>
          <MessageBanner />
          <FontSizeManager />
          <DataSeeder />
          <TutorialOverlay />
          <TimerProvider />
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 min-w-0 min-h-screen lg:py-0 py-14">
              <div className="max-w-[1400px] mx-auto px-3 py-4 sm:px-4 sm:py-5 lg:px-8 lg:py-8">
                {children}
              </div>
            </main>
          </div>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
