import { prisma } from "@/lib/prisma";

export const ADS_ENABLED_KEY = "ads-enabled";
export const DEFAULT_ADS_ENABLED = true;

export function parseAdsEnabledSetting(value: string | null | undefined) {
  if (value === undefined || value === null) {
    return DEFAULT_ADS_ENABLED;
  }

  return value.trim().toLowerCase() !== "false";
}

export function serializeAdsEnabledSetting(enabled: boolean) {
  return enabled ? "true" : "false";
}

export async function getAdsEnabled() {
  const config = await prisma.promptConfig.findUnique({
    where: { key: ADS_ENABLED_KEY },
    select: { prompt: true },
  });

  return parseAdsEnabledSetting(config?.prompt);
}
