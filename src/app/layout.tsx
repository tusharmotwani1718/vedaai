import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Sidebar from "@/_components/utils/Sidebar";
import Topbar from "@/_components/utils/Topbar";
import { Toaster } from 'sonner';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Veda AI",
  description: "Generate Assignments AI Powered by Veda AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-screen bg-neutral-50">

        {/* Fixed Sidebar */}
        <Sidebar />

        {/* Fixed Topbar */}
        <Topbar />

        {/* Scrollable Content Area */}
        <main className="ml-82 pt-18 h-screen overflow-y-auto px-8 py-4">
          {children}
        </main>
        <Toaster richColors />
      </body>
    </html>
  );
}