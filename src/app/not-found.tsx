import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-pattern px-6 text-center" dir="rtl">
      <div className="space-y-6 max-w-md">
        <div className="text-8xl font-extrabold text-primary/20">404</div>
        <h1 className="text-2xl font-extrabold text-foreground">
          الصفحة غير موجودة
        </h1>
        <p className="text-muted-foreground font-semibold leading-relaxed">
          عذراً، الصفحة التي تبحث عنها غير موجودة. ربما تم نقلها أو حذفها أو أن الرابط غير صحيح.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-base hover:bg-primary/90 transition-colors"
        >
          العودة للصفحة الرئيسية
        </Link>
      </div>
    </div>
  );
}
