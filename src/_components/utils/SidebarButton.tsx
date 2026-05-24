import { JSX } from 'react';
import { Sparkles } from "lucide-react";
import Link from 'next/link';

export default function SidebarButton({
    text = "Button" as string,
    className = `` as string,
}): JSX.Element {
    return (
        <Link href={'/assignments/create-assignment'}>
            <button
                className={`w-full cursor-pointer transition-opacity hover:opacity-90 active:opacity-80 rounded-3xl flex items-center gap-3 justify-center ${className}`}
                style={{
                    background: 'linear-gradient(145deg, #2e2e2e 0%, #1a1a1a 100%)',
                    border: '5px solid #c4763a',
                    padding: '10px 16px',
                    color: '#ffffff',
                    fontSize: 16,
                    whiteSpace: 'nowrap',
                }}
            >
                <Sparkles className="" />
                {text}
            </button>
        </Link>
    )
}