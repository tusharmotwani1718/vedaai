"use client";

import { ArrowLeft, Bell, User } from "lucide-react";
import { JSX } from "react";
import { useRouter } from "next/navigation";
import { useSidebarStore } from "../../../store/sidebar.store";
import { navItems } from "./navItems";

export default function Topbar(): JSX.Element {
    const router = useRouter();
    const { activeTabName } = useSidebarStore();

    const activeItem = navItems.find((item) => item.name === activeTabName) ?? navItems[0];

    return (
        <div
            style={{
                background: '#ffffff',
                border: '0.5px solid #e0ddd6',
                borderRadius: '8px',
                margin: '14px 14px 0 0',
                padding: '0 16px',
                height: '52px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
            }}
            className="shadow-[0_1px_1px_rgba(0,0,0,0.5),0_4px_6px_rgba(34,42,53,0.04),0_24px_68px_rgba(47,48,55,0.05),0_2px_3px_rgba(0,0,0,0.04)]"
        >
            {/* Left: back arrow + divider + tab icon + tab name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                    onClick={() => router.back()}
                    title="Go back"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '6px',
                        borderRadius: '8px',
                        background: 'transparent',
                        border: 'none',
                        color: '#888780',
                        cursor: 'pointer',
                    }}
                    className="hover:bg-neutral-100 transition-colors"
                >
                    <ArrowLeft size={17} />
                </button>

                {/* Vertical divider */}
                <div style={{ width: 1, height: 16, background: '#e0ddd6' }} />

                {/* Active tab icon */}
                <span style={{ display: 'flex', alignItems: 'center', color: '#888780', flexShrink: 0 }}>
                    {activeItem.icon}
                </span>

                {/* Active tab name */}
                <span className="opacity-50 font-semibold">
                    {activeItem.name}
                </span>
            </div>

            {/* Right: notifications bell + divider + user avatar + name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {/* Notification bell */}
                <button
                    title="Notifications"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '6px',
                        borderRadius: '8px',
                        background: 'transparent',
                        border: 'none',
                        color: '#888780',
                        cursor: 'pointer',
                    }}
                    className="hover:bg-neutral-100 transition-colors"
                >
                    <Bell size={17} />
                </button>

                {/* Vertical divider */}
                <div style={{ width: 1, height: 16, background: '#e0ddd6' }} />

                {/* User avatar + name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: '#f0ede8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                    }}>
                        <User size={14} style={{ color: '#888780' }} />
                    </div>
                    <span style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: '#444441',
                        whiteSpace: 'nowrap',
                    }}>
                        John Doe
                    </span>
                </div>
            </div>
        </div>
    );
}