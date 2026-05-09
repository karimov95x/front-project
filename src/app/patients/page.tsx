"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import DatePager from "@/components/DatePager";
import EmptyState from "@/components/EmptyState";
import { ListSkeleton } from "@/components/LoadingSkeleton";
import PatientsTable from "@/components/PatientsTable";
import { PlusIcon } from "@/components/icons";
import { toast } from "@/components/Toast";
import { createStudy, getPatientsByDate } from "@/lib/backend-api";
import { getTodayKey } from "@/lib/date";
import { useSessionUser } from "@/lib/hooks";
import { studyIntakeSchema, type StudyIntakeInput } from "@/lib/validation";
import {
  modalityLabels,
  contrastOptionsByModality,
  getDefaultContrastLabel,
  studyAreaOptionsByModality,
  type PatientRow,
  type StudyModality,
} from "@/types";

const PATIENTS_PER_PAGE = 20;
const MAX_ZIP_SIZE_BYTES = 1024 * 1024 * 1024;

const inputClassName =
  "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[color:var(--color-primary)] focus:bg-white";

type ReadinessFilter =
  | "all"
  | "unassigned"
  | "assigned"
  | "completed"
  | "refused";

type ContrastFilter = "all" | "with" | "without";

type CitoFilter = "all" | "cito" | "not_cito";

