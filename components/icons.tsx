import React from "react";

type P = React.SVGProps<SVGSVGElement>;
const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const
};

export const HomeIcon = (p: P) => (
  <svg viewBox="0 0 24 24" width={22} height={22} {...base} {...p}>
    <path d="M3.5 10.5 12 3l8.5 7.5" />
    <path d="M5.5 9v10.5A1 1 0 0 0 6.5 20.5H9.5V15a1 1 0 0 1 1-1H13.5a1 1 0 0 1 1 1V20.5H17.5A1 1 0 0 0 18.5 19.5V9" />
  </svg>
);

export const ShortsIcon = (p: P) => (
  <svg viewBox="0 0 24 24" width={22} height={22} {...base} {...p}>
    <rect x="5" y="3" width="14" height="18" rx="3" />
    <path d="M10.5 9.2 15 12l-4.5 2.8Z" fill="currentColor" stroke="none" />
  </svg>
);

export const CreateIcon = (p: P) => (
  <svg viewBox="0 0 24 24" width={24} height={24} {...base} {...p}>
    <circle cx="12" cy="12" r="9.25" />
    <path d="M12 8v8M8 12h8" />
  </svg>
);

export const MessageIcon = (p: P) => (
  <svg viewBox="0 0 24 24" width={22} height={22} {...base} {...p}>
    <path d="M4 5.5h16v11H9.2L5 20.5V16.5H4Z" />
  </svg>
);

export const ProfileIcon = (p: P) => (
  <svg viewBox="0 0 24 24" width={22} height={22} {...base} {...p}>
    <circle cx="12" cy="8.2" r="3.4" />
    <path d="M4.8 20c1.1-3.6 4-5.3 7.2-5.3s6.1 1.7 7.2 5.3" />
  </svg>
);

export const SearchIcon = (p: P) => (
  <svg viewBox="0 0 24 24" width={20} height={20} {...base} {...p}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="m19.5 19.5-4.3-4.3" />
  </svg>
);

export const BellIcon = (p: P) => (
  <svg viewBox="0 0 24 24" width={20} height={20} {...base} {...p}>
    <path d="M6 10.5a6 6 0 0 1 12 0c0 4 1.2 5.4 1.8 6H4.2c.6-.6 1.8-2 1.8-6Z" />
    <path d="M10 19.5a2 2 0 0 0 4 0" />
  </svg>
);

export const HeartIcon = (p: P) => (
  <svg viewBox="0 0 24 24" width={26} height={26} {...base} {...p}>
    <path d="M12 20.2s-7.6-4.6-9.7-9.2C.9 7.3 3 4 6.6 4c2 0 3.6 1 5.4 3 1.8-2 3.4-3 5.4-3 3.6 0 5.7 3.3 4.3 7-2.1 4.6-9.7 9.2-9.7 9.2Z" />
  </svg>
);

export const CommentIcon = (p: P) => (
  <svg viewBox="0 0 24 24" width={24} height={24} {...base} {...p}>
    <path d="M4 5.5h16v10H9.2L5 19.5v-4H4Z" />
  </svg>
);

export const ShareIcon = (p: P) => (
  <svg viewBox="0 0 24 24" width={24} height={24} {...base} {...p}>
    <path d="M7 12.5 17 7m0 0-5-.2M17 7l.2 5M17 16v3a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1h3" />
  </svg>
);

export const SaveIcon = (p: P) => (
  <svg viewBox="0 0 24 24" width={24} height={24} {...base} {...p}>
    <path d="M6.5 3.5h11a1 1 0 0 1 1 1v16l-6.5-4-6.5 4v-16a1 1 0 0 1 1-1Z" />
  </svg>
);

export const PlayIcon = (p: P) => (
  <svg viewBox="0 0 24 24" width={20} height={20} {...base} {...p}>
    <path d="M8 5.5v13l11-6.5Z" fill="currentColor" stroke="none" />
  </svg>
);

export const MuteIcon = (p: P) => (
  <svg viewBox="0 0 24 24" width={20} height={20} {...base} {...p}>
    <path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4Z" />
    <path d="m15.5 9.5 4 4m0-4-4 4" />
  </svg>
);

export const SunIcon = (p: P) => (
  <svg viewBox="0 0 24 24" width={18} height={18} {...base} {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
  </svg>
);

export const MoonIcon = (p: P) => (
  <svg viewBox="0 0 24 24" width={18} height={18} {...base} {...p}>
    <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" />
  </svg>
);
