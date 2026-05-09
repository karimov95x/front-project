"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import {
  CalendarIcon,
  CloseIcon,
  PatientsIcon,
  ShieldIcon,
  UploadIcon,
} from "@/components/icons";
import type { SessionUser } from "@/types";

interface SidebarProps {
  sessionUser: SessionUser | null;
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ sessionUser, open, onClose }: SidebarProps) {
  const pathname = usePathname();

  const items = useMemo(() => {
    const base = [
      { href: "/calendar", label: "Календарь", icon: CalendarIcon },
      { href: "/patients", label: "Все пациенты", icon: PatientsIcon },
    ];

    if (sessionUser?.role === "DOCTOR") {
      base.splice(2, 0, {
        href: "/my-patients",
        label: "Мои пациенты",
        icon: UploadIcon,
      });
    }

    if (sessionUser?.role === "ADMIN") {
      base.push({ href: "/admin", label: "Админ-панель", icon: ShieldIcon });
    }

    return base;
  }, [sessionUser?.role]);

  return (
    <>
      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-900/30 lg:hidden"
          onClick={onClose}
          aria-label="Закрыть меню"
        />
      ) : null}

      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-50 flex w-[272px] flex-col border-r border-slate-200 bg-white px-4 pb-6 pt-5 transition-transform lg:translate-x-0 lg:shadow-none",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="mb-6 flex items-center justify-between px-2 lg:hidden">
          <span className="font-[family:var(--font-display)] text-lg font-semibold text-slate-900">
            Навигация
          </span>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600"
            aria-label="Закрыть боковое меню"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="hidden border-b border-slate-200 px-2 pb-4 lg:block">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--color-primary)]">
            Radiomed
          </p>
        </div>

        <nav className="mt-4 space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={clsx(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  active
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
