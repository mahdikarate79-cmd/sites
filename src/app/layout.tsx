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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://x.venify.xyz";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Sheytoni — شیطونی | Social Community",
    template: "%s | Sheytoni",
  },
  description:
    "Sheytoni (شیطونی) is a social community platform for profiles, posts, and public discovery. Connect, share, and explore on Sheytoni.",
  keywords: [
    "Sheytoni",
    "شیطونی",
    "social platform",
    "social network",
    "community",
    "profiles",
    "posts",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "Sheytoni",
    title: "Sheytoni — شیطونی | Social Community",
    description:
      "Sheytoni (شیطونی) is a social community platform for profiles, posts, and public discovery.",
    images: [{ url: "/logo.png", width: 512, height: 512, alt: "Sheytoni" }],
  },
  twitter: {
    card: "summary",
    title: "Sheytoni — شیطونی | Social Community",
    description:
      "Sheytoni (شیطونی) is a social community platform for profiles, posts, and public discovery.",
    images: ["/logo.png"],
  },
  robots: { index: true, follow: true },
  alternates: { canonical: SITE_URL },
  icons: { icon: "/logo.png", apple: "/logo.png" },
  other: { rating: "adult" },
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Sheytoni",
              alternateName: ["شیطونی"],
              url: SITE_URL,
              description:
                "Sheytoni (شیطونی) is a social community platform for profiles, posts, and public discovery.",
              publisher: {
                "@type": "Organization",
                name: "Sheytoni",
                url: SITE_URL,
                logo: `${SITE_URL}/logo.png`,
              },
            }),
          }}
        />
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
