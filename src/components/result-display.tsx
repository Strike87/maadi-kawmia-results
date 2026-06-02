'use client';

import { motion } from 'framer-motion';
import {
  Copy,
  MessageCircle,
  Printer,
  Search,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  type StudentResult,
  type ComputedTotals,
  type SubjectItem,
  computeTotals,
  usesAdvancedScale,
  gradeLabel,
  gradeColor,
  isAbsenceCode,
  buildShareLines,
  GRADE_MAP,
} from '@/lib/constants';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

interface ResultDisplayProps {
  data: StudentResult;
  onNewSearch: () => void;
}

// Short grade labels for mobile (to prevent overlap in narrow columns)
function shortGradeLabel(pct: number, adv: boolean): string {
  if (adv) {
    if (pct >= 85) return 'ممتاز';
    if (pct >= 75) return 'جيد جداً';
    if (pct >= 65) return 'جيد';
    if (pct >= 50) return 'مقبول';
    return 'دون المستوى';
  }
  if (pct >= 85) return 'يفوق التوقعات';
  if (pct >= 65) return 'يلبي التوقعات';
  if (pct >= 50) return 'أقل';
  return 'أقل من المتوقع';
}

export function ResultDisplay({ data, onNewSearch }: ResultDisplayProps) {
  const [copied, setCopied] = useState(false);
  const adv = usesAdvancedScale(data);
  const totals: ComputedTotals = computeTotals(data);
  const totalLabel = gradeLabel(totals.totalPct, adv);
  const totalColor = gradeColor(totals.totalPct, adv);
  const gradeText = data.clLabel || GRADE_MAP[data.cl] || data.cl;

  const handleCopy = async () => {
    const text = buildShareLines(data, false).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({ title: 'تم النسخ بنجاح!' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: 'فشل النسخ', variant: 'destructive' });
    }
  };

  const handleWhatsApp = () => {
    const text = buildShareLines(data, true).join('\n');
    window.open(
      'https://wa.me/?text=' + encodeURIComponent(text),
      '_blank',
      'noopener'
    );
  };

  const handlePrint = () => {
    window.print();
  };

  // Helper: get grade badge based on percentage
  const getGradeBadge = (pct: number): { bg: string; text: string; shortText: string } => {
    if (pct >= 85) return { bg: '#2563eb', text: adv ? 'ممتاز' : 'يفوق التوقعات', shortText: adv ? 'ممتاز' : 'يفوق' };
    if (adv && pct >= 75) return { bg: '#16a34a', text: 'جيد جداً', shortText: 'جيد جداً' };
    if (!adv && pct >= 65) return { bg: '#16a34a', text: 'يلبي التوقعات', shortText: 'يلبي' };
    if (pct >= 50) return { bg: '#d97706', text: adv ? 'مقبول' : 'يلبي التوقعات أحياناً', shortText: adv ? 'مقبول' : 'أحياناً' };
    return { bg: '#dc2626', text: adv ? 'دون المستوى' : 'أقل من المتوقع', shortText: 'دون' };
  };

  // Calculate subject percentage
  const getSubjectPct = (item: SubjectItem): number => {
    if (!item.isNum || item.maxScore === 0) return 0;
    return Math.round((item.score / item.maxScore) * 100);
  };

  // Format score display
  const formatScore = (item: SubjectItem): string => {
    if (item.isNum) {
      return `${item.score} / ${item.maxScore}`;
    }
    if (isAbsenceCode(item.rawScore)) {
      const raw = String(item.rawScore).trim();
      return raw === '' || raw === '-' ? '—' : raw;
    }
    return item.rawScore;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="w-full max-w-lg mx-auto space-y-3 sm:space-y-4"
    >
      <div className="result-container">
        {/* ========== Result Card ========== */}
        <div className="print-result-card bg-white dark:bg-card rounded-xl sm:rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-border/50">

          {/* ===== Header Section ===== */}
          <div className="px-4 pt-4 pb-2 text-right sm:px-6 sm:pt-5 sm:pb-3">
            <h2 className="text-lg font-black text-gray-900 dark:text-foreground leading-relaxed sm:text-xl">
              نتائج الامتحانات
            </h2>
            <p className="text-xs font-extrabold text-slate-500 dark:text-muted-foreground mt-0.5 sm:text-sm" dir="ltr" style={{ textAlign: 'right' }}>
              Hadayek El-maadi El-kawmia school
            </p>
            <p className="text-sm font-black text-black dark:text-foreground mt-1 sm:text-base">
              {data.termName || 'أخر العام 2026'}
            </p>
          </div>

          {/* ===== Student Data Section ===== */}
          <div className="px-3 mt-2 sm:px-4">
            {/* "بيانات الطالب" Header Bar */}
            <div className="bg-[#172033] text-white py-2.5 px-4 rounded-t-lg text-sm font-black text-center sm:text-base sm:py-3">
              بيانات الطالب
            </div>

            {/* Student Info Rows */}
            <div className="border border-slate-400 dark:border-border border-t-0 rounded-b-lg overflow-hidden">
              {/* Row: الصف الدراسي */}
              <div className="flex text-sm border-b border-slate-300 dark:border-border">
                <div className="w-[38%] py-2.5 px-3 text-slate-600 dark:text-muted-foreground font-black text-right border-l border-slate-300 dark:border-border sm:w-[35%] sm:px-4 sm:py-3 sm:text-base">
                  الصف الدراسي
                </div>
                <div className="w-[62%] py-2.5 px-3 text-black dark:text-foreground font-black text-right sm:w-[65%] sm:px-4 sm:py-3 sm:text-base">
                  {gradeText}
                </div>
              </div>

              {/* Row: الرقم القومي */}
              <div className="flex text-sm border-b border-slate-300 dark:border-border">
                <div className="w-[38%] py-2.5 px-3 text-slate-600 dark:text-muted-foreground font-black text-right border-l border-slate-300 dark:border-border sm:w-[35%] sm:px-4 sm:py-3 sm:text-base">
                  الرقم القومي
                </div>
                <div className="w-[62%] py-2.5 px-3 text-black dark:text-foreground font-black text-right sm:w-[65%] sm:px-4 sm:py-3 sm:text-base" dir="ltr" style={{ unicodeBidi: 'embed' }}>
                  {data.id}
                </div>
              </div>

              {/* Row: اسم الطالب */}
              <div className="flex text-sm">
                <div className="w-[38%] py-2.5 px-3 text-slate-600 dark:text-muted-foreground font-black text-right border-l border-slate-300 dark:border-border sm:w-[35%] sm:px-4 sm:py-3 sm:text-base">
                  اسم الطالب
                </div>
                <div className="w-[62%] py-2.5 px-3 text-black dark:text-foreground font-black text-right sm:w-[65%] sm:px-4 sm:py-3 sm:text-base">
                  {data.stn}
                </div>
              </div>
            </div>
          </div>

          {/* ===== Grades Section ===== */}
          <div className="px-3 mt-3 sm:px-4 sm:mt-4">
            {/* "درجات الطالب" Header Bar */}
            <div className="bg-[#172033] text-white py-2.5 px-4 rounded-t-lg text-sm font-black text-center sm:text-base sm:py-3">
              درجات الطالب
            </div>

            {/* "مواد مضافة للمجموع" Sub-header */}
            <div className="bg-slate-500 dark:bg-slate-600 text-white py-2 px-4 text-sm font-black text-center sm:text-base">
              مواد مضافة للمجموع
            </div>

            {/* Table Header Row */}
            <div className="flex bg-slate-700 dark:bg-slate-800 text-white text-[13px] font-black sm:text-sm">
              <div className="flex-[5] py-2 px-3 text-right border-l border-slate-600 sm:px-4 sm:py-2.5">المادة</div>
              <div className="flex-[3] py-2 px-2 text-center border-l border-slate-600 sm:px-3 sm:py-2.5">الدرجة</div>
              <div className="flex-[4] py-2 px-2 text-center sm:px-3 sm:py-2.5">التقدير</div>
            </div>

            {/* Subject Rows */}
            <div className="border border-slate-400 dark:border-border border-t-0">
              {totals.included.map((item, i) => {
                const pct = getSubjectPct(item);
                const badge = item.isNum ? getGradeBadge(pct) : null;
                return (
                  <motion.div
                    key={`inc-${i}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.04 }}
                    className={`flex items-center text-[13px] sm:text-sm ${
                      i < totals.included.length - 1 ? 'border-b border-slate-200 dark:border-border' : ''
                    }`}
                  >
                    <div className="flex-[5] py-2.5 px-3 text-slate-600 dark:text-muted-foreground font-black text-right border-l border-slate-200 dark:border-border sm:px-4 sm:py-3 sm:text-sm leading-tight">
                      {item.clean}
                    </div>
                    <div className="flex-[3] py-2.5 px-2 text-black dark:text-foreground font-black text-center border-l border-slate-200 dark:border-border sm:px-3 sm:py-3 sm:text-sm whitespace-nowrap">
                      {formatScore(item)}
                    </div>
                    <div className="flex-[4] py-1 px-1.5 flex items-center justify-center sm:px-2 sm:py-2">
                      {badge ? (
                        <span
                          className="text-white py-1 px-2 rounded-full text-[10px] leading-tight font-black whitespace-nowrap sm:text-[11px] sm:px-2.5 sm:py-1"
                          style={{ background: badge.bg }}
                        >
                          {/* Short text on mobile, full text on sm+ */}
                          <span className="sm:hidden">{badge.shortText}</span>
                          <span className="hidden sm:inline">{badge.text}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs sm:text-sm">{item.rawScore}</span>
                      )}
                    </div>
                  </motion.div>
                );
              })}

              {/* Total Row */}
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: totals.included.length * 0.04 + 0.1 }}
                className="flex items-center text-white text-[13px] font-black sm:text-sm"
                style={{ background: totalColor }}
              >
                <div className="flex-[5] py-3 px-3 text-right border-l border-white/20 sm:px-4 sm:py-4 sm:text-sm">
                  المجموع الكلي
                </div>
                <div className="flex-[3] py-3 px-2 text-center border-l border-white/20 sm:px-3 sm:py-4 sm:text-sm whitespace-nowrap">
                  {totals.totalDisplay} / {totals.totalMax}
                </div>
                <div className="flex-[4] py-2 px-1.5 flex flex-col items-center justify-center gap-0.5 sm:px-2 sm:gap-1">
                  <span className="bg-white/25 text-white py-0.5 px-2 rounded-full text-[10px] font-black whitespace-nowrap sm:text-[11px] sm:px-2.5 sm:py-1">
                    {totalLabel}
                  </span>
                  <span className="text-white/90 text-[11px] font-black sm:text-xs">
                    {totals.totalPct}%
                  </span>
                </div>
              </motion.div>
            </div>

            {/* Percentage Bar */}
            <div className="mt-2 px-1 sm:mt-3 print-percentage-bar">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-slate-500 dark:text-muted-foreground sm:text-xs">النسبة المئوية</span>
                <span className="text-[11px] font-black sm:text-xs" style={{ color: totalColor }}>{totals.totalPct}%</span>
              </div>
              <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden sm:h-2.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(totals.totalPct, 100)}%` }}
                  transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ background: totalColor }}
                />
              </div>
            </div>
          </div>

          {/* ===== Excluded Subjects Section ===== */}
          {totals.excluded.length > 0 && (
            <div className="px-3 mt-3 sm:px-4 sm:mt-4">
              <div className="bg-slate-500 dark:bg-slate-600 text-white py-2 px-4 rounded-t-lg text-sm font-black text-center sm:text-base">
                مواد غير مضافة للمجموع
              </div>
              <div className="flex bg-slate-700 dark:bg-slate-800 text-white text-[13px] font-black sm:text-sm">
                <div className="flex-[5] py-2 px-3 text-right border-l border-slate-600 sm:px-4 sm:py-2.5">المادة</div>
                <div className="flex-[3] py-2 px-2 text-center border-l border-slate-600 sm:px-3 sm:py-2.5">الدرجة</div>
                <div className="flex-[4] py-2 px-2 text-center sm:px-3 sm:py-2.5">التقدير</div>
              </div>
              <div className="border border-slate-400 dark:border-border border-t-0 rounded-b-lg overflow-hidden">
                {totals.excluded.map((item, i) => {
                  const pct = getSubjectPct(item);
                  const badge = item.isNum ? getGradeBadge(pct) : null;
                  return (
                    <div
                      key={`exc-${i}`}
                      className={`flex items-center text-[13px] sm:text-sm ${
                        i < totals.excluded.length - 1 ? 'border-b border-slate-200 dark:border-border' : ''
                      }`}
                    >
                      <div className="flex-[5] py-2.5 px-3 text-slate-600 dark:text-muted-foreground font-black text-right border-l border-slate-200 dark:border-border sm:px-4 sm:py-3 sm:text-sm leading-tight">
                        {item.clean}
                      </div>
                      <div className="flex-[3] py-2.5 px-2 text-black dark:text-foreground font-black text-center border-l border-slate-200 dark:border-border sm:px-3 sm:py-3 sm:text-sm whitespace-nowrap">
                        {formatScore(item)}
                      </div>
                      <div className="flex-[4] py-1 px-1.5 flex items-center justify-center sm:px-2 sm:py-2">
                        {badge ? (
                          <span
                            className="text-white py-1 px-2 rounded-full text-[10px] leading-tight font-black whitespace-nowrap sm:text-[11px] sm:px-2.5 sm:py-1"
                            style={{ background: badge.bg }}
                          >
                            <span className="sm:hidden">{badge.shortText}</span>
                            <span className="hidden sm:inline">{badge.text}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs sm:text-sm">{item.rawScore}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ===== Disclaimer Footer ===== */}
          <div className="print-disclaimer px-4 py-4 text-center sm:px-6 sm:py-5">
            <p className="text-xs font-black text-black dark:text-foreground sm:text-sm">
              هذه النتيجة استرشادية فقط ولا تعتبر مستنداً رسمياً
            </p>
            <p className="text-[10px] font-extrabold text-slate-400 mt-1.5 sm:text-xs" dir="ltr">
              Designed by : Mr.Mohamed Khairy
            </p>
          </div>
        </div>

        {/* ===== Print Button (hidden in print) ===== */}
        <button
          className="print-btn no-print w-full mt-3 py-3.5 rounded-xl text-white font-bold text-base cursor-pointer transition-all duration-300 hover:opacity-90 active:scale-[0.98] sm:mt-4 sm:py-4 sm:text-lg"
          onClick={handlePrint}
          style={{ background: '#28a745' }}
        >
          <span className="flex items-center justify-center gap-2">
            <Printer className="h-5 w-5" />
            طباعة الشهادة
          </span>
        </button>
      </div>

      {/* ===== Action Buttons (hidden from print) ===== */}
      <div className="result-actions no-print flex gap-2.5 sm:gap-3">
        <Button
          onClick={handleCopy}
          variant="outline"
          className={`flex-1 h-12 rounded-xl font-bold gap-2 transition-all duration-300 text-sm sm:h-13 sm:text-base ${
            copied ? 'bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600' : ''
          }`}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? 'تم النسخ' : 'نسخ'}
        </Button>
        <Button
          onClick={handleWhatsApp}
          className="flex-1 h-12 rounded-xl font-bold gap-2 bg-green-500 hover:bg-green-600 text-white text-sm sm:h-13 sm:text-base"
        >
          <MessageCircle className="h-4 w-4" />
          واتساب
        </Button>
        <Button
          onClick={onNewSearch}
          className="flex-1 h-12 rounded-xl font-bold gap-2 text-white text-sm sm:h-13 sm:text-base"
          style={{ background: '#001d3d' }}
        >
          <Search className="h-4 w-4" />
          بحث جديد
        </Button>
      </div>
    </motion.div>
  );
}
