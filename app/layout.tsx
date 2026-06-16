import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CSV Insight Pilot",
  description:
    "Upload a CSV, parse and store it, and explore it in a dashboard — the riskiest end-to-end path of the SaaS, proven on a live URL.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
