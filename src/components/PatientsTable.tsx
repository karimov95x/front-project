"use client";

import { useEffect, useRef, useState } from "react";
import { CloseIcon, FileIcon, UploadIcon } from "@/components/icons";
import {
  completeStudy,
  releaseStudy,
  reopenStudy,
  takeStudy,
} from "@/lib/backend-api";
import { toast } from "@/components/Toast";
import { useSessionUser } from "@/lib/hooks";
import { formatDateTime, modalityLabels, type PatientRow } from "@/types";

const rowToneClassNames: Record<PatientRow["patientStatus"], string> = {
  unassigned: "bg-white",
  assigned: "bg-sky-50/80",
  completed: "bg-emerald-50/80",
  refused: "bg-rose-50/80",
};

type ColumnKey =
  | "createdAt"
  | "patientName"
  | "birthYear"
  | "studiesCount"
  | "studyAreas"
  | "contrastLabel"
  | "reportingDoctor"
  | "note"
  | "conclusion";

const columnMeta: Array<{
  key: ColumnKey;
  label: string;
  min: number;
  max: number;
}> = [
  { key: "createdAt", label: "Дата/время", min: 110, max: 260 },
  { key: "patientName", label: "Пациент", min: 140, max: 360 },
  { key: "birthYear", label: "Год", min: 60, max: 160 },
  { key: "studiesCount", label: "Исследования", min: 70, max: 180 },
  { key: "studyAreas", label: "Зоны", min: 180, max: 420 },
  { key: "contrastLabel", label: "Контраст", min: 120, max: 240 },
  { key: "reportingDoctor", label: "Врач", min: 120, max: 320 },
  { key: "note", label: "Примечание", min: 140, max: 220 },
  { key: "conclusion", label: "Заключение", min: 180, max: 360 },
];

const defaultWidths: Record<ColumnKey, number> = {
  createdAt: 132,
  patientName: 188,
  birthYear: 84,
  studiesCount: 84,
  studyAreas: 250,
  contrastLabel: 160,
  reportingDoctor: 200,
  note: 160,
  conclusion: 240,
};

interface PatientsTableProps {
  rows: PatientRow[];
  onRowsChanged?: () => void;
}

function clampWidth(key: ColumnKey, value: number): number {
  const column = columnMeta.find((item) => item.key === key);

  if (!column || Number.isNaN(value)) {
    return defaultWidths[key];
  }

  return Math.min(column.max, Math.max(column.min, value));
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2 border-b border-slate-100 py-3 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-4">
      <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </dt>
      <dd className="min-w-0 text-sm leading-6 text-slate-700">{children}</dd>
    </div>
  );
}

function createEmptyZipBlob(): Blob {
  return new Blob(
    [
      new Uint8Array([
        0x50, 0x4b, 0x05, 0x06, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      ]),
    ],
    { type: "application/zip" },
  );
}

function createEmptyPdfBlob(): Blob {
  return new Blob(["%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF"], {
    type: "application/pdf",
  });
}

function getRowConclusionLabel(row: PatientRow): string {
  return row.details.every((detail) => detail.status === "ready")
    ? "Готово"
    : "Не готово";
}

function isRowReady(row: PatientRow): boolean {
  return row.details.every((detail) => detail.status === "ready");
}

