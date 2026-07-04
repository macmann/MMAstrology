import { getAdsEnabled } from "@/lib/ad-settings";
import { ReadingsClient } from "@/app/readings/ReadingsClient";

export default async function ReadingsPage() {
  const isAdsEnabled = await getAdsEnabled();

  return <ReadingsClient view="daily" isAdsEnabled={isAdsEnabled} />;
}
