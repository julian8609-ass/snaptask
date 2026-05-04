import type { Metadata } from "next";
import Script from "next/script";
import { Manrope, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { SessionProviderWrapper } from "@/components/SessionProviderWrapper";
import { TaskProvider } from '@/context/TaskContext';

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SnapTask | Focused Task Studio",
  description: "Professional AI-assisted task planning, reflection, and momentum tracking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--bg-canvas)] text-[var(--text-primary)]">
        <Script
          src="https://www.tuqlas.com/chatbot.js"
          data-key="tq_live_105b5994d09a3ed3f328e957e85a78b0f85c22e5"
          data-api="https://www.tuqlas.com"
          strategy="afterInteractive"
        />
        <TaskProvider>
          <SessionProviderWrapper>{children}</SessionProviderWrapper>
        </TaskProvider>
      </body>
    </html>
  );
}
