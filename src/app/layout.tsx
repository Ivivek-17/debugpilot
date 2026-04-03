import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DebugPilot – AI Copilot for Backend Resolution",
  description:
    "Identify root causes, generate intelligent fixes, and resolve backend failures instantly using a multi-agent AI reasoning pipeline powered by Oxlo.",
  keywords: ["AI debugging", "multi-agent", "backend monitoring", "incident response", "Oxlo"],
  authors: [{ name: "DebugPilot" }],
  openGraph: {
    title: "DebugPilot – AI Copilot for Backend Resolution",
    description: "Multi-agent AI debugging system that diagnoses, generates, and evaluates fixes for backend failures.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <body className={`${inter.className} min-h-screen antialiased`}>
        {children}
      </body>
    </html>
  );
}
