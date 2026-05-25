"use client";

import Sidebar from "@/_components/utils/Sidebar";
import Topbar from "@/_components/utils/Topbar";
import { Toaster } from "sonner";
import SocketProvider from "@/lib/providers/socket.provider";
import { useSidebarStore } from "../../../store/sidebar.store";
import "../globals.css";





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

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <>
      <SocketProvider />

      <LayoutContent>
        {children}
      </LayoutContent>
    </>
  );
}