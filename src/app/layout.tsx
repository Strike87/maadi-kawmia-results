import type { Metadata } from 'next';
import { Cairo } from 'next/font/google';
import Script from 'next/script';
import { headers } from 'next/headers';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['600', '700', '800'],
  variable: '--font-cairo',
  display: 'swap',
});

const SITE_URL = 'https://maadi-kawmia-results.vercel.app';

export const metadata: Metadata = {
  title: 'نتيجة الامتحانات - مدرسة حدائق المعادي القومية',
  description: 'استعلم عن نتيجة الامتحانات بالرقم القومي - مدرسة حدائق المعادي القومية',
  keywords: ['نتيجة', 'امتحانات', 'مدرسة المعادي القومية', 'نتائج الطلاب', 'نتيجة 2026'],
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: 'https://lh3.googleusercontent.com/d/1yZefhaGKwzF6d2Aglbju4i1QrFG1y3Ij',
  },
  openGraph: {
    title: 'نتيجة الامتحانات - مدرسة حدائق المعادي القومية',
    description: 'استعلم عن نتيجة الامتحانات بالرقم القومي - مدرسة حدائق المعادي القومية',
    type: 'website',
    url: SITE_URL,
    siteName: 'مدرسة حدائق المعادي القومية',
    locale: 'ar_EG',
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 400,
        height: 400,
        alt: 'مدرسة حدائق المعادي القومية - نتيجة الامتحانات',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'نتيجة الامتحانات - مدرسة حدائق المعادي القومية',
    description: 'استعلم عن نتيجة الامتحانات بالرقم القومي',
    images: [`${SITE_URL}/og-image.png`],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Read CSP nonce from middleware (set via x-csp-nonce response header)
  const headersList = await headers();
  const cspNonce = headersList.get('x-csp-nonce') || undefined;

  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        {/* Preconnect to external domains for faster resource loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://challenges.cloudflare.com" />
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="afterInteractive"
          nonce={cspNonce}
        />
      </head>
      <body
        className={`${cairo.variable} font-[family-name:var(--font-cairo)] antialiased bg-background text-foreground`}
      >
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
