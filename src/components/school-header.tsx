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
      <div className="flex items-center gap-4 bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-4 shadow-lg">
        {/* Logo */}
        <div className="flex-shrink-0">
          <div className="h-20 w-20 rounded-xl overflow-hidden shadow-lg ring-2 ring-primary/20">
            <Image
              src="https://lh3.googleusercontent.com/d/1yZefhaGKwzF6d2Aglbju4i1QrFG1y3Ij"
              alt="شعار مدرسة حدائق المعادي القومية"
              width={80}
              height={80}
              className="object-cover w-full h-full"
              unoptimized
            />
          </div>
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0 text-right">
          <h1 className="text-xl font-black leading-tight text-foreground">
            نتائج الامتحانات
          </h1>
          <p className="text-sm font-bold text-muted-foreground mt-1">
            مدرسة حدائق المعادي القومية
          </p>
          <p className="text-xs font-semibold text-primary mt-0.5">
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