export default function PatientsTable({
  rows,
  onRowsChanged,
}: PatientsTableProps) {
  const sessionUser = useSessionUser();
  const [columnWidths, setColumnWidths] = useState(defaultWidths);
  const [isResizing, setIsResizing] = useState(false);
  const [selectedRow, setSelectedRow] = useState<PatientRow | null>(null);
  const [busyRowId, setBusyRowId] = useState<string | null>(null);
  const [clinicArchives, setClinicArchives] = useState<Record<string, string>>(
    {},
  );
  const dragStateRef = useRef<{
    key: ColumnKey;
    startX: number;
    startWidth: number;
  } | null>(null);
  const cleanupResizeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      cleanupResizeRef.current?.();
    };
  }, []);

  useEffect(() => {
    if (!selectedRow || typeof window === "undefined") {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedRow(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedRow]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    if (isResizing) {
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      return () => {
        document.body.style.removeProperty("cursor");
        document.body.style.removeProperty("user-select");
      };
    }

    document.body.style.removeProperty("cursor");
    document.body.style.removeProperty("user-select");
  }, [isResizing]);

  const stopResize = () => {
    cleanupResizeRef.current?.();
    cleanupResizeRef.current = null;
    dragStateRef.current = null;
    setIsResizing(false);
  };

  const resetColumnWidth = (key: ColumnKey) => {
    setColumnWidths((current) => ({
      ...current,
      [key]: defaultWidths[key],
    }));
  };

  const startResize = (
    key: ColumnKey,
    event: React.MouseEvent<HTMLDivElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    stopResize();

    dragStateRef.current = {
      key,
      startX: event.clientX,
      startWidth: columnWidths[key],
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dragState = dragStateRef.current;

      if (!dragState) {
        return;
      }

      const nextWidth = clampWidth(
        dragState.key,
        dragState.startWidth + (moveEvent.clientX - dragState.startX),
      );

      setColumnWidths((current) => ({
        ...current,
        [dragState.key]: nextWidth,
      }));
    };

    const handleMouseUp = () => {
      stopResize();
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    cleanupResizeRef.current = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    setIsResizing(true);
  };

  const cellClassName =
    "border-r border-t border-slate-200 px-3 py-2 whitespace-normal break-words text-[13px] leading-5";
  const textWrapClassName = "whitespace-normal break-words";
  const activeArchiveName = selectedRow
    ? (clinicArchives[selectedRow.patientId] ?? selectedRow.archiveFileName)
    : "";

  const refreshRows = () => {
    onRowsChanged?.();
  };

  const downloadArchive = (fileName: string) => {
    const blob = createEmptyZipBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast(`Архив ${fileName} подготовлен к скачиванию.`, "success");
  };

  const downloadPdf = (fileName: string) => {
    const blob = createEmptyPdfBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast(`Файл ${fileName} подготовлен к скачиванию.`, "success");
  };

  const handleArchiveUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file || !selectedRow) {
      return;
    }

    setClinicArchives((current) => ({
      ...current,
      [selectedRow.patientId]: file.name,
    }));
    toast(`Архив ${file.name} загружен в карточку пациента.`, "success");
    event.target.value = "";
  };

  const handleDoctorAssign = async (row: PatientRow) => {
    if (!sessionUser || sessionUser.role !== "DOCTOR" || busyRowId === row.id) {
      return;
    }

    const freeStudies = row.details.filter((detail) => detail.status === "new");

    if (row.patientStatus !== "unassigned" || freeStudies.length === 0) {
      return;
    }

    const confirmed = window.confirm(
      `Вы уверены, что хотите выбрать пациента ${row.patientName}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setBusyRowId(row.id);
      await Promise.all(freeStudies.map((detail) => takeStudy(detail.studyId)));
      toast(`Пациент ${row.patientName} назначен вам.`, "success");
      refreshRows();
    } catch (error) {
      toast(
        error instanceof Error
          ? error.message
          : "Не удалось назначить пациента.",
        "error",
      );
    } finally {
      setBusyRowId(null);
    }
  };

  const handleDoctorRelease = async (row: PatientRow) => {
    if (!sessionUser || sessionUser.role !== "DOCTOR" || busyRowId === row.id) {
      return;
    }

    const ownAssignedStudies = row.details.filter(
      (detail) =>
        detail.assignedDoctorId === sessionUser.id &&
        detail.status === "in_progress",
    );

    if (ownAssignedStudies.length === 0) {
      return;
    }

    const confirmed = window.confirm(
      `Вы уверены, что хотите снять пациента ${row.patientName} со своей очереди?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setBusyRowId(row.id);
      await Promise.all(
        ownAssignedStudies.map((detail) => releaseStudy(detail.studyId)),
      );
      toast(`Пациент ${row.patientName} снят с вашей очереди.`, "success");
      refreshRows();
    } catch (error) {
      toast(
        error instanceof Error
          ? error.message
          : "Не удалось снять пациента с очереди.",
        "error",
      );
    } finally {
      setBusyRowId(null);
    }
  };

  const handleConclusionUpload = async (row: PatientRow, file: File | null) => {
    if (!file || !sessionUser || sessionUser.role !== "DOCTOR") {
      return;
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      toast("Можно выбрать только PDF-файл.", "error");
      return;
    }

    const ownStudies = row.details.filter(
      (detail) => detail.assignedDoctorId === sessionUser.id,
    );
    const studiesToComplete = ownStudies.filter(
      (detail) => detail.status === "in_progress",
    );

    if (studiesToComplete.length === 0) {
      toast(
        "Вы можете загрузить заключение только для своих пациентов в работе.",
        "error",
      );
      return;
    }

    try {
      setBusyRowId(row.id);
      await Promise.all(
        studiesToComplete.map((detail) =>
          completeStudy(detail.studyId, file.name, sessionUser.id),
        ),
      );
      toast(`Заключение пациента ${row.patientName} загружено.`, "success");
      refreshRows();
    } catch (error) {
      toast(
        error instanceof Error
          ? error.message
          : "Не удалось загрузить заключение.",
        "error",
      );
    } finally {
      setBusyRowId(null);
    }
  };

  const handleConclusionRollback = async (row: PatientRow) => {
    if (!sessionUser || sessionUser.role !== "DOCTOR") {
      return;
    }

    const ownCompletedStudies = row.details.filter(
      (detail) =>
        detail.assignedDoctorId === sessionUser.id && detail.status === "ready",
    );

    if (ownCompletedStudies.length === 0) {
      toast(
        "Вы можете откатить заключение только для своих завершенных исследований.",
        "error",
      );
      return;
    }

    const confirmed = window.confirm(
      `Вы уверены, что хотите удалить заключение пациента ${row.patientName}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setBusyRowId(row.id);
      await Promise.all(
        ownCompletedStudies.map((detail) => reopenStudy(detail.studyId)),
      );
      toast(`Заключение пациента ${row.patientName} удалено.`, "success");
      refreshRows();
    } catch (error) {
      toast(
        error instanceof Error
          ? error.message
          : "Не удалось удалить заключение.",
        "error",
      );
    } finally {
      setBusyRowId(null);
    }
  };

  const renderDoctorCell = (row: PatientRow) => {
    const isBusy = busyRowId === row.id;
    const isOwnAssigned = row.details.some(
      (detail) =>
        detail.assignedDoctorId === sessionUser?.id &&
        detail.status === "in_progress",
    );

    if (sessionUser?.role !== "DOCTOR") {
      return (
        <div className={textWrapClassName} title={row.reportingDoctor}>
          {row.reportingDoctor}
        </div>
      );
    }

    if (row.patientStatus === "unassigned") {
      return (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-slate-500">Не назначен</span>
          <button
            type="button"
            disabled={isBusy}
            onClick={(event) => {
              event.stopPropagation();
              void handleDoctorAssign(row);
            }}
            className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
          >
            Выбрать
          </button>
        </div>
      );
    }

    return (
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={textWrapClassName} title={row.reportingDoctor}>
          {row.reportingDoctor}
        </span>
        {isOwnAssigned ? (
          <button
            type="button"
            disabled={isBusy}
            onClick={(event) => {
              event.stopPropagation();
              void handleDoctorRelease(row);
            }}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-rose-600 text-white transition hover:bg-rose-500 disabled:opacity-50"
            title="Отменить выбор пациента"
            aria-label="Отменить выбор пациента"
          >
            <CloseIcon className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>
    );
  };

  const renderConclusionCell = (row: PatientRow) => {
    const isBusy = busyRowId === row.id;
    const isReady = isRowReady(row);
    const isOwnAssigned = row.details.some(
      (detail) => detail.assignedDoctorId === sessionUser?.id,
    );

    if (sessionUser?.role === "DOCTOR") {
      if (isReady && isOwnAssigned) {
        return (
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
              Готово
            </span>
            <button
              type="button"
              disabled={isBusy}
              onClick={() => void handleConclusionRollback(row)}
              className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-50"
            >
              Удалить файл
            </button>
          </div>
        );
      }

      if (isOwnAssigned) {
        return (
          <label className="inline-flex cursor-pointer items-center justify-center rounded-full bg-slate-900 p-2 text-white transition hover:bg-slate-800">
            <UploadIcon className="h-4 w-4" />
            <span className="sr-only">Загрузить PDF</span>
            <input
              type="file"
              accept=".pdf,application/pdf"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                void handleConclusionUpload(row, file);
                event.target.value = "";
              }}
            />
          </label>
        );
      }

      return <span className="text-xs text-slate-500">Не готово</span>;
    }

    if (isReady) {
      return (
        <>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
            Готово
          </span>
          <button
            type="button"
            onClick={() => {
              const fileName =
                row.details.find((detail) => detail.conclusionFileName)
                  ?.conclusionFileName ?? `${row.patientId}.pdf`;
              downloadPdf(fileName);
            }}
            className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800"
          >
            <FileIcon className="h-3.5 w-3.5" />
            Скачать
          </button>
        </>
      );
    }

    return <span className="text-xs text-slate-500">Не готово</span>;
  };

  return (
    <>
      <div className="max-h-[calc(100vh-270px)] overflow-auto border border-slate-200 bg-white">
        <table className="w-full min-w-[1300px] table-fixed border-collapse text-[13px] leading-5">
          <colgroup>
            {columnMeta.map((column) => (
              <col
                key={column.key}
                style={{ width: `${columnWidths[column.key]}px` }}
              />
            ))}
          </colgroup>
          <thead className="sticky top-0 z-10 bg-white text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
            <tr>
              {columnMeta.map((column, index) => (
                <th
                  key={column.key}
                  className={`border-b border-slate-200 px-0 py-0 ${index < columnMeta.length - 1 ? "border-r" : ""}`}
                >
                  <div className="relative px-2 py-1.5 pr-4">
                    {column.label}
                    <div
                      role="separator"
                      aria-orientation="vertical"
                      aria-label={`Изменить ширину столбца ${column.label}`}
                      title="Тяните мышкой для изменения ширины. Двойной клик сбрасывает ширину."
                      onMouseDown={(event) => startResize(column.key, event)}
                      onDoubleClick={() => resetColumnWidth(column.key)}
                      className="absolute inset-y-0 right-0 w-3 cursor-col-resize touch-none"
                    >
                      <span className="absolute bottom-1 top-1 right-1 w-px bg-slate-300" />
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className={`align-top text-slate-700 transition-colors hover:bg-slate-100/70 ${rowToneClassNames[row.patientStatus]}`}
              >
                <td className={`${cellClassName} text-slate-900`}>
                  {formatDateTime(row.createdAt)}
                </td>
                <td className={`${cellClassName} font-medium text-slate-900`}>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelectedRow(row);
                    }}
                    className={`text-left ${textWrapClassName} underline-offset-2 transition hover:text-[color:var(--color-primary)] hover:underline`}
                    title="Открыть подробности пациента"
                  >
                    {row.patientName}
                  </button>
                </td>
                <td className={cellClassName}>{row.birthYear}</td>
                <td className={cellClassName}>{row.studiesCount}</td>
                <td className={cellClassName}>
                  <div
                    className={textWrapClassName}
                    title={row.studyAreas.join(", ")}
                  >
                    {row.studyAreas.join(", ")}
                  </div>
                </td>
                <td className={cellClassName}>{row.contrastLabel}</td>
                <td className={cellClassName}>{renderDoctorCell(row)}</td>
                <td className="border-r border-t border-slate-200 px-3 py-2 text-[13px] leading-5 text-slate-500 whitespace-normal break-words">
                  <div className={textWrapClassName} title={row.note || ""}>
                    {row.note || ""}
                  </div>
                </td>
                <td className="border-t border-slate-200 px-3 py-2 text-[13px] leading-5 text-slate-600 whitespace-normal break-words">
                  <div className="flex flex-wrap items-center gap-2">
                    {renderConclusionCell(row)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedRow ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/45 p-4"
          onClick={() => setSelectedRow(null)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label={`Подробности пациента ${selectedRow.patientName}`}
            className="flex max-h-[70vh] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] border border-white/70 bg-white p-5 shadow-[0_30px_80px_rgba(15,23,42,0.22)] sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
                  Карточка пациента
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-900">
                  {selectedRow.patientName}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedRow.patientId} · {selectedRow.studiesCount}{" "}
                  исследований
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRow(null)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
                aria-label="Закрыть окно пациента"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            <dl className="mt-5 overflow-y-auto pr-1">
              <DetailRow label="Дата/время">
                {formatDateTime(selectedRow.createdAt)}
              </DetailRow>
              <DetailRow label="Пациент">{selectedRow.patientName}</DetailRow>
              <DetailRow label="Год рождения">
                {selectedRow.birthYear}
              </DetailRow>
              <DetailRow label="Исследования">
                {selectedRow.studiesCount}
              </DetailRow>
              <DetailRow label="Статус">
                {selectedRow.patientStatus === "completed"
                  ? "Завершенный"
                  : selectedRow.patientStatus === "refused"
                    ? "Отказной"
                    : selectedRow.patientStatus === "assigned"
                      ? "Назначен врач"
                      : "Не назначенный"}
              </DetailRow>
              <DetailRow label="Зоны">
                {selectedRow.studyAreas.join(", ")}
              </DetailRow>
              <DetailRow label="Контраст">
                {selectedRow.contrastLabel}
              </DetailRow>
              <DetailRow label="Врач">{selectedRow.reportingDoctor}</DetailRow>
              <DetailRow label="Примечание">{selectedRow.note || ""}</DetailRow>
              <DetailRow label="Заключение">
                {getRowConclusionLabel(selectedRow)}
              </DetailRow>
              <DetailRow label="Жалобы">
                {selectedRow.complaintsSummary}
              </DetailRow>
              <DetailRow label="Анамнез">
                {selectedRow.historySummary}
              </DetailRow>
              <DetailRow label="Состав исследований">
                <div className="space-y-2">
                  {selectedRow.details.map((detail) => (
                    <div
                      key={detail.studyId}
                      className="rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-600"
                    >
                      {detail.studyId} · {modalityLabels[detail.modality]} ·{" "}
                      {detail.studyArea} · {detail.contrastLabel} ·{" "}
                      {detail.reportingDoctor}
                    </div>
                  ))}
                </div>
              </DetailRow>
              <DetailRow label="Архив ZIP">
                {sessionUser?.role === "CLINIC" ? (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
                      Текущий архив: {activeArchiveName}
                    </div>
                    <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-[color:var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110">
                      <UploadIcon className="h-4 w-4" />
                      Загрузить ZIP
                      <input
                        type="file"
                        accept=".zip"
                        className="sr-only"
                        onChange={handleArchiveUpload}
                      />
                    </label>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => downloadArchive(activeArchiveName)}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    <FileIcon className="h-4 w-4" />
                    Скачать {activeArchiveName}
                  </button>
                )}
              </DetailRow>
            </dl>
          </section>
        </div>
      ) : null}
    </>
  );
}
