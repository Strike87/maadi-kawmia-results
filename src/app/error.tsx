'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-pattern px-6 text-center" dir="rtl">
      <div className="space-y-6 max-w-md">
        <div className="text-6xl font-extrabold text-destructive/30">!</div>
        <h1 className="text-2xl font-extrabold text-foreground">
          حدث خطأ غير متوقع
        </h1>
        <p className="text-muted-foreground font-semibold leading-relaxed">
          عذراً، حدث خطأ أثناء تحميل الصفحة. يرجى المحاولة مرة أخرى.
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-base hover:bg-primary/90 transition-colors cursor-pointer"
        >
          إعادة المحاولة
        </button>
      </div>
    </div>
  );
}
