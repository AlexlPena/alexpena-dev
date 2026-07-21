import localFont from "next/font/local";
import { JetBrains_Mono } from "next/font/google";

export const cabinet = localFont({
  src: "./cabinet-grotesk/CabinetGrotesk-Variable.woff2",
  weight: "100 900",
  display: "swap",
  variable: "--font-cabinet",
});

export const mono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});
