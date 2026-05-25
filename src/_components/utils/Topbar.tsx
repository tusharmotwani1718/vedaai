"use client";

import { ArrowLeft, Bell, User } from "lucide-react";
import { JSX } from "react";
import { useRouter, usePathname } from "next/navigation";
import { navItems } from "./navItems";
import { useNotificationsStore } from "../../../store/notifications.store";
import Link from "next/link";

export default function Topbar(): JSX.Element {
  const router = useRouter();
  const pathname = usePathname();

  const { IsAnyNewNotification } = useNotificationsStore();

  // derive active item directly from pathname
  const activeItem =
    navItems.find((item) => item.href === pathname) ??
    navItems[0];

  return (
    <>
      {/* Topbar */}
      <header
        className="
          fixed
          top-0
          right-0
          left-0
          z-30

          hidden
          h-16

          items-center
          justify-between

          border-b
          border-neutral-200
          bg-white/90
          px-6
          backdrop-blur-md

          md:flex
          md:left-75
        "
      >
        {/* Left */}
        <div className="flex items-center gap-3">
          {/* Back */}
          <button
            onClick={() => router.back()}
            title="Go back"
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-lg
              text-neutral-500
              transition-colors
              hover:bg-neutral-100
            "
          >
            <ArrowLeft size={18} />
          </button>

          {/* Divider */}
          <div className="h-5 w-px bg-neutral-200" />

          {/* Active Item */}
          <div className="flex items-center gap-2">
            <span className="text-neutral-500">
              {activeItem.icon}
            </span>

            <span className="text-sm font-semibold text-neutral-800">
              {activeItem.name}
            </span>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <Link
            href="/notifications"
            className="
              relative
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-lg
              text-neutral-500
              transition-colors
              hover:bg-neutral-100
            "
          >
            <Bell size={18} />

            {IsAnyNewNotification && (
              <span
                className="
                  absolute
                  right-2
                  top-2
                  h-2
                  w-2
                  rounded-full
                  bg-blue-500
                "
              />
            )}
          </Link>

          {/* Divider */}
          <div className="h-5 w-px bg-neutral-200" />

          {/* User */}
          <div className="flex items-center gap-2">
            {/* Avatar */}
            <div
              className="
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-full
                bg-neutral-100
              "
            >
              <User
                size={16}
                className="text-neutral-500"
              />
            </div>

            {/* User Info */}
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-medium text-neutral-800">
                John Doe
              </span>

              <span className="text-xs text-neutral-500">
                Student
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Page Heading */}
      {activeItem?.text && (
        <section
          className="
            hidden
            px-8
            pt-24
            pb-4
            md:block
          "
        >
          <h1 className="text-2xl font-bold text-neutral-900">
            {activeItem.name}
          </h1>

          <p className="mt-1 text-sm text-neutral-500">
            {activeItem.text}
          </p>
        </section>
      )}
    </>
  );
}