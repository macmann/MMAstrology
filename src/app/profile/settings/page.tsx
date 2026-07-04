import { getAdsEnabled } from "@/lib/ad-settings";
import { ProfileSettingsClient } from "./ProfileSettingsClient";

export default async function ProfileSettingsPage() {
  const isAdsEnabled = await getAdsEnabled();

  return <ProfileSettingsClient isAdsEnabled={isAdsEnabled} />;
}
