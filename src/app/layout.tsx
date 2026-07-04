import type { Metadata, Viewport } from "next";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { getAdsEnabled } from "@/lib/ad-settings";
import { LocalizationProvider } from "@/lib/localization";
import "./globals.css";

export const metadata: Metadata = {
  applicationName: "NatKhat AI",
  title: {
    default: "NatKhat AI",
    template: "%s | NatKhat AI",
  },
  description: "AI-powered astrology guidance for modern seekers.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "NatKhat AI",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [{ url: "/icons/app-icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icons/app-icon.svg", type: "image/svg+xml" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#160d36",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const isAdsEnabled = await getAdsEnabled();

  return (
    <html lang="en">
      <head>
        {isAdsEnabled ? (
          <script
            async
            src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7653377097847850"
            crossOrigin="anonymous"
          />
        ) : null}
      </head>
      <body>
        <LocalizationProvider>
          {children}
          <ServiceWorkerRegistration />
        </LocalizationProvider>
      </body>
    </html>
  );
}
