"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "@/components/Toast";
import { saveSessionUser } from "@/lib/auth";
import { registerUser } from "@/lib/backend-api";
import { registerSchema, type RegisterInput } from "@/lib/validation";

const inputClassName =
  "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[color:var(--color-primary)] focus:bg-white";

export default function RegisterPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      organization: "",
      email: "",
      role: "CLINIC",
      password: "",
      confirmPassword: "",
    },
  });

  const submit = handleSubmit(async (values) => {
    try {
      const user = await registerUser(values);
      saveSessionUser(user);
      toast(`Профиль ${user.fullName} создан.`, "success");
      startTransition(() => {
        router.push("/");
        router.refresh();
      });
    } catch (error) {
      toast(
        error instanceof Error ? error.message : "Не удалось создать профиль.",
        "error",
      );
    }
  });

  return (
    <div className="grid min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(210,227,252,0.95),transparent_30%),linear-gradient(180deg,#eef3fb_0%,#f7f9fc_100%)] lg:grid-cols-[0.95fr_1.05fr]">
      <section className="hidden px-10 py-12 lg:flex lg:flex-col lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[color:var(--color-primary)]">
            Регистрация
          </p>
          <h1 className="mt-4 max-w-xl font-[family:var(--font-display)] text-5xl font-semibold text-slate-900">
            Подключите клинику или врача к общей витрине исследований.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-slate-600">
            В форме есть клиентская и серверная валидация на базе Zod. После
            регистрации профиль сразу сохраняется в backend и открывает доступ в
            интерфейс.
          </p>
        </div>

        <div className="rounded-[32px] bg-white/70 p-6 shadow-[0_24px_50px_rgba(72,98,137,0.14)]">
          <p className="text-sm font-semibold text-slate-900">
            После регистрации доступны:
          </p>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
            <li>Календарь дедлайнов и выдачи заключений.</li>
            <li>Список всех пациентов с фильтрацией по датам.</li>
            <li>Ролевая очередь исследований и CITO-индикаторы.</li>
          </ul>
        </div>
      </section>

      <section className="flex items-center justify-center px-6 py-10 sm:px-10 lg:px-14">
        <div className="w-full max-w-2xl rounded-[36px] border border-white/80 bg-white/92 p-8 shadow-[0_30px_80px_rgba(72,98,137,0.16)] backdrop-blur-xl sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">
            Создать профиль
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-slate-900">
            Новая учетная запись
          </h2>

          <form onSubmit={submit} className="mt-8 grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-slate-700 sm:col-span-2">
              Имя и фамилия
              <input
                className={inputClassName}
                placeholder="Например, Каримов Аслан"
                {...register("fullName")}
              />
              {errors.fullName ? (
                <span className="text-xs text-rose-600">
                  {errors.fullName.message}
                </span>
              ) : null}
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700 sm:col-span-2">
              Организация
              <input
                className={inputClassName}
                placeholder="Название клиники или центра"
                {...register("organization")}
              />
              {errors.organization ? (
                <span className="text-xs text-rose-600">
                  {errors.organization.message}
                </span>
              ) : null}
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              Email
              <input
                className={inputClassName}
                placeholder="user@clinic.local"
                {...register("email")}
              />
              {errors.email ? (
                <span className="text-xs text-rose-600">
                  {errors.email.message}
                </span>
              ) : null}
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              Роль
              <select className={inputClassName} {...register("role")}>
                <option value="CLINIC">Клиника</option>
                <option value="DOCTOR">Врач</option>
                <option value="ADMIN">Администратор</option>
              </select>
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              Пароль
              <input
                type="password"
                className={inputClassName}
                {...register("password")}
              />
              {errors.password ? (
                <span className="text-xs text-rose-600">
                  {errors.password.message}
                </span>
              ) : null}
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              Подтверждение пароля
              <input
                type="password"
                className={inputClassName}
                {...register("confirmPassword")}
              />
              {errors.confirmPassword ? (
                <span className="text-xs text-rose-600">
                  {errors.confirmPassword.message}
                </span>
              ) : null}
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="sm:col-span-2 inline-flex w-full items-center justify-center rounded-full bg-[color:var(--color-primary)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Создаем профиль..." : "Создать профиль"}
            </button>
          </form>

          <p className="mt-6 text-sm text-slate-500">
            Уже есть доступ?{" "}
            <Link
              href="/login"
              className="font-semibold text-[color:var(--color-primary)]"
            >
              Вернуться ко входу
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
