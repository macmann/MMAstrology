CREATE TYPE "AiProviderType" AS ENUM ('OPENAI', 'ANTHROPIC', 'GOOGLE', 'XAI');

ALTER TABLE "User" ADD COLUMN "isPro" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "ProviderConfig"
  ADD COLUMN "isProProvider" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "aiProvider" "AiProviderType" NOT NULL DEFAULT 'OPENAI',
  ADD COLUMN "aiModel" TEXT NOT NULL DEFAULT 'gpt-4o-mini';

UPDATE "ProviderConfig" SET "aiProvider" = 'ANTHROPIC', "aiModel" = 'claude-3-5-haiku-latest' WHERE "name" = 'Daw Nilar';
UPDATE "ProviderConfig" SET "aiProvider" = 'GOOGLE', "aiModel" = 'gemini-1.5-flash' WHERE "name" = 'Min Thet';
UPDATE "ProviderConfig" SET "aiProvider" = 'XAI', "aiModel" = 'grok-2-latest' WHERE "name" = 'Ko Tar Yar';
