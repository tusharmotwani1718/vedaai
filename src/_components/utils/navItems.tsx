import { LayoutDashboard, Group, Files, Book, ChartPie } from "lucide-react";
import type { SidebarItem } from "../../../types/components.types";

export const navItems: SidebarItem[] = [
    { name: "Home",               href: '/',                   icon: <LayoutDashboard /> },
    { name: "My Groups",          href: '/groups',             icon: <Group /> },
    { name: "Assignments",        href: '/assignments',        icon: <Files /> },
    { name: "AI Teacher Toolkit", href: '/ai-teacher-toolkit', icon: <Book /> },
    { name: "My Library",         href: '/library',            icon: <ChartPie /> },
];
