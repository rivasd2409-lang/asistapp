import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  description: "Panel de cuidado familiar",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var savedTheme = window.localStorage.getItem("asistapp-theme") || "light";
                  document.documentElement.dataset.theme = savedTheme;
                } catch (error) {
                  document.documentElement.dataset.theme = "light";
                }
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full bg-[var(--bg)] text-[var(--text)]">
        {children}
      </body>
    </html>
  );
}
