export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-pattern" dir="rtl">
      <div className="flex flex-col items-center gap-4" role="status" aria-label="جاري التحميل">
        <div className="h-10 w-10 rounded-full border-4 border-muted border-t-primary animate-spin" />
        <p className="text-sm font-semibold text-muted-foreground">جاري التحميل...</p>
      </div>
    </div>
  );
}
