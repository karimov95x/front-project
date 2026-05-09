import { getSessionUser } from "@/lib/auth";
import { getTodayKey, toDayKey } from "@/lib/date";
import {
  loginSchema,
  registerSchema,
  serverValidate,
  studyIntakeSchema,
  type LoginInput,
  type RegisterInput,
  type StudyIntakeInput,
} from "@/lib/validation";
import type {
  AdminOverviewData,
  DashboardStats,
  PatientRow,
  SessionUser,
  Study,
  StudyContrastLabel,
  StudyModality,
  StudyStatus,
  UploadedFile,
  UserRole,
} from "@/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "/api";
const META_PREFIX = "RADIOMED_META::";

type BackendRole = UserRole;
type BackendStudyStatus = "NEW" | "IN_PROGRESS" | "COMPLETED" | "REJECTED";
type BackendStudyFileType = "DICOM" | "ATTACHMENT";

interface BackendUser {
  id: string;
  email: string;
  fullName: string;
  role: BackendRole;
  createdAt?: string;
  updatedAt?: string;
}

interface BackendStudyFile {
  id: string;
  fileUrl: string;
  fileType: BackendStudyFileType;
  createdAt: string;
}

interface BackendStudyDoctor {
  id: string;
  fullName: string;
  email: string;
}

interface BackendStudy {
  id: string;
  patientFullName: string;
  patientBirthDate: string;
  anamnesis: string;
  status: BackendStudyStatus;
  isUrgent: boolean;
  clinicId: string;
  assignedDoctorId: string | null;
  rejectionReason: string | null;
  reportFileUrl: string | null;
  createdAt: string;
  updatedAt: string;
  clinic: BackendStudyDoctor;
  assignedDoctor: BackendStudyDoctor | null;
  files: BackendStudyFile[];
}

