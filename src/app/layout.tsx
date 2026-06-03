import type { Metadata } from 'next';
import { Cairo } from 'next/font/google';
import Script from 'next/script';
import { headers } from 'next/headers';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['800'],
  variable: '--font-cairo',
  display: 'swap',
});

const SITE_URL = 'https://maadi-kawmia-results.vercel.app';

export const metadata: Metadata = {
  title: 'نتيجة الامتحانات - مدرسة حدائق المعادي القومية',
  description: 'استعلم عن نتيجة الامتحانات بالرقم القومي - مدرسة حدائق المعادي القومية',
  keywords: ['نتيجة', 'امتحانات', 'مدرسة المعادي القومية', 'نتائج الطلاب'],
  icons: {
    icon: 'https://lh3.googleusercontent.com/d/1yZefhaGKwzF6d2Aglbju4i1QrFG1y3Ij',
  },
  openGraph: {
    title: 'نتيجة الامتحانات - مدرسة حدائق المعادي القومية',
    description: 'استعلم عن نتيجة الامتحانات بالرقم القومي - مدرسة حدائق المعادي القومية',
    type: 'website',
    url: SITE_URL,
    siteName: 'مدرسة حدائق المعادي القومية',
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
