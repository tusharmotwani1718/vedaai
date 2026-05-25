"use client";

import { Menu } from "lucide-react";
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
  const { toggleSidebar } = useSidebarStore();

  return (
    <>
      {/* Sidebar */}
      <Sidebar />

      {/* Mobile Navbar */}
      <div className="fixed top-0 left-0 right-0 z-40 flex h-16 items-center justify-between border-b border-neutral-200 bg-white px-4 md:hidden">
        <span className="text-lg font-semibold text-slate-900">
          VedaAI
        </span>

        <button
          onClick={toggleSidebar}
          className="rounded-lg border border-neutral-200 p-2"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Desktop Topbar */}
      <div className="hidden md:block md:ml-75">
        <Topbar />
      </div>

      {/* Main Content */}
      <main
        className="
          min-h-screen
          pt-20
          px-4
          pb-6
          transition-all
          duration-300
          md:ml-75
          md:px-8
        "
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

      <LayoutContent>{children}</LayoutContent>
    </>
  );
}