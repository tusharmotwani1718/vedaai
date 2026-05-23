"use client";

import { LayoutDashboard, Group, Files, Book, ChartPie, X, Menu, User } from "lucide-react";
import { JSX } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebarStore } from "../../../store/sidebar.store.js"
import type { SidebarItem } from "../../../types/components.types";


const items: SidebarItem[] = [
    {
        name: "Home",
        href: '/dashboard',
        icon: <LayoutDashboard />
    },
    {
        name: "My Groups",
        href: '/groups',
        icon: <Group />
    },
    {
        name: "Assignments",
        href: '/assignments',
        icon: <Files />
    },
    {
        name: "AI Teacher Toolkit",
        href: '/ai-teacher-toolkit',
        icon: <Book />
    },
    {
        name: "My Library",
        href: '/library',
        icon: <ChartPie />
    }
]





const sidebarVariants = {
    open: {
        width: 200,
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

    const { isSidebarOpen, toggleSidebar } = useSidebarStore();

    return (
        <motion.div
            initial={false}
            animate={isSidebarOpen ? 'open' : 'closed'}
            style={{ display: 'flex', height: '100vh' }}
        >
            <motion.aside
                variants={sidebarVariants}
                style={{
                    background: '#ffffff',
                    borderRight: '0.5px solid #e0ddd6',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    padding: '12px 0',
                    overflow: 'hidden',
                    flexShrink: 0,
                }}
            >
                <button
                    onClick={toggleSidebar}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: isSidebarOpen ? 'flex-end' : 'center',
                        padding: '8px 16px',
                        marginBottom: 8,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#888780',
                        borderRadius: 8,
                    }}
                >
                    {isSidebarOpen ? <X size={18} /> : <Menu size={18} />}
                </button>

                {isSidebarOpen && (
                    <div style={{
                        padding: '0 16px 12px',
                        fontSize: 13,
                        fontWeight: 500,
                        color: '#b4b2a9',
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        whiteSpace: 'nowrap',
                    }}>
                        Menu
                    </div>
                )}

                <motion.nav variants={listParentVariants} className="px-3">
                    {items.map((link, index) => (
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
                            {isSidebarOpen && <span>{link.name}</span>}
                        </MotionLink>
                    ))}

                </motion.nav>




                <div
                    className="mt-auto w-full flex flex-col items-center gap-3 py-3 px-4"
                    style={{ borderTop: '0.5px solid #e0ddd6' }}
                >
                    <span className="flex gap-2 items-center justify-center text-xs text-neutral-600 w-full">
                        <User size={12} />
                        <span className="truncate">{"John Doe"}</span>
                    </span>

                    {/* <span className={`flex gap-2 items-center justify-center text-xs w-full ${userData?.email_verified ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"} px-3 py-1 rounded-lg`}>
                            {userData?.email_verified ? "Verified" : "Unverified"}
                        </span> */}



                    {/* <button
                        className="text-sm text-neutral-600 flex items-center gap-2 justify-center w-full disabled:opacity-50"
                        // onClick={logoutUser}
                        // disabled={loggingOut}
                    >
                        {loggingOut ? "Logging out..." : "Logout"}
                        <LogOut size={14} />
                    </button> */}
                </div>

            </motion.aside>
        </motion.div>
    )
}