interface BackendPaginatedStudies {
  data: BackendStudy[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface StudyMeta {
  modality: StudyModality;
  studyArea: string;
  contrastLabel: StudyContrastLabel;
  note: string;
  dueDay: string;
  history: string;
}

interface StudyAttachmentInput {
  name: string;
}

interface CreateStudyOptions {
  attachments?: StudyAttachmentInput[];
}

const avatarGradientByRole: Record<UserRole, string> = {
  ADMIN: "from-violet-500 to-fuchsia-500",
  CLINIC: "from-blue-500 to-cyan-500",
  DOCTOR: "from-emerald-500 to-teal-500",
};

const fallbackOrganizationByRole: Record<UserRole, string> = {
  ADMIN: "Radiomed Core",
  CLINIC: "Партнёрская клиника Radiomed",
  DOCTOR: "Радиологический центр",
};

const fallbackSpecializationByRole: Partial<Record<UserRole, string>> = {
  DOCTOR: "Лучевая диагностика",
};

const statusMap: Record<BackendStudyStatus, StudyStatus> = {
  NEW: "new",
  IN_PROGRESS: "in_progress",
  COMPLETED: "ready",
  REJECTED: "refused",
};

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    let message = `Ошибка запроса (${response.status})`;

    try {
      const payload = (await response.json()) as {
        message?: string | string[];
        error?: string;
      };

      if (Array.isArray(payload.message)) {
        message = payload.message.join(" ");
      } else if (typeof payload.message === "string") {
        message = payload.message;
      } else if (typeof payload.error === "string") {
        message = payload.error;
      }
    } catch {
      // ignore json parse error and keep fallback message
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

function encodeStudyMeta(input: StudyIntakeInput): string {
  const meta = {
    modality: input.modality,
    studyArea: input.studyArea,
    contrastLabel: input.contrastLabel,
    note: input.note.trim() || "-",
    dueDay: input.dueDay,
  };

  return `${META_PREFIX}${encodeURIComponent(JSON.stringify(meta))}\n${input.history.trim()}`;
}

function parseStudyMeta(anamnesis: string, createdAt: string): StudyMeta {
  const [firstLine, ...restLines] = anamnesis.split("\n");

  if (firstLine.startsWith(META_PREFIX)) {
    try {
      const decoded = JSON.parse(
        decodeURIComponent(firstLine.slice(META_PREFIX.length)),
      ) as Omit<StudyMeta, "history">;

      return {
        modality: decoded.modality ?? "MRI",
        studyArea: decoded.studyArea ?? "Не указано",
        contrastLabel: decoded.contrastLabel ?? "Нет",
        note: decoded.note ?? "-",
        dueDay: decoded.dueDay ?? toDayKey(createdAt),
        history: restLines.join("\n").trim() || "Анамнез не указан.",
      };
    } catch {
      // ignore malformed metadata and fall back to plain text parsing
    }
  }

  return {
    modality: "MRI",
    studyArea: "Не указано",
    contrastLabel: "Нет",
    note: "-",
    dueDay: toDayKey(createdAt),
    history: anamnesis.trim() || "Анамнез не указан.",
  };
}

function extractFileName(fileUrl: string): string {
  const normalized = fileUrl.split("?")[0] ?? fileUrl;
  const parts = normalized.split("/");
  return parts.at(-1) || "file";
}

function buildStablePatientId(
  patientName: string,
  birthDate: string,
  clinicId: string,
): string {
  const source = `${patientName.trim().toLowerCase()}|${birthDate}|${clinicId}`;
  let hash = 0;

  for (const char of source) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }

  return `PT-${hash.toString(16).toUpperCase().padStart(8, "0")}`;
}

function mapUploadedFile(file: BackendStudyFile): UploadedFile {
  return {
    id: file.id,
    name: extractFileName(file.fileUrl),
    type: file.fileType,
    sizeMb: 0,
  };
}

function mapUser(
  user: BackendUser,
  options?: {
    organizationHint?: string;
    previousUser?: SessionUser | null;
  },
): SessionUser {
  const previousUser =
    options?.previousUser && options.previousUser.email === user.email
      ? options.previousUser
      : null;

  return {
    id: user.id,
    fullName: user.fullName,
    role: user.role,
    email: user.email,
    organization:
      options?.organizationHint ??
      previousUser?.organization ??
      fallbackOrganizationByRole[user.role],
    avatarColor: previousUser?.avatarColor ?? avatarGradientByRole[user.role],
    phone: previousUser?.phone,
    specialization:
      previousUser?.specialization ?? fallbackSpecializationByRole[user.role],
  };
}

function mapStudy(study: BackendStudy): Study {
  const meta = parseStudyMeta(study.anamnesis, study.createdAt);
  const createdDay = toDayKey(study.createdAt);
  const dueDay = meta.dueDay || createdDay;
  const dueAt = new Date(`${dueDay}T18:00:00`).toISOString();

  return {
    id: study.id,
    patientId: buildStablePatientId(
      study.patientFullName,
      study.patientBirthDate,
      study.clinicId,
    ),
    patientName: study.patientFullName,
    birthDate: study.patientBirthDate,
    clinicId: study.clinicId,
    clinicName: study.clinic.fullName,
    modality: meta.modality,
    history: meta.history,
    status: statusMap[study.status],
    isCito: study.isUrgent,
    createdAt: study.createdAt,
    createdDay,
    dueAt,
    dueDay,
    studyArea: meta.studyArea,
    contrastLabel: meta.contrastLabel,
    note: meta.note,
    assignedDoctorId:
      study.assignedDoctor?.id ?? study.assignedDoctorId ?? undefined,
    assignedDoctorName: study.assignedDoctor?.fullName ?? undefined,
    refusalReason: study.rejectionReason ?? undefined,
    conclusionFileName: study.reportFileUrl
      ? extractFileName(study.reportFileUrl)
      : undefined,
    attachments: study.files.map(mapUploadedFile),
  };
}

function uniqueValues(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function splitStudyAreas(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function summarizeText(
  values: string[],
  fallback: string,
  limit = 180,
): string {
  const summary = uniqueValues(values).join(" ").replace(/\s+/g, " ").trim();

  if (!summary) {
    return fallback;
  }

  if (summary.length <= limit) {
    return summary;
  }

  return `${summary.slice(0, limit - 1).trimEnd()}…`;
}

function selectStudyAreas(patientStudies: Study[]): string[] {
  const limit = Math.min(patientStudies.length * 2, 8);
  const orderedAreas = patientStudies.flatMap((study) =>
    splitStudyAreas(study.studyArea),
  );
  const preferredAreas = uniqueValues(orderedAreas).slice(0, limit);

  if (preferredAreas.length === limit) {
    return preferredAreas;
  }

  const completedAreas = [...preferredAreas];

  orderedAreas.forEach((area) => {
    if (completedAreas.length < limit) {
      completedAreas.push(area);
    }
  });

  return completedAreas.slice(0, limit);
}

function resolvePatientStatus(
  patientStudies: Study[],
): PatientRow["patientStatus"] {
  if (patientStudies.every((study) => study.status === "ready")) {
    return "completed";
  }

  if (patientStudies.every((study) => study.status === "refused")) {
    return "refused";
  }

  if (
    patientStudies.some(
      (study) =>
        study.status === "in_progress" ||
        Boolean(study.assignedDoctorId || study.assignedDoctorName),
    )
  ) {
    return "assigned";
  }

  return "unassigned";
}

function pickArchiveFileName(
  patientStudies: Study[],
  patientId: string,
): string {
  const archive = patientStudies
    .flatMap((study) => study.attachments)
    .find((attachment) => attachment.name.toLowerCase().endsWith(".zip"));

  return archive?.name ?? `${patientId.toLowerCase()}_images.zip`;
}

function sortByCreatedAtDesc(studies: Study[]): Study[] {
  return [...studies].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
}

function derivePatients(studies: Study[]): PatientRow[] {
  const groups = new Map<string, Study[]>();

  sortByCreatedAtDesc(studies).forEach((study) => {
    const current = groups.get(study.patientId) ?? [];
    current.push(study);
    groups.set(study.patientId, current);
  });

  return [...groups.entries()]
    .map(([patientId, patientStudies]) => {
      const primaryStudy = patientStudies[0];
      const zones = selectStudyAreas(patientStudies);
      const doctors = uniqueValues(
        patientStudies.map((study) => study.assignedDoctorName ?? ""),
      );
      const contrastValues = uniqueValues(
        patientStudies.map((study) => study.contrastLabel),
      );
      const noteValues = patientStudies
        .map((study) => study.note)
        .filter((note) => note && note !== "-");
      const archiveFileName = pickArchiveFileName(patientStudies, patientId);

      return {
        id: `${patientId}-${primaryStudy.createdAt}`,
        patientId,
        createdAt: primaryStudy.createdAt,
        patientName: primaryStudy.patientName,
        birthYear: Number.parseInt(primaryStudy.birthDate.slice(0, 4), 10),
        studiesCount: patientStudies.length,
        studyAreas: zones,
        contrastLabel: contrastValues.join(", ") || primaryStudy.contrastLabel,
        reportingDoctor:
          doctors.length > 0 ? doctors.join(", ") : "Не назначен",
        note: patientStudies.some((study) => study.isCito) ? "CITO" : "",
        complaintsSummary: summarizeText(
          noteValues,
          "Жалобы кратко не указаны.",
          160,
        ),
        historySummary: summarizeText(
          patientStudies.map((study) => study.history),
          "Анамнез не указан.",
          260,
        ),
        archiveFileName,
        details: patientStudies.map((item) => ({
          studyId: item.id,
          modality: item.modality,
          studyArea: item.studyArea,
          contrastLabel: item.contrastLabel,
          status: item.status,
          note: item.note,
          history: item.history,
          clinicName: item.clinicName,
          assignedDoctorId: item.assignedDoctorId,
          reportingDoctor: item.assignedDoctorName ?? "Не назначен",
          archiveFileName: pickArchiveFileName([item], patientId),
          conclusionFileName: item.conclusionFileName,
        })),
        createdDay: primaryStudy.createdDay,
        patientStatus: resolvePatientStatus(patientStudies),
      };
    })
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() -
        new Date(left.createdAt).getTime(),
    );
}

function computeStats(studies: Study[]): DashboardStats {
  const readyToday = studies.filter(
    (study) => study.status === "ready" && study.dueDay === getTodayKey(),
  ).length;

  const finished = studies.filter((study) => study.status === "ready");
  const averageReportHours =
    finished.length === 0
      ? 0
      : Math.round(
          finished.reduce((sum, study) => {
            return (
              sum +
              Math.max(
                1,
                Math.round(
                  (new Date(study.dueAt).getTime() -
                    new Date(study.createdAt).getTime()) /
                    (1000 * 60 * 60),
                ),
              )
            );
          }, 0) / finished.length,
        );

  return {
    totalStudies: studies.length,
    urgentStudies: studies.filter((study) => study.isCito).length,
    inProgressStudies: studies.filter((study) => study.status === "in_progress")
      .length,
    readyToday,
    averageReportHours,
  };
}

async function fetchProfile(options?: {
  organizationHint?: string;
}): Promise<SessionUser> {
  const rawProfile = await apiRequest<BackendUser>("/auth/me");
  return mapUser(rawProfile, {
    organizationHint: options?.organizationHint,
    previousUser: getSessionUser(),
  });
}

async function listStudies(query?: Record<string, string | number | boolean>) {
  const limit = 100;
  const baseParams = new URLSearchParams({
    limit: String(limit),
  });

  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && `${value}`.length > 0) {
      baseParams.set(key, String(value));
    }
  });

