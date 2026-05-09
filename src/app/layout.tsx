import type { Metadata } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import AppShell from "@/components/AppShell";
import { ToastContainer } from "@/components/Toast";
import "./globals.css";

const bodyFont = Manrope({
  variable: "--font-body",
  subsets: ["latin", "cyrillic"],
});

const displayFont = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Radiomed",
  description:
    "Веб-приложение для обмена медицинскими исследованиями между клиниками и врачами.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`${bodyFont.variable} ${displayFont.variable}`}>
      <body>
        <AppShell>{children}</AppShell>
        <ToastContainer />
      </body>
    </html>
  );
}
