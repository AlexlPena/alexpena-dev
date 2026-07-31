import type { Metadata } from "next";
import { cabinet, mono } from "./fonts";
import { ScrollProvider } from "@/components/providers/ScrollProvider";
import { IntroGate } from "@/components/intro/IntroGate";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://alexpena.dev"),
  title: "Alex Pena — AI Solutions Specialist",
  description:
    "I build AI systems, automations, and the context that makes them work.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${cabinet.variable} ${mono.variable}`}>
      <body>
        <ScrollProvider>
          <IntroGate />
          {children}
        </ScrollProvider>
      </body>
    </html>
  );
}
