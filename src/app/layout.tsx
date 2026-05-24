import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Sidebar } from "@/components/layout/sidebar";
import { DataSeeder } from "@/components/data-seeder";
import { Toaster } from "@/components/ui/toaster";
import { FontSizeManager } from "@/components/font-size-manager";
import { TutorialOverlay } from "@/components/tutorial-overlay";

export const metadata: Metadata = {
  title: "Athena",
  description: "A premium study management dashboard for tracking subjects, revisions, daily planning, and analytics. Wisdom in every session.",
  keywords: ["athena", "study tracker", "study planner", "revision tracker", "productivity", "student"],
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
          <FontSizeManager />
          <DataSeeder />
          <TutorialOverlay />
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 min-h-screen lg:py-0 py-16">
              <div className="max-w-[1400px] mx-auto p-4 lg:p-8">
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
