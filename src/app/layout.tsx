import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MMAstrology",
  description: "AI-powered astrology guidance for modern seekers.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
