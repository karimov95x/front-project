export type UserRole = "ADMIN" | "CLINIC" | "DOCTOR";

export type StudyStatus = "new" | "in_progress" | "ready" | "refused";

export type StudyModality = "MRI" | "CT";

export type StudyContrastLabel =
  | "Нет"
  | "Гадовист 7,5 мл"
  | "Омнискан 15 мл"
  | "Ультравист 100 мл";

export interface UploadedFile {
  id: string;
  name: string;
  type: string;
  sizeMb: number;
}

export interface SessionUser {
  id: string;
  fullName: string;
  role: UserRole;
  organization: string;
  email: string;
  avatarColor: string;
  specialization?: string;
  phone?: string;
}

export interface Study {
  id: string;
  patientId: string;
  patientName: string;
  birthDate: string;
  clinicId: string;
  clinicName: string;
  modality: StudyModality;
  history: string;
  status: StudyStatus;
  isCito: boolean;
  createdAt: string;
  createdDay: string;
  dueAt: string;
  dueDay: string;
  studyArea: string;
  contrastLabel: StudyContrastLabel;
  note: string;
  assignedDoctorId?: string;
  assignedDoctorName?: string;
  refusalReason?: string;
  conclusionFileName?: string;
  attachments: UploadedFile[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  day: string;
  time: string;
  type: "upload" | "deadline" | "consultation" | "report";
  clinicName: string;
  description: string;
  urgent?: boolean;
}

export interface CalendarDay {
  key: string;
  label: string;
  shortLabel: string;
}

export interface PatientStudyDetail {
  studyId: string;
  modality: StudyModality;
  studyArea: string;
  contrastLabel: string;
  status: StudyStatus;
  note: string;
  history: string;
  clinicName: string;
  assignedDoctorId?: string;
  reportingDoctor: string;
  archiveFileName: string;
  conclusionFileName?: string;
}

export interface DashboardStats {
  totalStudies: number;
  urgentStudies: number;
  inProgressStudies: number;
  readyToday: number;
  averageReportHours: number;
}

export interface PatientRow {
  id: string;
  patientId: string;
  createdAt: string;
  patientName: string;
  birthYear: number;
  studiesCount: number;
  studyAreas: string[];
  contrastLabel: string;
  reportingDoctor: string;
  note: string;
  complaintsSummary: string;
  historySummary: string;
  archiveFileName: string;
  details: PatientStudyDetail[];
  createdDay: string;
  patientStatus: "unassigned" | "assigned" | "completed" | "refused";
}

export interface AdminOverviewData {
  users: SessionUser[];
  stats: DashboardStats;
  pendingInvites: number;
  recentSignups: number;
}

export const roleLabels: Record<UserRole, string> = {
  ADMIN: "Администратор",
  CLINIC: "Клиника",
  DOCTOR: "Врач",
};

export const statusLabels: Record<StudyStatus, string> = {
  new: "Новое",
  in_progress: "В работе",
  ready: "Готово",
  refused: "Отказ",
};

export const modalityLabels: Record<StudyModality, string> = {
  MRI: "МРТ",
  CT: "КТ",
};

export const studyAreaOptionsByModality: Record<StudyModality, string[]> = {
  MRI: [
    "ГМ",
    "ШОП",
    "ГОП",
    "ПОП",
    "ОБП",
    "ЛКС",
    "ППС",
    "ТБС",
    "ОМТ",
    "МТШ",
    "ПКС",
    "Кисть",
    "Стопа",
    "ЛПС",
    "ЛЛС",
    "ПЛС",
    "ПГС",
    "ЛГС",
    "Мягкие ткани",
    "ОГК",
  ],
  CT: [
    "ГМ",
    "ОГК",
    "ОБП",
    "ЛКС",
    "ППС",
    "ТБС",
    "ОМТ",
    "МТШ",
    "ПКС",
    "Кисть",
    "Стопа",
    "ЛПС",
    "ЛЛС",
    "ПЛС",
    "ПГС",
    "ЛГС",
    "Мягкие ткани",
  ],
};

export const contrastOptionsByModality: Record<
  StudyModality,
  StudyContrastLabel[]
> = {
  MRI: ["Нет", "Гадовист 7,5 мл", "Омнискан 15 мл"],
  CT: ["Нет", "Ультравист 100 мл"],
};

export function getDefaultContrastLabel(
  modality: StudyModality,
): StudyContrastLabel {
  return contrastOptionsByModality[modality][0];
}

export const statusStyles: Record<StudyStatus, string> = {
  new: "border-sky-200 bg-sky-50 text-sky-700",
  in_progress: "border-amber-200 bg-amber-50 text-amber-800",
  ready: "border-emerald-200 bg-emerald-50 text-emerald-700",
  refused: "border-rose-200 bg-rose-50 text-rose-700",
};

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export function formatShortDate(value: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(value));
}

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function getBirthYear(value: string): number {
  const year = Number.parseInt(value.slice(0, 4), 10);
  return Number.isNaN(year) ? 0 : year;
}

export function roleAccent(role: UserRole): string {
  if (role === "ADMIN") return "bg-violet-100 text-violet-700";
  if (role === "CLINIC") return "bg-blue-100 text-blue-700";
  return "bg-emerald-100 text-emerald-700";
}
