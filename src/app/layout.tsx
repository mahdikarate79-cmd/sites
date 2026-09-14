import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/lib/hooks/useTheme";
import { AuthProvider } from "@/lib/hooks/useAuth";
import { PrototypeProvider } from "@/lib/hooks/usePrototype";
import { TelegramGateProvider } from "@/lib/hooks/useTelegramGate";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { DeletedAccountGate } from "@/components/auth/DeletedAccountGate";
import { BannedAccountGate } from "@/components/auth/BannedAccountGate";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Sheytoni",
  description: "Modern social media platform",
  icons: { icon: "/logo.png", apple: "/logo.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  minimumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
        <ThemeProvider>
          <AuthProvider>
            <PrototypeProvider>
              <TelegramGateProvider>
                <ToastProvider>
                  <BannedAccountGate>
                    <DeletedAccountGate>{children}</DeletedAccountGate>
                  </BannedAccountGate>
                </ToastProvider>
              </TelegramGateProvider>
            </PrototypeProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
