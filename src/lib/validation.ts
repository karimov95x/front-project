import { z } from "zod";
import { contrastOptionsByModality, studyAreaOptionsByModality } from "@/types";

const roleSchema = z.enum(["ADMIN", "CLINIC", "DOCTOR"]);
const modalitySchema = z.enum(["MRI", "CT"]);

export const loginSchema = z.object({
  email: z.string().trim().email("Укажите корректный email."),
  password: z.string().min(8, "Пароль должен содержать минимум 8 символов."),
  role: roleSchema,
});

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(3, "Введите имя и фамилию."),
    organization: z.string().trim().min(3, "Укажите название организации."),
    email: z.string().trim().email("Укажите корректный email."),
    role: roleSchema,
    password: z.string().min(8, "Пароль должен содержать минимум 8 символов."),
    confirmPassword: z.string().min(8, "Подтвердите пароль."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Пароли должны совпадать.",
  });

export const studyIntakeSchema = z
  .object({
    patientName: z.string().trim().min(3, "Введите имя пациента."),
    birthDate: z.string().min(1, "Укажите дату рождения."),
    modality: modalitySchema,
    studyArea: z.string().trim().min(2, "Укажите зону исследования."),
    contrastLabel: z.string().trim().min(1, "Укажите контраст."),
    note: z.string().trim().max(200, "Примечание слишком длинное."),
    dueDay: z.string().min(1, "Выберите дату дедлайна."),
    history: z
      .string()
      .trim()
      .min(1, "Укажите анамнез.")
      .max(800, "Анамнез слишком длинный."),
    filesCount: z
      .number()
      .int()
      .min(1, "Добавьте хотя бы один файл исследования."),
    isCito: z.boolean(),
  })
  .superRefine((values, context) => {
    const selectedAreas = values.studyArea
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (selectedAreas.length === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["studyArea"],
        message: "Выберите хотя бы одну зону исследования.",
      });
    }

    if (
      selectedAreas.some(
        (area) => !studyAreaOptionsByModality[values.modality].includes(area),
      )
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["studyArea"],
        message: "Выберите зоны исследования из доступного списка.",
      });
    }

    if (
      !contrastOptionsByModality[values.modality].includes(
        values.contrastLabel as (typeof contrastOptionsByModality)[typeof values.modality][number],
      )
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["contrastLabel"],
        message:
          "Выберите подходящий вариант контраста для выбранной модальности.",
      });
    }
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type StudyIntakeInput = z.infer<typeof studyIntakeSchema>;

export async function serverValidate<T>(
  schema: z.ZodType<T>,
  payload: unknown,
  delayMs = 250,
): Promise<T> {
  await new Promise((resolve) => setTimeout(resolve, delayMs));
  return schema.parse(payload);
}
