'use client';

import { GraduationCap } from 'lucide-react';

export function LoadingAnimation() {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 space-y-6 animate-fadeIn"
      role="status"
      aria-label="جاري تحميل النتيجة"
    >
      <div className="relative">
        <div className="h-20 w-20 rounded-full border-4 border-muted border-t-primary border-r-emerald-500 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <GraduationCap className="h-8 w-8 text-primary" />
        </div>
      </div>
      <p className="text-lg font-bold text-foreground animate-pulse">
        جاري البحث عن النتيجة...
      </p>
    </div>
  );
}
