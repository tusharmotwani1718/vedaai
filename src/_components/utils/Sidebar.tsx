"use client";

import { Settings, User } from "lucide-react";
import { JSX, useEffect } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "./navItems";
import SidebarButton from "./SidebarButton";
import { useSidebarStore } from "../../../store/sidebar.store";


const sidebarVariants = {
    open: {
        width: 300,
        transition: { duration: 0.3 }
    },
    closed: {
        width: 60,
        transition: { duration: 0.2 }
    }
};

const linkVariants = {
    open: {
        opacity: 1,
        y: 0
    },
    closed: {
        opacity: 0,
        y: -10
    }
};

const listParentVariants = {
    open: {
        transition: {
            staggerChildren: 0.04,
            delayChildren: 0.2,
        }
    },
    closed: {
        transition: {
            staggerChildren: 0.02,
            staggerDirection: -1,
        }
    }
};

const MotionLink = motion.create(Link);


export default function Sidebar(): JSX.Element {

    const pathname = usePathname();
    const isActive = (path: string) => pathname === path;
    const { setActiveTab } = useSidebarStore();

    // Keep store in sync whenever the route changes
    useEffect(() => {
        const match = navItems.find((item) => item.href === pathname);
        if (match) {
            setActiveTab(match.name);
        }
    }, [pathname, setActiveTab]);

    return (
        <motion.div
            initial={false}
            animate={"open"}
            className="fixed top-0 left-0 z-50"
            style={{
                display: "flex",
                height: "100vh",
                padding: "14px",
            }}
        >
            <motion.aside
                variants={sidebarVariants}
                style={{
                    background: '#ffffff',
                    borderRight: '0.5px solid #e0ddd6',
                    display: 'flex',
                    flexDirection: 'column',
                    height: 'calc(100vh - 28px)',
                    padding: '12px 0',
                    overflow: 'hidden',
                    flexShrink: 0,
                }}
                className="rounded-md shadow-[0_1px_1px_rgba(0,0,0,0.5),0_4px_6px_rgba(34,42,53,0.04),0_24px_68px_rgba(47,48,55,0.05),0_2px_3px_rgba(0,0,0,0.04)]"
            >

                {/* VedaAI Logo */}
                <div style={{
                    padding: '4px 20px 16px',
                    whiteSpace: 'nowrap',
                }}>
                    <span
                        className="text-2xl text-amber-950"
                        style={{ fontWeight: 700 }}
                    >
                        VedaAI
                    </span>
                </div>

                {/* Branded CTA Button */}
                <div className="px-3 pb-4">
                    <SidebarButton text="Create Assignment" />
                </div>

                {/* Nav items */}
                <motion.nav variants={listParentVariants} className="px-3">
                    {navItems.map((link, index) => (
                        <MotionLink
                            href={link.href}
                            variants={linkVariants}
                            key={index}
                            className={`${isActive(link.href) && 'bg-neutral-200'} rounded-lg`}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                padding: '10px 16px',
                                color: '#444441',
                                textDecoration: 'none',
                                fontSize: 14,
                                fontWeight: 400,
                                whiteSpace: 'nowrap',
                            }}
                        >
                            <span style={{ flexShrink: 0, color: '#888780', display: 'flex' }}>
                                {link.icon}
                            </span>
                            <span>{link.name}</span>
                        </MotionLink>
                    ))}
                </motion.nav>

                {/* Bottom section: Settings + User */}
                <div className="mt-auto w-full flex flex-col">

                    {/* Settings button */}
                    <div className="px-3 pb-1">
                        <MotionLink
                            href="/settings"
                            variants={linkVariants}
                            className={`${isActive('/settings') ? 'bg-neutral-200' : 'hover:bg-neutral-100'} rounded-lg transition-colors`}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                padding: '10px 16px',
                                color: '#444441',
                                textDecoration: 'none',
                                fontSize: 14,
                                fontWeight: 400,
                                whiteSpace: 'nowrap',
                            }}
                        >
                            <span style={{ flexShrink: 0, color: '#888780', display: 'flex' }}>
                                <Settings size={20} />
                            </span>
                            <span>Settings</span>
                        </MotionLink>
                    </div>

                    {/* User row */}
                    <div
                        className="w-full flex flex-col items-center gap-3 py-3 px-4"
                        style={{ borderTop: '0.5px solid #e0ddd6' }}
                    >
                        <span className="flex gap-2 items-center justify-center text-xs text-neutral-600 w-full">
                            <User size={12} />
                            <span className="truncate">{"John Doe"}</span>
                        </span>
                    </div>

                </div>

            </motion.aside>
        </motion.div>
    )
}