  const studies: BackendStudy[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const searchParams = new URLSearchParams(baseParams);
    searchParams.set("page", String(page));

    const response = await apiRequest<BackendPaginatedStudies>(
      `/studies?${searchParams.toString()}`,
    );

    studies.push(...response.data);
    totalPages = response.meta.totalPages;
    page += 1;
  } while (page <= totalPages);

  return studies.map(mapStudy);
}

export async function fetchCurrentUser(): Promise<SessionUser> {
  return fetchProfile();
}

export async function logoutUser(): Promise<void> {
  await apiRequest<{ message: string }>("/auth/logout", {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function loginUser(payload: LoginInput): Promise<SessionUser> {
  const validated = await serverValidate(loginSchema, payload, 0);

  await apiRequest<{ accessToken: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: validated.email,
      password: validated.password,
    }),
  });

  const user = await fetchProfile();

  if (user.role !== validated.role) {
    await logoutUser();
    throw new Error("Выбранная роль не совпадает с ролью аккаунта.");
  }

  return user;
}

export async function registerUser(
  payload: RegisterInput,
): Promise<SessionUser> {
  const validated = await serverValidate(registerSchema, payload, 0);

  await apiRequest<{ accessToken: string }>("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      email: validated.email,
      password: validated.password,
      fullName: validated.fullName,
      role: validated.role,
    }),
  });

  return fetchProfile({ organizationHint: validated.organization });
}

