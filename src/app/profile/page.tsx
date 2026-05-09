"use client";

import clsx from "clsx";
import { useEffect, useState } from "react";
import EmptyState from "@/components/EmptyState";
import PageHeader from "@/components/PageHeader";
import { getPersonalStudyCount } from "@/lib/backend-api";
import { useSessionUser } from "@/lib/hooks";
import { roleAccent, roleLabels } from "@/types";

export default function ProfilePage() {
  const sessionUser = useSessionUser();
  const [personalCount, setPersonalCount] = useState(0);

  useEffect(() => {
    let active = true;

    if (!sessionUser) {
      setPersonalCount(0);
      return undefined;
    }

    getPersonalStudyCount(sessionUser)
      .then((count) => {
        if (active) {
          setPersonalCount(count);
        }
      })
      .catch(() => {
        if (active) {
          setPersonalCount(0);
        }
      });

    return () => {
      active = false;
    };
  }, [sessionUser]);

  if (!sessionUser) {
    return (
      <EmptyState
        title="Профиль загружается"
        description="Считываем активную демо-сессию и настройки роли."
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Профиль"
        title="Карточка пользователя и доступ к ролевым возможностям"
        description="В профиле видно текущую роль, организацию, контакты и набор задач, за которые отвечает пользователь внутри процесса передачи исследований."
      />

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_18px_45px_rgba(84,106,149,0.10)]">
          <div className="flex items-start gap-4">
            <div
              className={clsx(
                "flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-[28px] bg-gradient-to-br text-2xl font-semibold text-white",
                sessionUser.avatarColor,
              )}
            >
              {sessionUser.fullName
                .split(" ")
                .slice(0, 2)
                .map((part) => part.charAt(0))
                .join("")}
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">
                {sessionUser.fullName}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                {sessionUser.organization}
              </p>
              <span
                className={clsx(
                  "mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                  roleAccent(sessionUser.role),
                )}
              >
                {roleLabels[sessionUser.role]}
              </span>
            </div>
          </div>

          <div className="mt-6 space-y-3 text-sm text-slate-600">
            <p>Email: {sessionUser.email}</p>
            <p>Телефон: {sessionUser.phone ?? "Не указан"}</p>
            <p>
              Специализация:{" "}
              {sessionUser.specialization ?? "Координация и администрирование"}
            </p>
          </div>
        </section>

        <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_18px_45px_rgba(84,106,149,0.10)]">
          <h2 className="text-xl font-semibold text-slate-900">
            Что доступно этой роли
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[24px] bg-slate-50 p-4">
              <p className="text-sm text-slate-500">
                Исследований в зоне ответственности
              </p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">
                {personalCount}
              </p>
            </div>
            <div className="rounded-[24px] bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Тип доступа</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">
                Полный / ролевой
              </p>
            </div>
          </div>

          <ul className="mt-5 space-y-3 text-sm leading-7 text-slate-600">
            {sessionUser.role === "ADMIN" ? (
              <>
                <li>Управление пользователями, клиниками и врачами.</li>
                <li>Просмотр всей очереди исследований и всех статусов.</li>
                <li>Контроль SLA, отказов и системных уведомлений.</li>
              </>
            ) : null}
            {sessionUser.role === "CLINIC" ? (
              <>
                <li>Создание исследования и загрузка DICOM/PDF.</li>
                <li>Контроль статуса: новое, в работе, готово, отказ.</li>
                <li>Просмотр готовых заключений и причин отказов.</li>
              </>
            ) : null}
            {sessionUser.role === "DOCTOR" ? (
              <>
                <li>Взять исследование в работу и вести личную очередь.</li>
                <li>
                  Загрузить PDF с заключением или оформить отказ с причиной.
                </li>
                <li>Приоритизировать CITO и контролировать дедлайны.</li>
              </>
            ) : null}
          </ul>
        </section>
      </div>
    </div>
  );
}
