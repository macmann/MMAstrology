import type { Metadata, Viewport } from "next";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { LocalizationProvider } from "@/lib/localization";
import "./globals.css";

export const metadata: Metadata = {
  applicationName: "AI Bay Din",
  title: {
    default: "AI Bay Din",
    template: "%s | AI Bay Din",
  },
  description: "AI-powered astrology guidance for modern seekers.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AI Bay Din",
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

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <LocalizationProvider>
          {children}
          <ServiceWorkerRegistration />
        </LocalizationProvider>
      </body>
    </html>
  );
}
