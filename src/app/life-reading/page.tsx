import { getAdsEnabled } from "@/lib/ad-settings";
import { ReadingsClient } from "@/app/readings/ReadingsClient";

export default async function LifeReadingPage() {
  const isAdsEnabled = await getAdsEnabled();

  return <ReadingsClient view="life" isAdsEnabled={isAdsEnabled} />;
}
