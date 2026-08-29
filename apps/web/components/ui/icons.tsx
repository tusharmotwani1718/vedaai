import type { SVGProps } from 'react';

/**
 * Inline SVG icons.
 *
 * Kept as components rather than image files so they inherit `currentColor` and
 * stay crisp at any size. Every icon draws on a 24x24 grid with a 1.6 stroke,
 * which is what matches the weight in the Figma reference.
 */

type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export function HomeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="3" width="7.5" height="7.5" rx="2" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="2" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="2" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2" />
    </Icon>
  );
}

export function ClassroomIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 5.5h13a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H3z" />
      <path d="M18 9.5 21.5 7v10L18 14.5" />
    </Icon>
  );
}

export function AssignmentsIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6M9 16.5h4" />
    </Icon>
  );
}

export function ExamsIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="5" y="4" width="14" height="17" rx="2.5" />
      <path d="M9 4a1.6 1.6 0 0 1 1.6-1.6h2.8A1.6 1.6 0 0 1 15 4v.8a.8.8 0 0 1-.8.8H9.8A.8.8 0 0 1 9 4.8z" />
    </Icon>
  );
}

export function LibraryIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3a9 9 0 1 0 9 9h-9z" />
      <path d="M12 3v9h9a9 9 0 0 0-9-9z" opacity="0.45" />
    </Icon>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.6 1.6 0 0 0 .32 1.77l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.6 1.6 0 0 0-1.77-.32 1.6 1.6 0 0 0-1 1.47V21a2 2 0 1 1-4 0v-.11a1.6 1.6 0 0 0-1.05-1.46 1.6 1.6 0 0 0-1.77.32l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.6 1.6 0 0 0 .32-1.77 1.6 1.6 0 0 0-1.47-1H3a2 2 0 1 1 0-4h.11a1.6 1.6 0 0 0 1.46-1.05 1.6 1.6 0 0 0-.32-1.77l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.6 1.6 0 0 0 1.77.32H9a1.6 1.6 0 0 0 1-1.47V3a2 2 0 1 1 4 0v.11a1.6 1.6 0 0 0 1 1.47 1.6 1.6 0 0 0 1.77-.32l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.6 1.6 0 0 0-.32 1.77V9a1.6 1.6 0 0 0 1.47 1H21a2 2 0 1 1 0 4h-.11a1.6 1.6 0 0 0-1.47 1z" />
    </Icon>
  );
}

export function PanelCollapseIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
      <path d="M10 4.5v15" />
    </Icon>
  );
}

export function ArrowLeftIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M19 12H5" />
      <path d="m11 6-6 6 6 6" />
    </Icon>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </Icon>
  );
}

export function HelpIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.6 9.4a2.5 2.5 0 1 1 3.3 2.36c-.55.2-.9.73-.9 1.32v.42" />
      <path d="M12 17h.01" />
    </Icon>
  );
}

export function BellIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M18 8.5a6 6 0 1 0-12 0c0 5-2 6.5-2 6.5h16s-2-1.5-2-6.5" />
      <path d="M13.7 19a2 2 0 0 1-3.4 0" />
    </Icon>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m6 9.5 6 6 6-6" />
    </Icon>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </Icon>
  );
}

export function UploadIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 15.5V4" />
      <path d="m7.5 8.5 4.5-4.5 4.5 4.5" />
      <path d="M4 15v3.5A2.5 2.5 0 0 0 6.5 21h11a2.5 2.5 0 0 0 2.5-2.5V15" />
    </Icon>
  );
}

/** Filled four-point star. Used on the toolkit pill and in the top bar. */
export function SparkleIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" {...props}>
      <path d="M12 2.5c.28 3.5 1.5 5.3 4.9 6.1l1.1.25-1.1.25c-3.4.8-4.62 2.6-4.9 6.1-.28-3.5-1.5-5.3-4.9-6.1L6 8.85l1.1-.25C10.5 7.8 11.72 6 12 2.5z" />
      <path d="M18.2 14.4c.17 2 .87 3.03 2.8 3.5l.6.15-.6.15c-1.93.47-2.63 1.5-2.8 3.5-.17-2-.87-3.03-2.8-3.5l-.6-.15.6-.15c1.93-.47 2.63-1.5 2.8-3.5z" />
    </svg>
  );
}

/* ------------------------------------------------------------------ *
 * Badge icons — the four markers orbiting the upload illustration.
 * Rendered around 14px, so they use a heavier stroke than the set above.
 * ------------------------------------------------------------------ */

function BadgeIcon({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <BadgeIcon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </BadgeIcon>
  );
}

export function ListCardIcon(props: IconProps) {
  return (
    <BadgeIcon {...props}>
      <rect x="4" y="3.5" width="16" height="17" rx="3" />
      <path d="M8 9h8M8 13h8M8 17h5" />
    </BadgeIcon>
  );
}

export function CloudIcon(props: IconProps) {
  return (
    <BadgeIcon {...props}>
      <path d="M7 18.5a4.5 4.5 0 0 1-.5-8.97A6 6 0 0 1 18 10.5a4 4 0 0 1-1 8z" />
      <path d="M12 16.5v-5M9.5 13.5 12 11l2.5 2.5" />
    </BadgeIcon>
  );
}

export function GearIcon(props: IconProps) {
  return (
    <BadgeIcon {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.5v3M12 18.5v3M21.5 12h-3M5.5 12h-3M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1M18.7 18.7l-2.1-2.1M7.4 7.4 5.3 5.3" />
    </BadgeIcon>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.6}
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
