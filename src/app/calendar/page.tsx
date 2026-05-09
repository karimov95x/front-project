"use client";

import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";
import EmptyState from "@/components/EmptyState";
import { ListSkeleton } from "@/components/LoadingSkeleton";
import PatientsTable from "@/components/PatientsTable";
import { getPatientsByDate } from "@/lib/backend-api";
import { getTodayKey } from "@/lib/date";
import type { PatientRow } from "@/types";

const weekdayLabels = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

function parseDayKey(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

function toDayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

function formatMonthLabel(date: Date): string {
  return new Intl.DateTimeFormat("ru-RU", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatSelectedDay(value: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(parseDayKey(value));
}

function buildCalendarMatrix(monthDate: Date): Array<
  Array<{
    key: string;
    dayNumber: number;
    currentMonth: boolean;
    today: boolean;
  }>
> {
  const monthStart = new Date(
    monthDate.getFullYear(),
    monthDate.getMonth(),
    1,
    12,
  );
  const leadingDays = (monthStart.getDay() + 6) % 7;
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - leadingDays);

  return Array.from({ length: 6 }, (_, weekIndex) =>
    Array.from({ length: 7 }, (_, dayIndex) => {
      const cellDate = new Date(gridStart);
      cellDate.setDate(gridStart.getDate() + weekIndex * 7 + dayIndex);
      const key = toDayKey(cellDate);

      return {
        key,
        dayNumber: cellDate.getDate(),
        currentMonth: cellDate.getMonth() === monthDate.getMonth(),
        today: key === getTodayKey(),
      };
    }),
  );
}

export default function CalendarPage() {
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [selectedDay, setSelectedDay] = useState(getTodayKey());
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const today = parseDayKey(getTodayKey());
    return new Date(today.getFullYear(), today.getMonth(), 1, 12);
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    getPatientsByDate(selectedDay)
      .then((data) => {
        if (active) {
          setPatients(data);
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
  }, [selectedDay]);

  const calendarMatrix = useMemo(
    () => buildCalendarMatrix(visibleMonth),
    [visibleMonth],
  );

  const selectDay = (dayKey: string) => {
    setLoading(true);
    setSelectedDay(dayKey);

    const selectedDate = parseDayKey(dayKey);
    setVisibleMonth(
      new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1, 12),
    );
  };

  const shiftMonth = (offset: number) => {
    const nextMonth = new Date(
      visibleMonth.getFullYear(),
      visibleMonth.getMonth() + offset,
      1,
      12,
    );

    setVisibleMonth(nextMonth);
    setLoading(true);
    setSelectedDay(toDayKey(nextMonth));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
        <p className="text-sm font-medium text-slate-900">Календарь</p>
        <input
          type="date"
          value={selectedDay}
          onChange={(event) => selectDay(event.target.value)}
          className="border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-700 outline-none"
        />
      </div>

      <section className="border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-2 py-2">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className="border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-700 hover:bg-slate-50"
          >
            Назад
          </button>
          <p className="text-sm font-medium text-slate-900 capitalize">
            {formatMonthLabel(visibleMonth)}
          </p>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            className="border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-700 hover:bg-slate-50"
          >
            Вперёд
          </button>
        </div>

        <table className="w-full table-fixed border-collapse text-[11px] leading-4">
          <thead className="bg-white text-[10px] uppercase tracking-[0.04em] text-slate-500">
            <tr>
              {weekdayLabels.map((label) => (
                <th
                  key={label}
                  className="border-b border-r border-slate-200 px-1 py-1.5 last:border-r-0"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {calendarMatrix.map((week, weekIndex) => (
              <tr key={`week-${weekIndex}`}>
                {week.map((day) => (
                  <td
                    key={day.key}
                    className="border-r border-t border-slate-200 p-0 align-top last:border-r-0"
                  >
                    <button
                      type="button"
                      onClick={() => selectDay(day.key)}
                      className={clsx(
                        "flex h-16 w-full items-start justify-end px-2 py-1.5 text-[11px] transition",
                        day.key === selectedDay
                          ? "bg-slate-100 text-slate-900"
                          : day.currentMonth
                            ? "bg-white text-slate-700 hover:bg-slate-50"
                            : "bg-slate-50 text-slate-300 hover:bg-slate-100",
                      )}
                    >
                      <span
                        className={clsx(
                          "inline-flex h-6 min-w-6 items-center justify-center px-1",
                          day.today ? "border border-slate-300" : "",
                        )}
                      >
                        {day.dayNumber}
                      </span>
                    </button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
        <p>{formatSelectedDay(selectedDay)}</p>
        <p>{loading ? "Загрузка..." : `${patients.length} пациентов`}</p>
      </div>

      {loading ? (
        <ListSkeleton rows={4} />
      ) : patients.length === 0 ? (
        <EmptyState
          title="На выбранную дату пациентов нет"
          description="Выберите другую дату в календаре, чтобы увидеть пациентов этого дня."
        />
      ) : (
        <PatientsTable rows={patients} />
      )}
    </div>
  );
}
