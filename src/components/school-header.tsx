'use client';

import Image from 'next/image';
import { ThemeToggle } from '@/components/theme-toggle';

export function SchoolHeader() {
  return (
    <header
      className="w-full max-w-lg mx-auto animate-fadeUp"
      role="banner"
    >
      <div className="glass-header flex flex-col items-center gap-2 border border-white/20 dark:border-white/10 rounded-3xl p-3 sm:p-4">
        {/* Logo — centered on top */}
        <div className="flex-shrink-0">
          <div className="h-[56px] w-[56px] rounded-xl overflow-hidden shadow-lg ring-2 ring-primary/20 sm:h-[64px] sm:w-[64px]">
            <Image
              src="/logo.png"
              alt="شعار مدرسة حدائق المعادي القومية"
              width={64}
              height={64}
              className="object-cover w-full h-full"
              priority
            />
          </div>
        </div>

        {/* Text — centered below logo */}
        <div className="flex-1 min-w-0 text-center">
          <h1 className="text-base sm:text-lg font-extrabold leading-tight text-foreground">
            نتائج الامتحانات
          </h1>
          <p className="text-[12px] sm:text-sm font-bold text-muted-foreground leading-tight">
            مدرسة حدائق المعادي القومية
          </p>
          <p className="text-[10px] sm:text-xs font-semibold text-primary leading-tight">
            Hadayek El-Maadi El-Kawmia School
          </p>
        </div>

        {/* Theme Toggle — absolute top-left */}
        <div className="absolute top-3 left-3 sm:top-4 sm:left-4">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
