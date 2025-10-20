import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import PWAProvider from "@/components/PWAProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#121a2a",
};

export const metadata: Metadata = {
  title: "Unimark Admin",
  description: "Система администрирования интернет-магазина",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/unimark-logo.svg", sizes: "any", type: "image/svg+xml" },
    ],
    apple: [
      { url: "//unimark-logo.svg", sizes: "any", type: "image/svg+xml" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Unimark Admin",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "Unimark Admin",
    title: "Unimark - Admin Panel",
    description: "Система администрирования интернет-магазина",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "application-name": "Unimark Admin",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "Unimark Admin",
    "msapplication-TileColor": "#121a2a",
    "msapplication-tap-highlight": "no",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <PWAProvider>
          {children}
        </PWAProvider>
      </body>
    </html>
  );
}
