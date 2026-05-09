import { statusLabels, statusStyles, type StudyStatus } from "@/types";

export default function StatusPill({ status }: { status: StudyStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}
