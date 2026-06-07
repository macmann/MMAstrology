# MMAstrology

A monolithic AI astrology web application built with Next.js App Router, Tailwind CSS, Prisma ORM, and PostgreSQL.

## Getting started

1. Copy the environment template and set secrets:

   ```bash
   cp .env.example .env
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Generate Prisma Client and run migrations:

   ```bash
   npm run prisma:generate
   npm run prisma:migrate -- --name init
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

## Authentication

The app uses email/password authentication with hashed passwords and an HTTP-only JWT session cookie. The `/dashboard` route is protected by Next.js middleware.