export async function createStudy(
  payload: StudyIntakeInput,
  user: SessionUser | null,
  options?: CreateStudyOptions,
): Promise<Study> {
  if (!user) {
    throw new Error("Сначала войдите в систему.");
  }

  const validated = await serverValidate(studyIntakeSchema, payload, 0);
  const timestamp = Date.now();
  const attachmentCount = options?.attachments?.length ?? 0;
  const dicomCount = Math.max(0, validated.filesCount - attachmentCount);
  const dicomFileUrls = Array.from({ length: dicomCount }, (_, index) => {
    return `https://uploads.radiomed.local/studies/${user.id}/${timestamp}-${index + 1}.dcm`;
  });
  const attachmentFileUrls = (options?.attachments ?? []).map(
    (attachment, index) => {
      const encodedName = encodeURIComponent(attachment.name);
      return `https://uploads.radiomed.local/studies/${user.id}/${timestamp}-attachment-${index + 1}-${encodedName}`;
    },
  );

  const created = await apiRequest<BackendStudy>("/studies", {
    method: "POST",
    body: JSON.stringify({
      patientFullName: validated.patientName,
      patientBirthDate: validated.birthDate,
      anamnesis: encodeStudyMeta(validated),
      isUrgent: validated.isCito,
      dicomFiles: dicomFileUrls,
      attachmentFiles: attachmentFileUrls,
    }),
  });

  return mapStudy(created);
}

export async function getPatientsByDate(day: string): Promise<PatientRow[]> {
  const studies = await listStudies();
  return derivePatients(studies.filter((study) => study.createdDay === day));
}

export async function getDoctorPatients(userId: string): Promise<PatientRow[]> {
  const studies = await listStudies();
  return derivePatients(
    studies.filter((study) => study.assignedDoctorId === userId),
  );
}

export async function getAdminOverview(): Promise<AdminOverviewData> {
  const [users, studies] = await Promise.all([
    apiRequest<BackendUser[]>("/users"),
    listStudies(),
  ]);

  const mappedUsers = users.map((user) =>
    mapUser(user, {
      previousUser: getSessionUser(),
    }),
  );
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  return {
    users: mappedUsers,
    stats: computeStats(studies),
    pendingInvites: 0,
    recentSignups: users.filter((user) => {
      return user.createdAt
        ? new Date(user.createdAt).getTime() >= sevenDaysAgo
        : false;
    }).length,
  };
}

export async function getPersonalStudyCount(
  sessionUser: SessionUser,
): Promise<number> {
  const studies = await listStudies();

  if (sessionUser.role === "ADMIN") {
    return studies.length;
  }

  if (sessionUser.role === "DOCTOR") {
    return studies.filter((study) => study.assignedDoctorId === sessionUser.id)
      .length;
  }

  return studies.filter((study) => study.clinicId === sessionUser.id).length;
}

export async function takeStudy(studyId: string): Promise<void> {
  await apiRequest(`/studies/${studyId}/take`, {
    method: "PATCH",
    body: JSON.stringify({}),
  });
}

export async function releaseStudy(studyId: string): Promise<void> {
  await apiRequest(`/studies/${studyId}/release`, {
    method: "PATCH",
    body: JSON.stringify({}),
  });
}

export async function completeStudy(
  studyId: string,
  reportFileName: string,
  doctorId: string,
): Promise<void> {
  const timestamp = Date.now();
  const encodedName = encodeURIComponent(reportFileName);

  await apiRequest(`/studies/${studyId}/complete`, {
    method: "PATCH",
    body: JSON.stringify({
      reportFileUrl: `https://uploads.radiomed.local/reports/${doctorId}/${timestamp}-${encodedName}`,
    }),
  });
}

export async function reopenStudy(studyId: string): Promise<void> {
  await apiRequest(`/studies/${studyId}/reopen`, {
    method: "PATCH",
    body: JSON.stringify({}),
  });
}
