'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { ThemeToggle } from '@/components/theme-toggle';

export function SchoolHeader() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="w-full max-w-lg mx-auto"
    >
      <div className="glass-header flex items-center gap-2.5 sm:gap-3 border border-white/20 dark:border-white/10 rounded-3xl p-3 sm:p-3.5">
        {/* Logo */}
        <div className="flex-shrink-0">
          <div className="h-[70px] w-[70px] rounded-xl overflow-hidden shadow-lg ring-2 ring-primary/20">
            <Image
              src="/logo.png"
              alt="شعار مدرسة حدائق المعادي القومية"
              width={70}
              height={70}
              className="object-cover w-full h-full"
              priority
            />
          </div>
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0 text-right overflow-hidden">
          <h1 className="text-base sm:text-lg font-black leading-tight text-foreground">
            نتائج الامتحانات
          </h1>
          <p className="text-[13px] sm:text-sm font-bold text-muted-foreground leading-tight">
            مدرسة حدائق المعادي القومية
          </p>
          <p className="text-[11px] sm:text-xs font-semibold text-primary leading-tight truncate">
            Hadayek El-Maadi El-Kawmia School
          </p>
        </div>

        {/* Theme Toggle */}
        <div className="flex-shrink-0">
          <ThemeToggle />
        </div>
      </div>
    </motion.header>
  );
}
