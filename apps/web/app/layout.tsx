import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Career Agent",
  description: "Jobbsøking med etterprøvbar erfaring og kontroll over søknaden.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nb">
      <body>{children}</body>
    </html>
  );
}