function splitAreas(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function hasContrast(row: PatientRow): boolean {
  return row.details.some((detail) => detail.contrastLabel !== "Нет");
}

function hasDoctor(row: PatientRow, doctorName: string): boolean {
  return row.details.some((detail) => detail.reportingDoctor === doctorName);
}

function hasModality(row: PatientRow, modality: StudyModality): boolean {
  return row.details.some((detail) => detail.modality === modality);
}

function hasStudyArea(row: PatientRow, studyArea: string): boolean {
  return row.details.some((detail) =>
    splitAreas(detail.studyArea).includes(studyArea),
  );
}

function isCitoRow(row: PatientRow): boolean {
  return row.note === "CITO";
}

function matchesReadiness(
  row: PatientRow,
  readiness: ReadinessFilter,
): boolean {
  if (readiness === "all") {
    return true;
  }

  return row.patientStatus === readiness;
}

function shiftDay(value: string, offset: number): string {
  const current = new Date(`${value}T12:00:00`);
  current.setDate(current.getDate() + offset);
  return `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-${String(
    current.getDate(),
  ).padStart(2, "0")}`;
}

function formatFilterLabel(value: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${value}T12:00:00`));
}

function buildPageWindow(currentPage: number, totalPages: number): number[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
  return Array.from({ length: 5 }, (_, index) => start + index);
}

function CreatePatientDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (createdDay: string) => void;
}) {
  const sessionUser = useSessionUser();
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [selectedStudyAreas, setSelectedStudyAreas] = useState<string[]>([
    studyAreaOptionsByModality.MRI[0],
  ]);
  const [useCustomDeadline, setUseCustomDeadline] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<StudyIntakeInput>({
    resolver: zodResolver(studyIntakeSchema),
    defaultValues: {
      patientName: "",
      birthDate: "",
      modality: "MRI",
      studyArea: studyAreaOptionsByModality.MRI[0],
      contrastLabel: getDefaultContrastLabel("MRI"),
      note: "",
      dueDay: getTodayKey(),
      history: "",
      filesCount: 0,
      isCito: false,
    },
  });
  const modality = watch("modality");
  const contrastLabel = watch("contrastLabel");

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  useEffect(() => {
    const areaOptions = studyAreaOptionsByModality[modality];

    setSelectedStudyAreas((current) => {
      const normalizedAreas = current.filter((item) =>
        areaOptions.includes(item),
      );
      const nextAreas =
        normalizedAreas.length > 0 ? normalizedAreas : [areaOptions[0]];

      setValue("studyArea", nextAreas.join(", "), { shouldValidate: true });

      if (
        current.length === nextAreas.length &&
        current.every((item, index) => item === nextAreas[index])
      ) {
        return current;
      }

      return nextAreas;
    });

    const contrastOptions = contrastOptionsByModality[modality];

    if (
      !contrastOptions.includes(
        contrastLabel as (typeof contrastOptions)[number],
      )
    ) {
      setValue("contrastLabel", getDefaultContrastLabel(modality), {
        shouldValidate: true,
      });
    }
  }, [contrastLabel, modality, setValue]);

  const resetFormState = () => {
    reset({
      patientName: "",
      birthDate: "",
      modality: "MRI",
      studyArea: studyAreaOptionsByModality.MRI[0],
      contrastLabel: getDefaultContrastLabel("MRI"),
      note: "",
      dueDay: getTodayKey(),
      history: "",
      filesCount: 0,
      isCito: false,
    });
    setSelectedStudyAreas([studyAreaOptionsByModality.MRI[0]]);
    setUseCustomDeadline(false);
    setZipFile(null);
    setFileInputKey((current) => current + 1);
  };

  const closeDialog = () => {
    resetFormState();
    onClose();
  };

  const submit = handleSubmit(async (values) => {
    if (!sessionUser) {
      toast("Сессия клиники не найдена. Войдите заново.", "error");
      return;
    }

    if (sessionUser.role !== "CLINIC") {
      toast("Добавление пациента доступно только клинике.", "error");
      return;
    }

    if (!zipFile) {
      toast("Прикрепите ZIP-архив исследования.", "error");
      return;
    }

    if (selectedStudyAreas.length === 0) {
      toast("Выберите хотя бы одну зону исследования.", "error");
      return;
    }

    try {
      const createdStudies = await Promise.all(
        selectedStudyAreas.map((studyArea) =>
          createStudy(
            {
              ...values,
              dueDay: useCustomDeadline ? values.dueDay : getTodayKey(),
              studyArea,
              filesCount: 1,
            },
            sessionUser,
            {
              attachments: [{ name: zipFile.name }],
            },
          ),
        ),
      );

      const createdCount = createdStudies.length;
      const createdDay = createdStudies[0]?.createdDay ?? getTodayKey();

      toast(
        createdCount === 1
          ? `Исследование для пациента ${values.patientName} добавлено.`
          : `Добавлено ${createdCount} исследований для пациента ${values.patientName}.`,
        "success",
      );
      closeDialog();
      onCreated(createdDay);
    } catch (error) {
      toast(
        error instanceof Error
          ? error.message
          : "Не удалось добавить пациента.",
        "error",
      );
    }
  });

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center bg-slate-950/50 p-4"
      onClick={closeDialog}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Добавить пациента"
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[32px] border border-white/70 bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.22)] sm:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
              Клиника
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              Добавить пациента
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Заполните данные пациента, жалобы, анамнез и прикрепите ZIP-архив
              исследования до 1 ГБ.
            </p>
          </div>
          <button
            type="button"
            onClick={closeDialog}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
            aria-label="Закрыть форму добавления пациента"
          >
            ×
          </button>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Пациент
              <input
                className={inputClassName}
                placeholder="Имя и фамилия"
                {...register("patientName")}
              />
              {errors.patientName ? (
                <span className="text-xs text-rose-600">
                  {errors.patientName.message}
                </span>
              ) : null}
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Дата рождения
              <input
                type="date"
                className={inputClassName}
                {...register("birthDate")}
              />
              {errors.birthDate ? (
                <span className="text-xs text-rose-600">
                  {errors.birthDate.message}
                </span>
              ) : null}
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Жалобы
              <textarea
                rows={3}
                className={inputClassName}
                placeholder="Краткие жалобы пациента для врача"
                {...register("note")}
              />
              {errors.note ? (
                <span className="text-xs text-rose-600">
                  {errors.note.message}
                </span>
              ) : (
                <span className="text-xs text-slate-500">
                  Это поле выводится в списке пациентов как краткое описание
                  жалоб.
                </span>
              )}
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Анамнез
              <textarea
                rows={3}
                className={inputClassName}
                placeholder="Клиническая картина, динамика, важные уточнения"
                {...register("history")}
              />
              {errors.history ? (
                <span className="text-xs text-rose-600">
                  {errors.history.message}
                </span>
              ) : null}
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="space-y-2 text-sm font-medium text-slate-700 lg:col-span-1">
              Модальность
              <select className={inputClassName} {...register("modality")}>
                <option value="MRI">МРТ</option>
                <option value="CT">КТ</option>
              </select>
            </label>
            <div className="space-y-2 text-sm font-medium text-slate-700 lg:col-span-2">
              Зона исследования
              <div className="grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2">
                {studyAreaOptionsByModality[modality].map((option) => {
                  const checked = selectedStudyAreas.includes(option);

                  return (
                    <label
                      key={option}
                      className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${
                        checked
                          ? "bg-[color:var(--color-primary-soft)] text-slate-900"
                          : "bg-white text-slate-600"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          const nextAreas = checked
                            ? selectedStudyAreas.filter(
                                (item) => item !== option,
                              )
                            : [...selectedStudyAreas, option];

                          setSelectedStudyAreas(nextAreas);
                          setValue("studyArea", nextAreas.join(", "), {
                            shouldValidate: true,
                          });
                        }}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                      <span>{option}</span>
                    </label>
                  );
                })}
              </div>
              <input type="hidden" {...register("studyArea")} />
              {errors.studyArea ? (
                <span className="text-xs text-rose-600">
                  {errors.studyArea.message}
                </span>
              ) : null}
            </div>
            <label className="space-y-2 text-sm font-medium text-slate-700 lg:col-span-1">
              Контраст
              <select className={inputClassName} {...register("contrastLabel")}>
                {contrastOptionsByModality[modality].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="space-y-3 rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
            <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={useCustomDeadline}
                onChange={(event) => setUseCustomDeadline(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              Указать дедлайн заключения
            </label>

            {useCustomDeadline ? (
              <label className="space-y-2 text-sm font-medium text-slate-700">
                Дата дедлайна
                <input
                  type="date"
                  className={inputClassName}
                  {...register("dueDay")}
                />
                {errors.dueDay ? (
                  <span className="text-xs text-rose-600">
                    {errors.dueDay.message}
                  </span>
                ) : null}
              </label>
            ) : (
              <p className="text-sm text-slate-500">
                Без отдельного дедлайна запись будет создана с датой по
                умолчанию.
              </p>
            )}
          </div>

          <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-4 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  ZIP-архив исследования
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Принимается один ZIP-файл размером до 1 ГБ.
                </p>
              </div>
              <label className="inline-flex cursor-pointer items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">
                Выбрать ZIP
                <input
                  key={fileInputKey}
                  type="file"
                  accept=".zip,application/zip"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;

                    if (!file) {
                      setZipFile(null);
                      setValue("filesCount", 0, { shouldValidate: true });
                      return;
                    }

                    if (!file.name.toLowerCase().endsWith(".zip")) {
                      toast("Можно прикрепить только ZIP-архив.", "error");
                      event.target.value = "";
                      setZipFile(null);
                      setValue("filesCount", 0, { shouldValidate: true });
                      return;
                    }

                    if (file.size > MAX_ZIP_SIZE_BYTES) {
                      toast(
                        "ZIP-архив превышает лимит 1 ГБ. Выберите файл меньше.",
                        "error",
                      );
                      event.target.value = "";
                      setZipFile(null);
                      setValue("filesCount", 0, { shouldValidate: true });
                      return;
                    }

                    setZipFile(file);
                    setValue("filesCount", 1, { shouldValidate: true });
                  }}
                />
              </label>
            </div>

            <input
              type="hidden"
              {...register("filesCount", { valueAsNumber: true })}
            />

            {zipFile ? (
              <div className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm text-slate-600">
                {zipFile.name} · {(zipFile.size / (1024 * 1024)).toFixed(1)} МБ
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">
                ZIP-архив пока не выбран.
              </p>
            )}

            {errors.filesCount ? (
              <p className="mt-3 text-xs text-rose-600">
                {errors.filesCount.message}
              </p>
            ) : null}
          </div>

          <label className="flex items-center gap-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-rose-300"
              {...register("isCito")}
            />
            Отметить как CITO
          </label>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={closeDialog}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-full bg-[color:var(--color-primary)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Сохраняем..." : "Добавить пациента"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default function PatientsPage() {
  const sessionUser = useSessionUser();
  const [selectedDay, setSelectedDay] = useState(getTodayKey());
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedModality, setSelectedModality] = useState<
    "all" | StudyModality
  >("all");
  const [selectedStudyArea, setSelectedStudyArea] = useState("all");
  const [selectedContrast, setSelectedContrast] =
    useState<ContrastFilter>("all");
  const [selectedDoctor, setSelectedDoctor] = useState("all");
  const [selectedCito, setSelectedCito] = useState<CitoFilter>("all");
  const [selectedReadiness, setSelectedReadiness] =
    useState<ReadinessFilter>("all");

  const updateSelectedDay = (nextDay: string) => {
    setLoading(true);
    setSelectedDay(nextDay);
    setPage(1);
  };

  useEffect(() => {
    let active = true;

    getPatientsByDate(selectedDay)
      .then((data) => {
        if (active) {
          setPatients(data);
        }
      })
      .catch((error) => {
        if (active) {
          setPatients([]);
        }

        toast(
          error instanceof Error
            ? error.message
            : "Не удалось загрузить список пациентов.",
          "error",
        );
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [refreshKey, selectedDay]);

  const headerLabel = useMemo(
    () => formatFilterLabel(selectedDay),
    [selectedDay],
  );
  const availableDoctors = useMemo(() => {
    return [
      ...new Set(
        patients
          .flatMap((patient) =>
            patient.details.map((detail) => detail.reportingDoctor),
          )
          .filter((doctor) => doctor && doctor !== "Не назначен"),
      ),
    ].sort((left, right) => left.localeCompare(right, "ru"));
  }, [patients]);
  const availableStudyAreas = useMemo(() => {
    return [
      ...new Set(
        patients.flatMap((patient) =>
          patient.details.flatMap((detail) => splitAreas(detail.studyArea)),
        ),
      ),
    ].sort((left, right) => left.localeCompare(right, "ru"));
  }, [patients]);
  const filteredPatients = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return patients.filter((patient) => {
      if (
        normalizedQuery.length > 0 &&
        !patient.patientName.toLowerCase().includes(normalizedQuery)
      ) {
        return false;
      }

      if (
        selectedModality !== "all" &&
        !hasModality(patient, selectedModality)
      ) {
        return false;
      }

      if (
        selectedStudyArea !== "all" &&
        !hasStudyArea(patient, selectedStudyArea)
      ) {
        return false;
      }

      if (selectedContrast === "with" && !hasContrast(patient)) {
        return false;
      }

      if (selectedContrast === "without" && hasContrast(patient)) {
        return false;
      }

      if (selectedDoctor !== "all" && !hasDoctor(patient, selectedDoctor)) {
        return false;
      }

      if (selectedCito === "cito" && !isCitoRow(patient)) {
        return false;
      }

      if (selectedCito === "not_cito" && isCitoRow(patient)) {
        return false;
      }

      return matchesReadiness(patient, selectedReadiness);
    });
  }, [
    patients,
    searchQuery,
    selectedCito,
    selectedContrast,
    selectedDoctor,
    selectedModality,
    selectedReadiness,
    selectedStudyArea,
  ]);
  const totalPages = Math.max(
    1,
    Math.ceil(filteredPatients.length / PATIENTS_PER_PAGE),
  );
  const currentPage = Math.min(page, totalPages);
  const visiblePatients = useMemo(() => {
    const start = (currentPage - 1) * PATIENTS_PER_PAGE;
    return filteredPatients.slice(start, start + PATIENTS_PER_PAGE);
  }, [currentPage, filteredPatients]);
  const pageWindow = useMemo(
    () => buildPageWindow(currentPage, totalPages),
    [currentPage, totalPages],
  );

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [
    searchQuery,
    selectedCito,
    selectedContrast,
    selectedDoctor,
    selectedModality,
    selectedReadiness,
    selectedStudyArea,
  ]);

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedModality("all");
    setSelectedStudyArea("all");
    setSelectedContrast("all");
    setSelectedDoctor("all");
    setSelectedCito("all");
    setSelectedReadiness("all");
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 rounded-[28px] border border-white/70 bg-white/85 p-4 shadow-[0_18px_45px_rgba(84,106,149,0.08)] sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-slate-500">
          <p className="text-sm font-medium text-slate-900">Все пациенты</p>
          <p className="mt-1">
            {loading
              ? "Загрузка..."
              : `${filteredPatients.length} пациентов · страница ${currentPage} из ${totalPages}`}
          </p>
        </div>
        {sessionUser?.role === "CLINIC" ? (
          <button
            type="button"
            onClick={() => setIsCreateDialogOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[color:var(--color-primary)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
          >
            <PlusIcon className="h-4 w-4" />
            Добавить пациента
          </button>
        ) : null}
      </div>

      <DatePager
        label={headerLabel}
        onPrevious={() => updateSelectedDay(shiftDay(selectedDay, -1))}
        onNext={() => updateSelectedDay(shiftDay(selectedDay, 1))}
        onToday={() => updateSelectedDay(getTodayKey())}
      />

      <section className="rounded-[28px] border border-white/70 bg-white/85 p-4 shadow-[0_18px_45px_rgba(84,106,149,0.08)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-900">Фильтры</p>
            <p className="mt-1 text-sm text-slate-500">
              Поиск по ФИО, модальности, зонам, контрасту, врачу, CITO и статусу
              готовности.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsFiltersOpen((value) => !value)}
              aria-expanded={isFiltersOpen}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              {isFiltersOpen ? "Свернуть фильтры" : "Показать фильтры"}
            </button>
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Сбросить
            </button>
          </div>
        </div>

        <div
          className={`${isFiltersOpen ? "mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4" : "hidden"}`}
        >
          <label className="space-y-2 text-sm font-medium text-slate-700 xl:col-span-2">
            Поиск по ФИО пациента
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className={inputClassName}
              placeholder="Введите фамилию и имя"
            />
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700">
            Модальность
            <select
              value={selectedModality}
              onChange={(event) =>
                setSelectedModality(event.target.value as "all" | StudyModality)
              }
              className={inputClassName}
            >
              <option value="all">Все</option>
              <option value="MRI">{modalityLabels.MRI}</option>
              <option value="CT">{modalityLabels.CT}</option>
            </select>
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700">
            Зона исследования
            <select
              value={selectedStudyArea}
              onChange={(event) => setSelectedStudyArea(event.target.value)}
              className={inputClassName}
            >
              <option value="all">Все</option>
              {availableStudyAreas.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700">
            Контраст
            <select
              value={selectedContrast}
              onChange={(event) =>
                setSelectedContrast(event.target.value as ContrastFilter)
              }
              className={inputClassName}
            >
              <option value="all">Все</option>
              <option value="with">С контрастом</option>
              <option value="without">Без контраста</option>
            </select>
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700">
            Врач
            <select
              value={selectedDoctor}
              onChange={(event) => setSelectedDoctor(event.target.value)}
              className={inputClassName}
            >
              <option value="all">Все</option>
              {availableDoctors.map((doctor) => (
                <option key={doctor} value={doctor}>
                  {doctor}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700">
            CITO
            <select
              value={selectedCito}
              onChange={(event) =>
                setSelectedCito(event.target.value as CitoFilter)
              }
              className={inputClassName}
            >
              <option value="all">Все</option>
              <option value="cito">Только CITO</option>
              <option value="not_cito">Без CITO</option>
            </select>
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700">
            Готовность
            <select
              value={selectedReadiness}
              onChange={(event) =>
                setSelectedReadiness(event.target.value as ReadinessFilter)
              }
              className={inputClassName}
            >
              <option value="all">Все</option>
              <option value="unassigned">Не распределенные</option>
              <option value="assigned">В процессе описания</option>
              <option value="completed">Готовые</option>
              <option value="refused">Отказные</option>
            </select>
          </label>
        </div>
      </section>

      {loading ? (
        <ListSkeleton rows={4} />
      ) : filteredPatients.length === 0 ? (
        <EmptyState
          title="Пациенты по выбранным фильтрам не найдены"
          description="Измените дату или параметры фильтрации, чтобы увидеть подходящих пациентов и исследования."
        />
      ) : (
        <>
          <PatientsTable
            rows={visiblePatients}
            onRowsChanged={() => setRefreshKey((value) => value + 1)}
          />
          <div className="flex flex-col gap-3 rounded-[24px] border border-white/70 bg-white/80 px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
            <p>
              Показаны {visiblePatients.length} из {filteredPatients.length}{" "}
              пациентов.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                className="rounded-full border border-slate-200 px-3 py-2 font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Назад
              </button>
              {pageWindow.map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => setPage(pageNumber)}
                  className={`rounded-full px-3 py-2 font-medium transition ${
                    pageNumber === currentPage
                      ? "bg-[color:var(--color-primary)] text-white"
                      : "border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {pageNumber}
                </button>
              ))}
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() =>
                  setPage((value) => Math.min(totalPages, value + 1))
                }
                className="rounded-full border border-slate-200 px-3 py-2 font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Вперед
              </button>
            </div>
          </div>
        </>
      )}

      <CreatePatientDialog
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onCreated={(createdDay) => {
          setSelectedDay(createdDay);
          setPage(1);
          setRefreshKey((value) => value + 1);
        }}
      />
    </div>
  );
}
