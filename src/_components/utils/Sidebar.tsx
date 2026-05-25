"use client";

import { Settings, User, X } from "lucide-react";
import { JSX } from "react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "./navItems";
import SidebarButton from "./SidebarButton";
import { useSidebarStore } from "../../../store/sidebar.store";

export default function Sidebar(): JSX.Element {
  const pathname = usePathname();

  const { isSidebarOpen, toggleSidebar, setActiveTab } =
    useSidebarStore();

  const isActive = (path: string) => pathname === path;

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleSidebar}
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`
          fixed
          top-0
          left-0
          z-50
          flex
          h-screen
          w-75
          flex-col
          border-r
          border-neutral-200
          bg-white
          shadow-lg
          transition-transform
          duration-300

          ${
            isSidebarOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }

          md:translate-x-0
        `}
      >
        {/* Mobile Header */}
        <div className="flex items-center justify-between px-5 py-4 md:hidden">
          <span className="text-2xl font-bold text-amber-950">
            VedaAI
          </span>

          <button onClick={toggleSidebar}>
            <X size={20} />
          </button>
        </div>

        {/* Desktop Logo */}
        <div className="hidden px-5 py-5 md:block">
          <span className="text-2xl font-bold text-amber-950">
            VedaAI
          </span>
        </div>

        {/* CTA */}
        <div className="px-3 pb-4">
          <SidebarButton text="Create Assignment" />
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 px-3">
          {navItems.map((link, index) => (
            <Link
              key={index}
              href={link.href}
              onClick={() => {
                setActiveTab(link.name);

                // close only on mobile
                if (window.innerWidth < 768) {
                  toggleSidebar();
                }
              }}
              className={`
                flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-colors
                ${
                  isActive(link.href)
                    ? "bg-neutral-200 text-black"
                    : "text-neutral-700 hover:bg-neutral-100"
                }
              `}
            >
              <span className="text-neutral-500">
                {link.icon}
              </span>

              <span>{link.name}</span>
            </Link>
          ))}
        </nav>

        {/* Bottom */}
        <div className="mt-auto">
          <div className="px-3 pb-2">
            <Link
              href="/settings"
              className={`
                flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-colors
                ${
                  isActive("/settings")
                    ? "bg-neutral-200"
                    : "hover:bg-neutral-100"
                }
              `}
            >
              <Settings size={20} />
              <span>Settings</span>
            </Link>
          </div>

          <div className="border-t border-neutral-200 px-4 py-4">
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <User size={14} />

              <span className="truncate">
                Delhi Public School
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}