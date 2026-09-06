import type { Metadata, Viewport } from "next";

import "./globals.css";
import { ThemeProvider } from "../components/theme-provider";
import { PwaRegistration } from "../components/pwa-registration";
import { OfflineNavigation } from "../components/offline-navigation";

export const metadata: Metadata = {
  title: "KnivesOut",
  description: "O seu diário de restaurantes",
  applicationName: "KnivesOut",
  formatDetection: {
    telephone: false,
  },
  appleWebApp: {
    capable: true,
    title: "KnivesOut",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-PT" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <PwaRegistration />
          <OfflineNavigation />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
