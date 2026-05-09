import {
  contrastOptionsByModality,
  studyAreaOptionsByModality,
  type CalendarEvent,
  type SessionUser,
  type Study,
} from "@/types";

const REFERENCE_YEAR = 2026;
const REFERENCE_MONTH = 4;
const REFERENCE_DAY = 3;

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function buildLocalDate(dayOffset: number, hours: number, minutes = 0): Date {
  return new Date(
    REFERENCE_YEAR,
    REFERENCE_MONTH,
    REFERENCE_DAY + dayOffset,
    hours,
    minutes,
    0,
    0,
  );
}

function dayKey(dayOffset = 0): string {
  const date = buildLocalDate(dayOffset, 12);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function dateTime(dayOffset: number, hours: number, minutes = 0): string {
  return buildLocalDate(dayOffset, hours, minutes).toISOString();
}

export const TODAY_KEY = dayKey();

export const sessionUsers: SessionUser[] = [
  {
    id: "admin-1",
    fullName: "Елена Громова",
    role: "ADMIN",
    organization: "Radiomed Core",
    email: "admin@radiomed.demo",
    avatarColor: "from-violet-500 to-fuchsia-500",
    phone: "+7 (700) 301-22-14",
  },
  {
    id: "clinic-1",
    fullName: "Анастасия Савина",
    role: "CLINIC",
    organization: "Клиника Север",
    email: "clinic@radiomed.demo",
    avatarColor: "from-blue-500 to-cyan-500",
    phone: "+7 (700) 820-14-20",
  },
  {
    id: "doctor-1",
    fullName: "Каримов Аслан",
    role: "DOCTOR",
    organization: "Радиологический центр",
    email: "doctor@radiomed.demo",
    avatarColor: "from-emerald-500 to-teal-500",
    specialization: "МРТ / нейрорадиология",
    phone: "+7 (700) 551-10-89",
  },
  {
    id: "doctor-2",
    fullName: "Каримов Аслан",
    role: "DOCTOR",
    organization: "Радиологический центр",
    email: "doctor2@radiomed.demo",
    avatarColor: "from-orange-500 to-amber-500",
    specialization: "КТ / абдоминальная диагностика",
  },
  {
    id: "doctor-3",
    fullName: "Болатов Даурен",
    role: "DOCTOR",
    organization: "Radiomed Core",
    email: "bolatov@radiomed.demo",
    avatarColor: "from-cyan-500 to-sky-500",
    specialization: "МРТ / нейрорадиология",
  },
  {
    id: "doctor-4",
    fullName: "Кочиев Байрам",
    role: "DOCTOR",
    organization: "Radiomed Core",
    email: "kochiev@radiomed.demo",
    avatarColor: "from-indigo-500 to-blue-500",
    specialization: "КТ / грудная клетка",
  },
  {
    id: "doctor-5",
    fullName: "Байнаева Багжан",
    role: "DOCTOR",
    organization: "Radiomed Core",
    email: "bainaeva@radiomed.demo",
    avatarColor: "from-fuchsia-500 to-pink-500",
    specialization: "МРТ / опорно-двигательная система",
  },
  {
    id: "doctor-6",
    fullName: "Сапаев Саид",
    role: "DOCTOR",
    organization: "Radiomed Core",
    email: "sapaev@radiomed.demo",
    avatarColor: "from-emerald-500 to-lime-500",
    specialization: "КТ / брюшная полость",
  },
  {
    id: "clinic-2",
    fullName: "Мария Чистякова",
    role: "CLINIC",
    organization: "Клиника Маяк",
    email: "clinic2@radiomed.demo",
    avatarColor: "from-slate-500 to-sky-500",
  },
];

export const demoCredentials = [
  {
    role: "Администратор",
    email: "admin@radiomed.demo",
    password: "medexchange",
  },
  {
    role: "Клиника",
    email: "clinic@radiomed.demo",
    password: "medexchange",
  },
  { role: "Врач", email: "doctor@radiomed.demo", password: "medexchange" },
];

const generatedPatientNames = [
  "Алина Орлова",
  "Максим Воронов",
  "Валерия Ким",
  "Тимур Соколов",
  "Диана Исмаилова",
  "Артем Белов",
  "Софья Лапина",
  "Никита Романов",
  "Полина Захарова",
  "Егор Фомин",
  "Марина Тихонова",
  "Илья Гусев",
  "Кира Нестерова",
  "Руслан Алиев",
  "Таисия Власова",
  "Олег Казаков",
  "Вероника Данилова",
  "Павел Миронов",
  "Лилия Муратова",
  "Глеб Панов",
  "Нина Егорова",
  "Данил Евсеев",
  "Ясмина Ахметова",
  "Степан Киреев",
];

const complaintVariants = [
  "Нарастающая боль и ограничение подвижности.",
  "Контроль после операции и оценка динамики.",
  "Повторное исследование перед консультацией.",
  "Срочная проверка очага по направлению онколога.",
  "Подозрение на воспалительные изменения.",
  "Нужно краткое срочное описание для лечащего врача.",
];

const historyVariants = [
  "Пациент направлен после амбулаторного осмотра, требуется уточнение характера изменений и сопоставление с предыдущим исследованием.",
  "Исследование выполняется для оценки динамики лечения и подготовки к ближайшему консилиуму.",
  "Клиника просит короткое приоритетное описание с учетом жалоб и сопутствующих лабораторных данных.",
  "Нужно исключить осложнение после вмешательства, сравнить снимки и выделить ключевые находки для врача-клинициста.",
  "Повторное исследование запрошено после усиления симптомов, важно подтвердить или исключить прогрессирование процесса.",
];

const clinicOptions = [
  { id: "clinic-1", name: "Клиника Север" },
  { id: "clinic-2", name: "Клиника Маяк" },
];

const doctorPool = [
  { id: "doctor-1", name: "Каримов Аслан" },
  { id: "doctor-2", name: "Каримов Аслан" },
  { id: "doctor-3", name: "Болатов Даурен" },
  { id: "doctor-4", name: "Кочиев Байрам" },
  { id: "doctor-5", name: "Байнаева Багжан" },
  { id: "doctor-6", name: "Сапаев Саид" },
];

function getGeneratedDoctorAssignment(globalPatientIndex: number) {
  if (globalPatientIndex % 11 === 0) {
    return undefined;
  }

  return doctorPool[globalPatientIndex % doctorPool.length];
}

function getBirthDate(index: number): string {
  const year = 1962 + (index % 38);
  const month = (index % 12) + 1;
  const day = (index % 27) + 1;
  return `${year}-${pad(month)}-${pad(day)}`;
}

function buildGeneratedStudies(
  dayOffset: number,
  patientCount: number,
  patientStartIndex: number,
  studyStartIndex: number,
  patientOrderStart: number,
): Study[] {
  const studies: Study[] = [];
  let studyIndex = studyStartIndex;

  for (let patientIndex = 0; patientIndex < patientCount; patientIndex += 1) {
    const patientIdNumber = patientStartIndex + patientIndex;
    const patientId = `PT-${patientIdNumber}`;
    const patientName = `${generatedPatientNames[patientIndex % generatedPatientNames.length]} ${patientIndex + 1}`;
    const studyCount = (patientIndex % 6) + 1;
    const assignedDoctor = getGeneratedDoctorAssignment(
      patientOrderStart + patientIndex,
    );

    for (let itemIndex = 0; itemIndex < studyCount; itemIndex += 1) {
      const modality = itemIndex % 2 === 0 ? "MRI" : "CT";
      const studyAreaOptions = studyAreaOptionsByModality[modality];
      const studyArea =
        studyAreaOptions[(patientIndex + itemIndex) % studyAreaOptions.length];
      const contrastOptions = contrastOptionsByModality[modality];
      const contrastLabel =
        contrastOptions[(patientIndex + itemIndex) % contrastOptions.length];
      const clinic =
        clinicOptions[(patientIndex + itemIndex) % clinicOptions.length];
      const hours = 7 + ((patientIndex + itemIndex) % 10);
      const minutes = ((patientIndex * 7 + itemIndex * 13) % 6) * 10;
      const dueHour = Math.min(hours + 6 + (itemIndex % 3), 22);
      const archiveName = `${patientId.toLowerCase()}_${studyArea.toLowerCase()}_${itemIndex + 1}.zip`;

      studies.push({
        id: `ST-${studyIndex}`,
        patientId,
        patientName,
        birthDate: getBirthDate(patientIdNumber),
        clinicId: clinic.id,
        clinicName: clinic.name,
        modality,
        history:
          historyVariants[(patientIndex + itemIndex) % historyVariants.length],
        status:
          itemIndex % 5 === 0
            ? "new"
            : itemIndex % 5 === 1
              ? "in_progress"
              : itemIndex % 5 === 2
                ? "ready"
                : itemIndex % 5 === 3
                  ? "refused"
                  : "in_progress",
        isCito: (patientIndex + itemIndex) % 4 === 0,
        createdAt: dateTime(dayOffset, hours, minutes),
        createdDay: dayKey(dayOffset),
        dueAt: dateTime(dayOffset, dueHour, minutes),
        dueDay: dayKey(dayOffset),
        studyArea,
        contrastLabel,
        note: complaintVariants[
          (patientIndex + itemIndex) % complaintVariants.length
        ],
        assignedDoctorId: assignedDoctor?.id,
        assignedDoctorName: assignedDoctor?.name,
        refusalReason:
          itemIndex % 5 === 3
            ? "Требуется повторная загрузка серии в полном объеме."
            : undefined,
        conclusionFileName:
          itemIndex % 5 === 2
            ? `${patientId.toLowerCase()}_report.pdf`
            : undefined,
        attachments: [
          {
            id: `file-${studyIndex}-1`,
            name: archiveName,
            type: "ZIP",
            sizeMb: 180 + ((patientIndex + itemIndex) % 9) * 35,
          },
        ],
      });

      studyIndex += 1;
    }
  }

  return studies;
}

const baseStudySeed: Study[] = [
  {
    id: "ST-1042",
    patientId: "PT-205",
    patientName: "Ирина Новикова",
    birthDate: "1983-07-12",
    clinicId: "clinic-1",
    clinicName: "Клиника Север",
    modality: "MRI",
    history:
      "Очаговые головные боли, эпизоды головокружения, необходимо срочное описание МРТ головного мозга с контрастированием.",
    status: "new",
    isCito: true,
    createdAt: dateTime(0, 8, 35),
    createdDay: dayKey(0),
    dueAt: dateTime(0, 11, 30),
    dueDay: dayKey(0),
    studyArea: "ГМ",
    contrastLabel: "Гадовист 7,5 мл",
    note: "Срочное описание после усиления симптомов.",
    attachments: [
      {
        id: "file-1",
        name: "brain_mri_series.zip",
        type: "DICOM",
        sizeMb: 821,
      },
      { id: "file-2", name: "referral.pdf", type: "PDF", sizeMb: 0.4 },
    ],
  },
  {
    id: "ST-1041",
    patientId: "PT-204",
    patientName: "Дмитрий Кузнецов",
    birthDate: "1976-02-03",
    clinicId: "clinic-1",
    clinicName: "Клиника Север",
    modality: "CT",
    history:
      "Контроль КТ грудной клетки после пневмонии, требуется сравнение с прошлым исследованием и оценка динамики.",
    status: "in_progress",
    isCito: false,
    createdAt: dateTime(-1, 16, 10),
    createdDay: dayKey(-1),
    dueAt: dateTime(0, 14, 0),
    dueDay: dayKey(0),
    studyArea: "ОГК",
    contrastLabel: "Нет",
    note: "Нужно сравнение с исследованием прошлой недели.",
    assignedDoctorId: "doctor-3",
    assignedDoctorName: "Болатов Даурен",
    attachments: [
      { id: "file-3", name: "ct_chest.zip", type: "DICOM", sizeMb: 613 },
    ],
  },
  {
    id: "ST-1039",
    patientId: "PT-202",
    patientName: "Лейла Абдуллина",
    birthDate: "1991-11-29",
    clinicId: "clinic-2",
    clinicName: "Клиника Маяк",
    modality: "MRI",
    history:
      "МРТ поясничного отдела позвоночника, выраженный болевой синдром, требуется описание без очереди.",
    status: "ready",
    isCito: true,
    createdAt: dateTime(-2, 12, 30),
    createdDay: dayKey(-2),
    dueAt: dateTime(-1, 9, 30),
    dueDay: dayKey(-1),
    studyArea: "ПОП",
    contrastLabel: "Нет",
    note: "Приоритет из-за выраженного болевого синдрома.",
    assignedDoctorId: "doctor-4",
    assignedDoctorName: "Кочиев Байрам",
    conclusionFileName: "abdullina_report.pdf",
    attachments: [
      { id: "file-4", name: "spine_mri.zip", type: "DICOM", sizeMb: 744 },
      { id: "file-5", name: "questionnaire.jpg", type: "JPG", sizeMb: 3.2 },
    ],
  },
  {
    id: "ST-1038",
    patientId: "PT-201",
    patientName: "Виктор Самойлов",
    birthDate: "1968-05-18",
    clinicId: "clinic-2",
    clinicName: "Клиника Маяк",
    modality: "CT",
    history:
      "КТ органов грудной клетки после курса лечения. Важно сравнить с предыдущим описанием и проверить качество архива.",
    status: "refused",
    isCito: false,
    createdAt: dateTime(-1, 9, 0),
    createdDay: dayKey(-1),
    dueAt: dateTime(-1, 12, 45),
    dueDay: dayKey(-1),
    studyArea: "ОГК",
    contrastLabel: "Нет",
    note: "Требуется повторная загрузка серии без поврежденных файлов.",
    assignedDoctorId: "doctor-5",
    assignedDoctorName: "Байнаева Багжан",
    refusalReason:
      "Недостаточное качество изображений, требуется перезагрузка DICOM-архива.",
    attachments: [
      { id: "file-6", name: "chest_ct_series.zip", type: "ZIP", sizeMb: 86 },
    ],
  },
  {
    id: "ST-1037",
    patientId: "PT-198",
    patientName: "Сергей Панов",
    birthDate: "1988-12-22",
    clinicId: "clinic-2",
    clinicName: "Клиника Маяк",
    modality: "MRI",
    history:
      "МРТ печени и желчных протоков как дополнение к КТ. Нужно уточнить характер очага перед консилиумом.",
    status: "new",
    isCito: false,
    createdAt: dateTime(0, 10, 50),
    createdDay: dayKey(0),
    dueAt: dateTime(1, 10, 0),
    dueDay: dayKey(1),
    studyArea: "ОБП",
    contrastLabel: "Омнискан 15 мл",
    note: "Дополнение к КТ от того же дня.",
    attachments: [
      { id: "file-7", name: "liver_mri.zip", type: "DICOM", sizeMb: 514 },
    ],
  },
  {
    id: "ST-1036",
    patientId: "PT-199",
    patientName: "Константин Зимин",
    birthDate: "1959-01-07",
    clinicId: "clinic-1",
    clinicName: "Клиника Север",
    modality: "MRI",
    history:
      "Контрольная МРТ коленного сустава после операции. Требуется загрузка заключения в PDF до конца дня.",
    status: "ready",
    isCito: false,
    createdAt: dateTime(-3, 13, 20),
    createdDay: dayKey(-3),
    dueAt: dateTime(0, 18, 0),
    dueDay: dayKey(0),
    studyArea: "ЛКС",
    contrastLabel: "Нет",
    note: "Послеоперационный контроль.",
    assignedDoctorId: "doctor-6",
    assignedDoctorName: "Сапаев Саид",
    conclusionFileName: "zimin_conclusion.pdf",
    attachments: [
      { id: "file-8", name: "knee_mri.zip", type: "DICOM", sizeMb: 432 },
    ],
  },
  {
    id: "ST-1035",
    patientId: "PT-198",
    patientName: "Сергей Панов",
    birthDate: "1988-12-22",
    clinicId: "clinic-2",
    clinicName: "Клиника Маяк",
    modality: "CT",
    history:
      "КТ брюшной полости при онкологическом маршруте. Клиника просит ответ до вечернего консилиума.",
    status: "in_progress",
    isCito: true,
    createdAt: dateTime(0, 7, 55),
    createdDay: dayKey(0),
    dueAt: dateTime(0, 15, 15),
    dueDay: dayKey(0),
    studyArea: "ОБП",
    contrastLabel: "Ультравист 100 мл",
    note: "Нужен ответ до вечернего консилиума.",
    assignedDoctorId: "doctor-1",
    assignedDoctorName: "Каримов Аслан",
    attachments: [
      { id: "file-9", name: "abdomen_ct.zip", type: "DICOM", sizeMb: 552 },
      {
        id: "file-10",
        name: "laboratory_results.pdf",
        type: "PDF",
        sizeMb: 1.3,
      },
    ],
  },
];

export const studySeed: Study[] = [
  ...baseStudySeed,
  ...buildGeneratedStudies(-1, 46, 300, 2000, 0),
  ...buildGeneratedStudies(1, 48, 500, 4000, 46),
];

export const calendarSeed: CalendarEvent[] = [
  {
    id: "event-1",
    title: "Консилиум по ST-1035",
    day: dayKey(0),
    time: "15:30",
    type: "consultation",
    clinicName: "Клиника Маяк",
    description:
      "Нужен предварительный вердикт по КТ брюшной полости до начала консилиума.",
    urgent: true,
  },
  {
    id: "event-2",
    title: "Дедлайн по ST-1042",
    day: dayKey(0),
    time: "11:30",
    type: "deadline",
    clinicName: "Клиника Север",
    description:
      "Срочное описание МРТ головного мозга. Требуется подтверждение врача.",
    urgent: true,
  },
  {
    id: "event-3",
    title: "Пакет файлов от новой клиники",
    day: dayKey(1),
    time: "09:00",
    type: "upload",
    clinicName: "Клиника Восток",
    description:
      "Ожидается загрузка архива из 340 DICOM-файлов и сопроводительного PDF.",
  },
  {
    id: "event-4",
    title: "Выдача заключения ST-1036",
    day: dayKey(0),
    time: "18:00",
    type: "report",
    clinicName: "Клиника Север",
    description: "Передача готового PDF в кабинет клиники и пациенту.",
  },
  {
    id: "event-5",
    title: "Обновление SLA по отказам",
    day: dayKey(2),
    time: "13:00",
    type: "deadline",
    clinicName: "Radiomed Core",
    description:
      "Админ сверяет причины отказов и среднее время возврата файлов на доработку.",
  },
];
