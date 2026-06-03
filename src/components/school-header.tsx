import Image from 'next/image';
import { ThemeToggle } from '@/components/theme-toggle';

export function SchoolHeader() {
  return (
    <header
      className="w-full max-w-lg mx-auto animate-fadeUp"
      role="banner"
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

        {/* Text — shrinks to fit available width */}
        <div className="flex-1 min-w-0 text-right overflow-hidden">
          <h1 className="font-extrabold leading-snug text-foreground"
            style={{ fontSize: 'clamp(11px, 3.8vw, 18px)' }}
          >
            نتائج الامتحانات
          </h1>
          <p className="font-extrabold text-muted-foreground leading-snug mt-0.5"
            style={{ fontSize: 'clamp(10px, 3.3vw, 14px)' }}
          >
            مدرسة حدائق المعادي القومية
          </p>
          <p className="font-extrabold text-primary leading-snug mt-0.5 truncate"
            style={{ fontSize: 'clamp(8px, 2.6vw, 12px)' }}
          >
            Hadayek El-Maadi El-Kawmia School
          </p>
        </div>

        {/* Theme Toggle */}
        <div className="flex-shrink-0">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
