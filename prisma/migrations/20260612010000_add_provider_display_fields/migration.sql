ALTER TABLE "ProviderConfig" ADD COLUMN "displayName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "ProviderConfig" ADD COLUMN "description" TEXT NOT NULL DEFAULT '';

UPDATE "ProviderConfig"
SET "displayName" = "name"
WHERE "displayName" = '';

UPDATE "ProviderConfig"
SET "description" = CASE "name"
  WHEN 'Sayar Gyi' THEN 'Ancient Myanmar wisdom with clear timing and grounded answers.'
  WHEN 'Daw Nilar' THEN 'Gentle readings for love, healing, and emotional clarity.'
  WHEN 'Min Thet' THEN 'Practical star-powered advice for decisions and next steps.'
  WHEN 'Ko Tar Yar' THEN 'Witty, direct insights that cut through confusion with heart.'
  ELSE "description"
END
WHERE "description" = '';
