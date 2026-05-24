"use client";

import { ArrowLeft, Bell, User } from "lucide-react";
import { JSX } from "react";
import { useRouter } from "next/navigation";
import { useSidebarStore } from "../../../store/sidebar.store";
import { navItems } from "./navItems";
import { useNotificationsStore } from "../../../store/notifications.store";
import Link from "next/link";

export default function Topbar(): JSX.Element {
    const router = useRouter();
    const { activeTabName, isSidebarOpen } = useSidebarStore();


    const { IsAnyNewNotification } = useNotificationsStore();

    const activeItem = navItems.find((item) => item.name === activeTabName) ?? navItems[0];

    return (
        <div
            className="
            fixed
            top-3.5
            right-3.5
            left-82
            z-30

            h-13
            px-4

            flex
            items-center
            justify-between

            rounded-lg
            border
            border-[#e0ddd6]

            bg-white
            backdrop-blur-md

            shadow-[0_1px_1px_rgba(0,0,0,0.5),0_4px_6px_rgba(34,42,53,0.04),0_24px_68px_rgba(47,48,55,0.05),0_2px_3px_rgba(0,0,0,0.04)]
        "
        >
            {/* Left Section */}
            <div className="flex items-center gap-2.5">

                {/* Back Button */}
                <button
                    onClick={() => router.back()}
                    title="Go back"
                    className="
                    flex
                    items-center
                    justify-center

                    p-1.5
                    rounded-lg

                    text-[#888780]

                    hover:bg-neutral-100
                    transition-colors
                "
                >
                    <ArrowLeft size={17} />
                </button>

                {/* Divider */}
                <div className="w-px h-4 bg-[#e0ddd6]" />

                {/* Active Tab Icon */}
                <span className="flex items-center shrink-0 text-[#888780]">
                    {activeItem.icon}
                </span>

                {/* Active Tab Name */}
                <span className="font-semibold opacity-50">
                    {activeItem.name}
                </span>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2.5">

                {/* Notification Button */}
                <Link href={'/notifications'}>
                    <button
                        title="Notifications"
                        className="
                    flex
                    items-center
                    justify-center

                    p-1.5
                    rounded-lg

                    text-[#888780]

                    hover:bg-neutral-100
                    transition-colors
                    cursor-pointer
                "
                    >
                        <Bell size={17} />
                        {IsAnyNewNotification && (
                            <span className="bg-blue-500 text-white text-xs rounded-full px-3 py-1 ml-1">New</span>
                        )}
                    </button>
                </Link>

                {/* Divider */}
                <div className="w-px h-4 bg-[#e0ddd6]" />

                {/* User */}
                <div className="flex items-center gap-2">

                    {/* Avatar */}
                    <div
                        className="
                        w-7
                        h-7

                        rounded-full
                        bg-[#f0ede8]

                        flex
                        items-center
                        justify-center

                        shrink-0
                    "
                    >
                        <User
                            size={14}
                            className="text-[#888780]"
                        />
                    </div>

                    {/* Name */}
                    <span
                        className="
                        text-[13px]
                        font-medium
                        text-[#444441]
                        whitespace-nowrap
                    "
                    >
                        John Doe
                    </span>
                </div>
            </div>
        </div>
    );
}