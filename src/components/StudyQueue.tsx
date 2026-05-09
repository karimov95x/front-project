"use client";

import clsx from "clsx";
import { ClockIcon, FileIcon, UploadIcon } from "@/components/icons";
import StatusPill from "@/components/StatusPill";
import { toast } from "@/components/Toast";
import {
  formatDate,
  formatDateTime,
  modalityLabels,
  type SessionUser,
  type Study,
} from "@/types";

interface StudyQueueProps {
  title: string;
  description: string;
  studies: Study[];
  sessionUser: SessionUser | null;
}

function getActionLabel(study: Study, sessionUser: SessionUser | null): string {
  if (study.status === "ready") return "Скачать PDF";
  if (study.status === "refused") return "Посмотреть причину";
  if (sessionUser?.role === "DOCTOR" && study.status === "new")
    return "Взять в работу";
  if (sessionUser?.role === "CLINIC") return "Отследить статус";
  return "Открыть карточку";
}

function handleStudyAction(study: Study) {
  if (study.status === "ready") {
    toast(
      `Файл ${study.conclusionFileName ?? "заключения"} подготовлен к скачиванию.`,
      "success",
    );
    return;
  }

  if (study.status === "refused") {
    toast(study.refusalReason ?? "Причина отказа не указана.", "info");
    return;
  }

  toast(`Исследование ${study.id} открыто для дальнейшей работы.`, "info");
}

export default function StudyQueue({
  title,
  description,
  studies,
  sessionUser,
}: StudyQueueProps) {
  if (studies.length === 0) {
    return null;
  }

  return (
    <section className="rounded-[32px] border border-white/70 bg-white/90 p-5 shadow-[0_18px_45px_rgba(84,106,149,0.10)] sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
        </div>
        <div className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          {studies.length} карточек
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {studies.map((study) => (
          <article
            key={study.id}
            className={clsx(
              "rounded-[28px] border p-5 transition hover:-translate-y-0.5",
              study.isCito
                ? "border-rose-200 bg-[linear-gradient(180deg,#fff5f5_0%,#ffffff_100%)]"
                : "border-slate-100 bg-[linear-gradient(180deg,#fdfefe_0%,#ffffff_100%)]",
            )}
          >
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                    {study.id}
                  </span>
                  <StatusPill status={study.status} />
                  {study.isCito ? (
                    <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
                      CITO
                    </span>
                  ) : null}
                </div>
                <h3 className="mt-3 text-xl font-semibold text-slate-900">
                  {study.patientName}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {modalityLabels[study.modality]} · дата рождения{" "}
                  {formatDate(study.birthDate)}
                </p>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                  {study.history}
                </p>
                <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
                  <span className="inline-flex items-center gap-2">
                    <ClockIcon className="h-4 w-4" />
                    дедлайн {formatDateTime(study.dueAt)}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <FileIcon className="h-4 w-4" />
                    {study.attachments.length} файла
                  </span>
                  <span>{study.clinicName}</span>
                  {study.assignedDoctorName ? (
                    <span>{study.assignedDoctorName}</span>
                  ) : null}
                </div>
              </div>
              <div className="flex shrink-0 flex-col gap-3 xl:items-end">
                <button
                  type="button"
                  onClick={() => handleStudyAction(study)}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[color:var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
                >
                  <UploadIcon className="h-4 w-4" />
                  {getActionLabel(study, sessionUser)}
                </button>
                <p className="text-xs text-slate-400">
                  Загружено {formatDateTime(study.createdAt)}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
