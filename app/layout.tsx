import type { Metadata } from "next";
import { cabinet, mono } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Alex Pena — AI Solutions Specialist",
  description:
    "I build AI systems, automations, and the context that makes them work.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${cabinet.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
