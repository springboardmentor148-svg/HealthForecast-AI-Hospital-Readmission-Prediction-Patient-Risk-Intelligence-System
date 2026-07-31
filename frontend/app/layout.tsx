import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HealthForecast AI",
  description: "Hospital readmission prediction and patient risk intelligence",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
