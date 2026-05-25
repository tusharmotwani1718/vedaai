import { JSX } from "react";

export interface SidebarItem  {
    name: string;
    href: string;
    icon: JSX.Element;
    text?: string;
}



