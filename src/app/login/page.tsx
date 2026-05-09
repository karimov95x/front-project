"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "@/components/Toast";
import { saveSessionUser } from "@/lib/auth";
import { loginUser } from "@/lib/backend-api";
import { loginSchema, type LoginInput } from "@/lib/validation";

const demoCredentials = [
  {
    role: "Администратор",
    email: "admin@radiomed.local",
    password: "Admin12345",
  },
  {
    role: "Клиника",
    email: "clinic@radiomed.local",
    password: "Clinic12345",
  },
  {
    role: "Врач",
    email: "doctor@radiomed.local",
    password: "Doctor12345",
  },
];

const inputClassName =
  "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[color:var(--color-primary)] focus:bg-white";

export default function LoginPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "doctor@radiomed.local",
      password: "Doctor12345",
      role: "DOCTOR",
    },
  });

  const submit = handleSubmit(async (values) => {
    try {
      const user = await loginUser(values);
      saveSessionUser(user);
      toast(`Вход выполнен: ${user.fullName}.`, "success");
      startTransition(() => {
        router.push("/");
        router.refresh();
      });
    } catch (error) {
      toast(
        error instanceof Error ? error.message : "Не удалось выполнить вход.",
        "error",
      );
    }
  });

  return (
    <div className="grid min-h-screen bg-slate-50 lg:grid-cols-[1.05fr_0.95fr]">
      <section className="flex flex-col justify-between px-6 py-10 sm:px-10 lg:px-14">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[color:var(--color-primary)]">
            Radiomed
          </p>
          <h1 className="mt-4 max-w-xl font-[family:var(--font-display)] text-4xl font-semibold text-slate-900 sm:text-5xl">
            Вход в рабочее пространство.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-8 text-slate-600">
            Войдите под ролью клиники, врача или администратора и откройте
            нужный рабочий раздел.
          </p>
        </div>

        <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 text-slate-700">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">
            Демо-доступ
          </p>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            {demoCredentials.map((item) => (
              <div
                key={item.email}
                className="rounded-xl border border-slate-200 px-4 py-3"
              >
                <p className="font-semibold text-slate-900">{item.role}</p>
                <p className="mt-1">{item.email}</p>
                <p>Пароль: {item.password}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center px-6 py-10 sm:px-10 lg:px-14">
        <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-8 sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">
            Войти
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-slate-900">
            Открыть рабочее пространство
          </h2>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Роль
              <select className={inputClassName} {...register("role")}>
                <option value="ADMIN">Администратор</option>
                <option value="CLINIC">Клиника</option>
                <option value="DOCTOR">Врач</option>
              </select>
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              Email
              <input
                className={inputClassName}
                placeholder="name@radiomed.local"
                {...register("email")}
              />
              {errors.email ? (
                <span className="text-xs text-rose-600">
                  {errors.email.message}
                </span>
              ) : null}
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

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center rounded-full bg-[color:var(--color-primary)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Входим..." : "Войти"}
            </button>
          </form>

          <p className="mt-6 text-sm text-slate-500">
            Нет демо-аккаунта?{" "}
            <Link
              href="/register"
              className="font-semibold text-[color:var(--color-primary)]"
            >
              Создать профиль
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
