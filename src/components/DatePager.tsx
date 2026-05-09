"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";

interface DatePagerProps {
  label: string;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
}

export default function DatePager({
  label,
  onPrevious,
  onNext,
  onToday,
}: DatePagerProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 border border-slate-200 bg-white px-2 py-2">
      <button
        type="button"
        onClick={onPrevious}
        className="inline-flex h-8 w-8 items-center justify-center border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
        aria-label="Предыдущий день"
      >
        <ChevronLeftIcon className="h-4 w-4" />
      </button>
      <div className="min-w-[150px] flex-1">
        <p className="text-xs font-medium text-slate-900">{label}</p>
      </div>
      <button
        type="button"
        onClick={onToday}
        className="border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-medium text-slate-700 transition hover:bg-slate-50"
      >
        Сегодня
      </button>
      <button
        type="button"
        onClick={onNext}
        className="inline-flex h-8 w-8 items-center justify-center border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
        aria-label="Следующий день"
      >
        <ChevronRightIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
