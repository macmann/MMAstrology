# NatKhat AI

A monolithic AI astrology web application built with Next.js App Router, Tailwind CSS, Prisma ORM, and PostgreSQL.

## Getting started

1. Copy the environment template and set secrets:

   ```bash
   cp .env.example .env
   ```

   Required local values include `DATABASE_URL`, `JWT_SECRET`, and the AI provider keys used by the chat personas: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_GENAI_API_KEY` (or the legacy `GEMINI_API_KEY` alias), and `XAI_API_KEY`. Paste only the raw API key values into `.env` without `Bearer`, `Authorization:`, or line breaks. `ADMIN_SECRET` is required only when using the admin credit API without an admin session. Optional model override variables are included in `.env.example`.

2. Install dependencies:

   ```bash
   npm install
   ```

3. Generate Prisma Client and run migrations:

   ```bash
   npm run prisma:generate
   npm run prisma:migrate -- --name init
   ```

   If Prisma reports `EPERM` while renaming `query_engine-windows.dll.node` on Windows, stop any running `npm run dev` / `next dev` process and repair the generated client:

   ```bash
   npm run prisma:repair
   ```

   This error means the database migration may have succeeded, but the generated Prisma Client is still stale. Runtime errors such as `Unknown field name for select statement on model User` will continue until client generation succeeds.

4. Start the development server:

   ```bash
   npm run dev
   ```

## Authentication

The app uses email/password authentication with hashed passwords and an HTTP-only JWT session cookie. The `/dashboard` route is protected by Next.js middleware.

## Render deployment

Use these settings for the Render web service:

```bash
Build Command: npm install && npm run render:build
Start Command: npm start
```

`npm run render:build` runs `prisma migrate deploy`, seeds the default admin/provider data, and then runs the Next.js production build. `npm start` also runs the same Prisma deploy/seed step before launching Next.js, so a service restart repairs a newly reset or empty database before the app accepts traffic. If you configure Render manually in the dashboard, do not use only `npm run build` unless Render has already installed dependencies and you have a separate deploy step for Prisma migrations.

If you reset the Render database after a deploy and then see Prisma `P2021` errors such as `The table public.User does not exist`, restart or redeploy the web service so the `prestart` Prisma deploy step can recreate the schema on the active `DATABASE_URL`.

Required Render environment variables are `DATABASE_URL`, `JWT_SECRET`, and any AI provider keys you plan to use. The one-time overall sign reading uses `OPENAI_API_KEY` and the optional `lifereadingmodel` override, which defaults to `gpt-5.5`. The included `render.yaml` can create and link the PostgreSQL database automatically when deploying from the blueprint.

