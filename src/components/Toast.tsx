"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
  exiting?: boolean;
}

let queue: ToastItem[] = [];
let listeners: Array<() => void> = [];
let counter = 1;

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

function removeToast(id: number) {
  queue = queue.map((item) =>
    item.id === id ? { ...item, exiting: true } : item,
  );
  notifyListeners();

  window.setTimeout(() => {
    queue = queue.filter((item) => item.id !== id);
    notifyListeners();
  }, 220);
}

export function toast(message: string, type: ToastType = "success") {
  const id = counter++;
  queue = [...queue, { id, type, message }];
  notifyListeners();

  window.setTimeout(() => removeToast(id), 4200);
}

const toneStyles: Record<ToastType, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  error: "border-rose-200 bg-rose-50 text-rose-800",
  info: "border-sky-200 bg-sky-50 text-sky-800",
};

export function ToastContainer() {
  const [isMounted, setIsMounted] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    setIsMounted(true);

    const listener = () => setTick((value) => value + 1);
    listeners.push(listener);

    return () => {
      listeners = listeners.filter((candidate) => candidate !== listener);
    };
  }, []);

  if (!isMounted) {
    return null;
  }

  return createPortal(
    <div className="pointer-events-none fixed bottom-5 right-5 z-[120] flex w-full max-w-sm flex-col gap-2 px-4 sm:px-0">
      {queue.map((item) => (
        <div
          key={item.id}
          className={`pointer-events-auto rounded-2xl border px-4 py-3 shadow-[0_18px_40px_rgba(36,56,99,0.18)] transition duration-200 ${toneStyles[item.type]} ${
            item.exiting
              ? "translate-y-2 opacity-0"
              : "translate-y-0 opacity-100"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-semibold leading-6">{item.message}</p>
            <button
              type="button"
              onClick={() => removeToast(item.id)}
              className="text-lg leading-none opacity-50 transition hover:opacity-100"
              aria-label="Закрыть сообщение"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>,
    document.body,
  );
}
