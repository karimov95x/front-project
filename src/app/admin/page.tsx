"use client";

import clsx from "clsx";
import { useEffect, useState } from "react";
import EmptyState from "@/components/EmptyState";
import { ListSkeleton, MetricSkeletons } from "@/components/LoadingSkeleton";
import PageHeader from "@/components/PageHeader";
import { getAdminOverview } from "@/lib/backend-api";
import { useSessionUser } from "@/lib/hooks";
import { roleAccent, roleLabels, type AdminOverviewData } from "@/types";

export default function AdminPage() {
  const sessionUser = useSessionUser();
  const [data, setData] = useState<AdminOverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    if (!sessionUser || sessionUser.role !== "ADMIN") {
      return undefined;
    }

    getAdminOverview()
      .then((response) => {
        if (active) {
          setData(response);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [sessionUser]);

  if (!sessionUser) {
    return <ListSkeleton rows={4} />;
  }

  if (sessionUser.role !== "ADMIN") {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Админ-панель"
          title="Доступ ограничен"
          description="Управление пользователями и метриками платформы доступно только администратору системы."
        />
        <EmptyState
          title="Недостаточно прав"
          description="Войдите под учетной записью администратора, чтобы просмотреть пользователей, приглашения и системные метрики."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Админ-панель"
        title="Управление пользователями и контроль общей нагрузки"
        description="Администратор видит всю команду, приглашения, рост пользователей и системные показатели по исследованиям."
      />

      {loading || !data ? (
        <>
          <MetricSkeletons />
          <ListSkeleton rows={4} />
        </>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_18px_45px_rgba(84,106,149,0.10)]">
              <p className="text-sm text-slate-500">Активных пользователей</p>
              <p className="mt-3 text-4xl font-semibold text-slate-900">
                {data.users.length}
              </p>
            </div>
            <div className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_18px_45px_rgba(84,106,149,0.10)]">
              <p className="text-sm text-slate-500">Ожидают приглашения</p>
              <p className="mt-3 text-4xl font-semibold text-slate-900">
                {data.pendingInvites}
              </p>
            </div>
            <div className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_18px_45px_rgba(84,106,149,0.10)]">
              <p className="text-sm text-slate-500">Новых регистраций</p>
              <p className="mt-3 text-4xl font-semibold text-slate-900">
                {data.recentSignups}
              </p>
            </div>
            <div className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_18px_45px_rgba(84,106,149,0.10)]">
              <p className="text-sm text-slate-500">Срочных исследований</p>
              <p className="mt-3 text-4xl font-semibold text-slate-900">
                {data.stats.urgentStudies}
              </p>
            </div>
          </div>

          <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_18px_45px_rgba(84,106,149,0.10)]">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold text-slate-900">
                Пользователи платформы
              </h2>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {data.users.length} аккаунтов
              </span>
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-2">
              {data.users.map((user) => (
                <article
                  key={user.id}
                  className="rounded-[28px] border border-slate-100 bg-slate-50 px-5 py-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        {user.fullName}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {user.organization}
                      </p>
                    </div>
                    <span
                      className={clsx(
                        "rounded-full px-3 py-1 text-xs font-semibold",
                        roleAccent(user.role),
                      )}
                    >
                      {roleLabels[user.role]}
                    </span>
                  </div>
                  <p className="mt-4 text-sm text-slate-600">{user.email}</p>
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
