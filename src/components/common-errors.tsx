'use client';

import { useState } from 'react';
import { AlertTriangle, ChevronDown, HelpCircle } from 'lucide-react';

interface ErrorEntry {
  message: string;
  meaning: string;
  fix: string;
}

const ERRORS: ErrorEntry[] = [
  {
    message: 'حدث خطأ في الاتصال',
    meaning: 'الموقع لم يتمكن من الاتصال بسكريبت جوجل. عادةً هذا يعني أن خوادم جوجل مشغولة مؤقتاً، أو أن الإنترنت لديك لا يعمل.',
    fix: 'تحقق من اتصالك بالإنترنت وحاول مرة أخرى بعد قليل.',
  },
  {
    message: 'لم يتم العثور على نتيجة',
    meaning: 'الرقم القومي الذي تم إدخاله غير موجود في ورقة البيانات المحددة.',
    fix: 'تأكد من صحة الرقم القومي، وتأكد من اختيار الصف والفترة الدراسية الصحيحة.',
  },
  {
    message: 'النتائج غير متاحة حالياً',
    meaning: 'خلية "Published" (B1) في ورقة جوجل مضبوطة على FALSE.',
    fix: 'اذهب إلى ورقة جوجل، اضبط الخلية B1 على TRUE، ثم اضغط "تحديث الكاش" من القائمة.',
  },
  {
    message: 'الرقم القومي يجب أن يكون 14 رقماً',
    meaning: 'تم إدخال أقل من 14 رقماً في حقل الرقم القومي.',
    fix: 'تأكد من إدخال الرقم القومي كاملاً المكون من 14 رقماً.',
  },
];

export function CommonErrors() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="w-full max-w-lg mx-auto no-print">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl bg-card/60 backdrop-blur-sm border border-border/40 hover:border-primary/30 transition-all duration-200 text-right"
      >
        <div className="flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-primary flex-shrink-0" />
          <span className="text-sm font-bold text-foreground">
            أخطاء شائعة وحلولها
          </span>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="animate-collapse animate-collapse-visible mt-2">
          <div className="bg-card/60 backdrop-blur-sm border border-border/40 rounded-xl overflow-hidden">
            {ERRORS.map((err, index) => (
              <div
                key={index}
                className={`p-4 ${
                  index !== ERRORS.length - 1
                    ? 'border-b border-border/30'
                    : ''
                }`}
              >
                <div className="flex items-start gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm font-bold text-foreground bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                    {err.message}
                  </span>
                </div>
                <div className="mr-6 mb-1.5">
                  <span className="text-xs font-bold text-muted-foreground">المعنى: </span>
                  <span className="text-xs text-foreground/80">{err.meaning}</span>
                </div>
                <div className="mr-6">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">الحل: </span>
                  <span className="text-xs text-foreground/80">{err.fix}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
