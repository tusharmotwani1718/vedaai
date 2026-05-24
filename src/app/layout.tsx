"use client";

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Sidebar from "@/_components/utils/Sidebar";
import Topbar from "@/_components/utils/Topbar";
import { Toaster } from "sonner";
import SocketProvider from "@/lib/providers/socket.provider";
import { useSidebarStore } from "../../store/sidebar.store";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// export const metadata: Metadata = {
//   title: "Veda AI",
//   description: "Generate Assignments AI Powered by Veda AI",
// };

function LayoutContent({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const { isSidebarOpen } = useSidebarStore();

  return (
    <>
      {/* Fixed Sidebar */}
      <Sidebar />

      {/* Fixed Topbar */}
      <Topbar />

      {/* Main Content */}
      <main
        className={`
          pt-18
          h-screen
          overflow-y-auto
          px-4 sm:px-6 md:px-8
          py-4
          transition-all duration-300 ease-in-out
          ${isSidebarOpen ? "ml-82" : "ml-22"}
        `}
      >
        {children}
      </main>

      <Toaster richColors />
    </>
  );
}

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
        <SocketProvider />

        <LayoutContent>
          {children}
        </LayoutContent>

      </body>
    </html>
  );
}