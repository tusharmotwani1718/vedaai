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
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M17.5 11.6667H11.6666V17.5H17.5V11.6667Z"
        stroke="#5E5E5E"
        strokeOpacity="0.8"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.33333 11.6667H2.5V17.5H8.33333V11.6667Z"
        stroke="#5E5E5E"
        strokeOpacity="0.8"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17.5 2.5H11.6666V8.33333H17.5V2.5Z"
        stroke="#5E5E5E"
        strokeOpacity="0.8"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.33333 2.5H2.5V8.33333H8.33333V2.5Z"
        stroke="#5E5E5E"
        strokeOpacity="0.8"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ClassroomIcon(props: IconProps) {
  return (
    <svg width="20" height="14" viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M18.0053 0C19.1069 0 20 0.867353 20 1.93727V12.0627C20 12.8063 19.5687 13.452 18.9357 13.7767C18.7114 13.0842 18.552 12.599 18.4574 12.321C18.403 12.1608 18.3777 12.011 18.2979 11.8819C18.2236 11.7617 18.1006 11.6182 17.9791 11.4747L17.9521 11.4428C17.5516 10.968 17.0414 10.3553 16.609 9.82839C16.1946 9.32331 15.8524 8.89639 15.7181 8.78227C15.3989 8.51105 14.9468 8.21401 14.2686 8.21401H9.66755C9.62487 8.2067 9.53035 8.1911 9.41489 8.14943C8.91888 7.97045 7.88479 7.51948 7.36702 7.30995C6.21465 6.13586 5.35029 5.25332 4.77394 4.66235C4.72638 4.61361 4.61117 4.49397 4.42827 4.30347C4.20391 4.06978 3.83109 4.04594 3.57713 4.24907C3.32508 4.45067 3.28322 4.81013 3.48253 5.06133C5.29064 7.33994 6.21755 8.50276 6.2633 8.5498C6.37468 8.66433 6.70673 8.87699 7.11436 9.1439C7.53415 9.41875 8.03354 9.75 8.41755 10.0092C8.77511 10.2505 8.97606 10.3192 9.01596 10.655C9.10394 11.3955 9.21032 12.5105 9.33511 14H1.99468C0.893058 14 0 13.1326 0 12.0627V1.93727C0 0.867353 0.893058 0 1.99468 0H18.0053ZM15.7979 11.7915C15.9066 11.7819 16.0276 11.915 16.0771 11.9594C16.2486 12.1131 16.3003 12.1721 16.4096 12.2694C16.5691 12.4114 16.7331 12.5764 16.7553 12.6051C16.9727 12.99 17.2919 13.7639 17.4073 14L15.4654 14C15.5489 13.0617 15.6021 12.459 15.625 12.1919C15.6516 11.8819 15.6891 11.8011 15.7979 11.7915ZM12.4734 3.06088C11.1955 3.06088 10.1596 4.06699 10.1596 5.30811C10.1596 6.54922 11.1955 7.55534 12.4734 7.55534C13.7513 7.55534 14.7872 6.54922 14.7872 5.30811C14.7872 4.06699 13.7513 3.06088 12.4734 3.06088Z"
        fill="#5E5E5E"
        fillOpacity="0.8"
      />
    </svg>
  );
}

export function AssignmentsIcon(props: IconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M7.5 14.1667H12.5"
        stroke="#5E5E5E"
        strokeOpacity="0.8"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M7.5 10.8333H12.5"
        stroke="#5E5E5E"
        strokeOpacity="0.8"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M7.5 7.5H8.33333"
        stroke="#5E5E5E"
        strokeOpacity="0.8"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M4.16663 5C4.16663 3.61929 5.28591 2.5 6.66663 2.5H10.9763C11.4183 2.5 11.8422 2.67559 12.1548 2.98816L15.3451 6.17851C15.6577 6.49107 15.8333 6.915 15.8333 7.35702V15C15.8333 16.3807 14.714 17.5 13.3333 17.5H6.66663C5.28591 17.5 4.16663 16.3807 4.16663 15V5Z"
        stroke="#5E5E5E"
        strokeOpacity="0.8"
        strokeWidth="2"
      />
      <path
        d="M10.8334 2.5V4.16667C10.8334 6.00762 12.3258 7.5 14.1667 7.5H15.8334"
        stroke="#5E5E5E"
        strokeOpacity="0.8"
        strokeWidth="2"
      />
    </svg>
  );
}

