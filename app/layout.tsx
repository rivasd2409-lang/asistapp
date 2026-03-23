import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppNavigation } from "./app-navigation";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Asistapp",
  description: "Caregiving dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-black text-white">
        <div className="min-h-full">
          <AppNavigation />
          <main className="mx-auto max-w-7xl px-4 py-6 md:px-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
