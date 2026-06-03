import type { Metadata } from 'next';
import { Cairo } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['700', '800'],
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          strategy="lazyOnload"
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
