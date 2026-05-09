"use client";

import clsx from "clsx";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition } from "react";
import { clearSessionUser } from "@/lib/auth";
import { logoutUser } from "@/lib/backend-api";
import { LogoutIcon, MenuIcon } from "@/components/icons";
import { roleAccent, roleLabels, type SessionUser } from "@/types";

interface NavbarProps {
  sessionUser: SessionUser | null;
  onOpenSidebar: () => void;
}

export default function Navbar({ sessionUser, onOpenSidebar }: NavbarProps) {
  const router = useRouter();

  const logout = async () => {
    try {
      await logoutUser();
    } finally {
      clearSessionUser();
      startTransition(() => {
        router.push("/login");
        router.refresh();
      });
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-3 py-2 lg:px-6">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="inline-flex h-9 w-9 items-center justify-center border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:text-slate-900 lg:hidden"
          aria-label="Открыть меню"
        >
          <MenuIcon className="h-5 w-5" />
        </button>

        <Link
          href="/profile"
          className="min-w-0 border border-slate-200 bg-white px-2 py-1.5 transition hover:border-slate-300"
        >
          {sessionUser ? (
            <div className="flex min-w-0 items-center gap-2">
              <div
                className={clsx(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white",
                  sessionUser.avatarColor,
                )}
              >
                {sessionUser.fullName
                  .split(" ")
                  .slice(0, 2)
                  .map((part) => part.charAt(0))
                  .join("")}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-slate-900 sm:text-sm">
                  {sessionUser.fullName}
                </p>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <span
                    className={clsx(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                      roleAccent(sessionUser.role),
                    )}
                  >
                    {roleLabels[sessionUser.role]}
                  </span>
                  <span className="hidden truncate text-[11px] text-slate-500 lg:inline">
                    {sessionUser.organization}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-8 w-36 animate-pulse bg-slate-200" />
          )}
        </Link>

        <div className="min-w-0 flex-1 px-1">
          <Link
            href="/patients"
            className="hidden text-xs font-medium uppercase tracking-[0.16em] text-slate-400 lg:inline-flex"
          >
            Radiomed
          </Link>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={logout}
            className="inline-flex h-9 items-center gap-2 bg-slate-900 px-3 text-xs font-semibold text-white transition hover:bg-slate-800 sm:text-sm"
          >
            <LogoutIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Выйти</span>
          </button>
        </div>
      </div>
    </header>
  );
}
