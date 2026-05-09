"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { createStudy } from "@/lib/backend-api";
import { getTodayKey } from "@/lib/date";
import { studyIntakeSchema, type StudyIntakeInput } from "@/lib/validation";
import { toast } from "@/components/Toast";
import { PlusIcon } from "@/components/icons";
import {
  contrastOptionsByModality,
  getDefaultContrastLabel,
  studyAreaOptionsByModality,
  type SessionUser,
  type Study,
} from "@/types";

interface IntakeFormProps {
  sessionUser: SessionUser | null;
  onCreated: (study: Study) => void;
}

const inputClassName =
  "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[color:var(--color-primary)] focus:bg-white";

export default function IntakeForm({
  sessionUser,
  onCreated,
}: IntakeFormProps) {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [fileInputKey, setFileInputKey] = useState(0);
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
  const studyArea = watch("studyArea");
  const contrastLabel = watch("contrastLabel");

  useEffect(() => {
    const areaOptions = studyAreaOptionsByModality[modality];

    if (!areaOptions.includes(studyArea)) {
      setValue("studyArea", areaOptions[0], { shouldValidate: true });
    }

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
  }, [contrastLabel, modality, setValue, studyArea]);

  const submit = handleSubmit(async (values) => {
    try {
      const createdStudy = await createStudy(values, sessionUser);
      onCreated(createdStudy);
      toast(`Исследование ${createdStudy.id} добавлено в очередь.`, "success");
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
      setSelectedFiles([]);
      setFileInputKey((current) => current + 1);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Не удалось добавить исследование.";
      toast(message, "error");
    }
  });

  return (
    <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_18px_45px_rgba(84,106,149,0.10)]">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-[color:var(--color-primary-soft)] p-3 text-[color:var(--color-primary)]">
          <PlusIcon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Добавить исследование
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Клиника создает карточку пациента, загружает файлы и сразу задает
            дедлайн. Врач увидит запись в общей очереди.
          </p>
        </div>
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
            Модальность
            <select className={inputClassName} {...register("modality")}>
              <option value="MRI">МРТ</option>
              <option value="CT">КТ</option>
            </select>
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            Зона исследования
            <select className={inputClassName} {...register("studyArea")}>
              {studyAreaOptionsByModality[modality].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {errors.studyArea ? (
              <span className="text-xs text-rose-600">
                {errors.studyArea.message}
              </span>
            ) : null}
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-slate-700">
            Примечание
            <input
              className={inputClassName}
              placeholder="Короткое примечание для врача"
              {...register("note")}
            />
            {errors.note ? (
              <span className="text-xs text-rose-600">
                {errors.note.message}
              </span>
            ) : null}
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            Дедлайн
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
        </div>

        <label className="space-y-2 text-sm font-medium text-slate-700">
          Контраст
          <select className={inputClassName} {...register("contrastLabel")}>
            {contrastOptionsByModality[modality].map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {errors.contrastLabel ? (
            <span className="text-xs text-rose-600">
              {errors.contrastLabel.message}
            </span>
          ) : (
            <span className="text-xs text-slate-500">
              Для МРТ доступны Гадовист 7,5 мл или Омнискан 15 мл, для КТ -
              Ультравист 100 мл.
            </span>
          )}
        </label>

        <label className="space-y-2 text-sm font-medium text-slate-700">
          Анамнез
          <textarea
            rows={5}
            className={inputClassName}
            placeholder="Клиническая картина, жалобы, важные уточнения для врача."
            {...register("history")}
          />
          {errors.history ? (
            <span className="text-xs text-rose-600">
              {errors.history.message}
            </span>
          ) : null}
        </label>

        <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-4 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Файлы исследования
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Прикрепите DICOM-архивы, PDF-направление или скриншоты. Для демо
                сохраняется только количество файлов.
              </p>
            </div>
            <label className="inline-flex cursor-pointer items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">
              Выбрать файлы
              <input
                key={fileInputKey}
                type="file"
                multiple
                accept=".zip,.dcm,.pdf,.jpg,.png"
                className="sr-only"
                onChange={(event) => {
                  const files = Array.from(event.target.files ?? []);
                  setSelectedFiles(files.map((file) => file.name));
                  setValue("filesCount", files.length, {
                    shouldValidate: true,
                  });
                }}
              />
            </label>
          </div>

          <input
            type="hidden"
            {...register("filesCount", { valueAsNumber: true })}
          />

          {selectedFiles.length > 0 ? (
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              {selectedFiles.map((fileName) => (
                <li
                  key={fileName}
                  className="truncate rounded-2xl bg-white px-3 py-2"
                >
                  {fileName}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-slate-500">
              Файлы пока не выбраны.
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
          Отметить как CITO и визуально выделить в очереди
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex w-full items-center justify-center rounded-full bg-[color:var(--color-primary)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Сохраняем..." : "Создать исследование"}
        </button>
      </form>
    </section>
  );
}
