# Radiomed Frontend

Next.js 16 frontend для системы обмена медицинскими исследованиями между клиниками и врачами.

## Что есть в проекте

- `Next.js 16`, `React 19`, `TypeScript`
- `Tailwind CSS 4`
- `react-hook-form + zod` для валидации форм
- интеграция с NestJS backend через `NEXT_PUBLIC_API_URL`
- адаптивные страницы: календарь, все пациенты, мои пациенты, статистика, профиль, логин, регистрация, админ-панель
- главная страница перенаправляет на минималистичный список пациентов

## Структура

```text
src/
  app/
    page.tsx
    calendar/page.tsx
    patients/page.tsx
    my-patients/page.tsx
    statistics/page.tsx
    profile/page.tsx
    login/page.tsx
    register/page.tsx
    admin/page.tsx
  components/
  lib/
  types/
  proxy.ts
```

## Запуск

```bash
npm install
cp .env.example .env.local
npm run dev
```

Приложение стартует на `http://localhost:3001`.

## Переменные окружения

```env
NEXT_PUBLIC_API_URL=http://localhost:3002/api
```

Если `npm install` в текущем окружении зависает на прогрессе, используйте:

```bash
CI=1 npm install --no-progress --no-fund --no-audit --loglevel=error
```

## Production Deploy

- Vercel project root: `front-project`
- Основная переменная: `NEXT_PUBLIC_API_URL=https://<railway-domain>/api`
- После привязки Vercel-домена его нужно добавить в `CORS_ORIGIN` на backend

Полная инструкция: [../DEPLOY.md](../DEPLOY.md)
