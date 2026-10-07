import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "../components/query-provider";

export const metadata: Metadata = {
  title: "Career Agent",
  description: "Jobbsøking med etterprøvbar erfaring og kontroll over søknaden.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nb">
      <body><QueryProvider>{children}</QueryProvider></body>
    </html>
  );
}