export function ExamsIcon(props: IconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M13.3334 3.33334H15C15.4421 3.33334 15.866 3.50894 16.1786 3.8215C16.4911 4.13406 16.6667 4.55798 16.6667 5.00001V16.6667C16.6667 17.1087 16.4911 17.5326 16.1786 17.8452C15.866 18.1577 15.4421 18.3333 15 18.3333H5.00004C4.55801 18.3333 4.13409 18.1577 3.82153 17.8452C3.50897 17.5326 3.33337 17.1087 3.33337 16.6667V5.00001C3.33337 4.55798 3.50897 4.13406 3.82153 3.8215C4.13409 3.50894 4.55801 3.33334 5.00004 3.33334H6.66671"
        stroke="#303030"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12.5 1.66666H7.49996C7.03972 1.66666 6.66663 2.03975 6.66663 2.49999V4.16666C6.66663 4.62689 7.03972 4.99999 7.49996 4.99999H12.5C12.9602 4.99999 13.3333 4.62689 13.3333 4.16666V2.49999C13.3333 2.03975 12.9602 1.66666 12.5 1.66666Z"
        stroke="black"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LibraryIcon(props: IconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M17.6751 13.2417C17.1449 14.4954 16.3157 15.6002 15.2599 16.4594C14.2042 17.3187 12.954 17.9062 11.6187 18.1707C10.2835 18.4351 8.90374 18.3685 7.60017 17.9765C6.29661 17.5845 5.10891 16.8792 4.1409 15.9222C3.1729 14.9652 2.45406 13.7856 2.04725 12.4866C1.64043 11.1876 1.55802 9.80874 1.80722 8.47053C2.05641 7.13232 2.62963 5.87553 3.47676 4.81003C4.32388 3.74453 5.41912 2.90277 6.66672 2.35834"
        stroke="#5E5E5E"
        strokeOpacity="0.8"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18.3333 9.99999C18.3333 8.90564 18.1178 7.82201 17.699 6.81096C17.2802 5.79991 16.6664 4.88125 15.8926 4.10743C15.1187 3.33361 14.2001 2.71978 13.189 2.30099C12.178 1.8822 11.0943 1.66666 10 1.66666V9.99999H18.3333Z"
        stroke="#5E5E5E"
        strokeOpacity="0.8"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
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
    <svg width="21" height="20" viewBox="0 0 21 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g filter="url(#filter0_i_11406_309)">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M4.54441 8.66039C6.78395 7.91387 8.54132 6.15651 9.28783 3.91697L10.0344 1.67725L10.625 0L11.2203 1.67725L11.9668 3.91697C12.7133 6.15651 14.4707 7.91387 16.7102 8.66039L18.95 9.40696L20.625 10L18.95 10.5928L16.7102 11.3394C14.4707 12.0859 12.7133 13.8433 11.9668 16.0828L11.2203 18.3225L10.625 20L10.0344 18.3225L9.28783 16.0828C8.54132 13.8433 6.78395 12.0859 4.54441 11.3394L2.30469 10.5928L0 10L2.30469 9.40696L4.54441 8.66039Z"
          fill="#2B2B2B"
        />
      </g>
      <defs>
        <filter
          id="filter0_i_11406_309"
          x="0"
          y="0"
          width="20.625"
          height="20"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset />
          <feGaussianBlur stdDeviation="2" />
          <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
          <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.4 0" />
          <feBlend mode="normal" in2="shape" result="effect1_innerShadow_11406_309" />
        </filter>
      </defs>
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
