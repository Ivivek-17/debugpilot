import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DebugPilot - AI Copilot for Backend Resolution",
  description: "Identify root causes, generate fixes, and resolve backend failures using multi-agent reasoning.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen antialiased bg-black`}>
        {children}
      </body>
    </html>
  );
}
