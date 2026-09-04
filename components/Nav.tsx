"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, ShortsIcon, CreateIcon, MessageIcon, ProfileIcon } from "./icons";

const items = [
  { href: "/", label: "Home", Icon: HomeIcon },
  { href: "/shorts", label: "Shorts", Icon: ShortsIcon },
  { href: "/create", label: "Create", Icon: CreateIcon },
  { href: "/messages", label: "Messages", Icon: MessageIcon },
  { href: "/profile", label: "Profile", Icon: ProfileIcon }
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile bottom nav */}
      <nav
        aria-label="Primary"
        className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t bg-[var(--surface)]/90 backdrop-blur px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 md:hidden"
      >
        {items.map(({ href, label, Icon }) => {
          const active = pathname === href;
          const isCreate = href === "/create";
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className="flex flex-col items-center gap-1 px-3 py-1 min-w-[3.25rem]"
            >
              {isCreate ? (
                <span className="grid place-items-center w-11 h-11 rounded-full bg-indigo text-white shadow-soft -mt-4">
                  <Icon />
                </span>
              ) : (
                <span
                  className={`grid place-items-center w-9 h-9 rounded-full transition-colors ${
                    active ? "bg-blush text-ink dark:bg-violet/30 dark:text-white" : "text-[var(--muted)]"
                  }`}
                >
                  <Icon />
                </span>
              )}
              {!isCreate && (
                <span className={`text-[0.65rem] ${active ? "font-semibold" : "text-[var(--muted)]"}`}>
                  {label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Desktop left rail */}
      <nav
        aria-label="Primary"
        className="hidden md:flex md:flex-col md:fixed md:left-0 md:top-0 md:bottom-0 md:w-[76px] lg:w-[240px] md:border-r md:py-6 md:px-3 md:z-40 bg-[var(--surface)]"
      >
        <Link href="/" className="font-display font-bold text-2xl px-2 mb-8 hidden lg:block">
          zeni
        </Link>
        <Link href="/" className="font-display font-bold text-2xl mb-8 lg:hidden grid place-items-center w-10 h-10 rounded-xl bg-indigo text-white">
          z
        </Link>
        <div className="flex flex-col gap-1">
          {items.map(({ href, label, Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-xl2 px-3 py-3 transition-colors ${
                  active ? "bg-blush text-ink dark:bg-violet/25 dark:text-white font-semibold" : "hover:bg-black/5 dark:hover:bg-white/5"
                }`}
              >
                <Icon />
                <span className="hidden lg:inline text-sm">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
