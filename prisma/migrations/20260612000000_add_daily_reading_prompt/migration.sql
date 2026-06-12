ALTER TABLE "AstrologicalProfile"
  ADD COLUMN "dailyReadingEn" TEXT,
  ADD COLUMN "dailyReadingMy" TEXT,
  ADD COLUMN "dailyReadingDate" TIMESTAMP(3);

CREATE TABLE "PromptConfig" (
  "key" TEXT NOT NULL,
  "prompt" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PromptConfig_pkey" PRIMARY KEY ("key")
);
