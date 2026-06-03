'use client';

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
import { useState, useEffect, useMemo } from 'react';
import { toast } from '@/hooks/use-toast';

interface ResultDisplayProps {
  data: StudentResult;
  onNewSearch: () => void;
}

export function ResultDisplay({ data, onNewSearch }: ResultDisplayProps) {
  const [copied, setCopied] = useState(false);
  const adv = usesAdvancedScale(data);
  const totals: ComputedTotals = useMemo(() => computeTotals(data), [data]);
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

  // Update page title when results are shown
  useEffect(() => {
    const originalTitle = document.title;
    document.title = `نتيجة ${data.stn} - المعادي القومية`;
    return () => {
      document.title = originalTitle;
    };
  }, [data.stn]);

  // Helper: get grade info based on percentage
  const getGradeInfo = (pct: number): { bg: string; text: string; badgeClass: string } => {
    if (pct >= 85) return { bg: '#2563eb', text: adv ? 'ممتاز' : 'يفوق التوقعات', badgeClass: 'grade-badge-excellent' };
    if (adv && pct >= 75) return { bg: '#16a34a', text: 'جيد جداً', badgeClass: 'grade-badge-good' };
    if (!adv && pct >= 65) return { bg: '#16a34a', text: 'يلبي التوقعات', badgeClass: 'grade-badge-good' };
    if (pct >= 50) return { bg: '#d97706', text: adv ? 'مقبول' : 'يلبي التوقعات أحياناً', badgeClass: 'grade-badge-pass' };
    return { bg: '#dc2626', text: adv ? 'دون المستوى' : 'أقل من المتوقع', badgeClass: 'grade-badge-fail' };
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
    <div className="w-full max-w-lg mx-auto space-y-3 sm:space-y-4 animate-fadeUp" aria-live="polite">
      <div className="result-container">
        {/* ========== Result Card ========== */}
        <div className="print-result-card bg-white dark:bg-card rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-[#e5e7eb] dark:border-border/50">

          {/* ===== Header Section ===== */}
          <div className="print-header px-4 pt-3 pb-1.5 text-right sm:px-6 sm:pt-5 sm:pb-3">
            <h2 className="text-base font-extrabold text-gray-900 dark:text-foreground leading-relaxed sm:text-xl">
              نتائج الامتحانات
            </h2>
            <p className="text-[12px] font-semibold text-slate-500 dark:text-muted-foreground mt-0.5 sm:text-sm" dir="ltr" style={{ textAlign: 'right' }}>
              Hadayek El-maadi El-kawmia school
            </p>
            <p className="text-sm font-bold text-black dark:text-foreground mt-0.5 sm:text-base">
              {data.termName || 'أخر العام 2026'}
            </p>
          </div>

          {/* ===== Student Data Section ===== */}
          <div className="print-student-data px-5 mt-1.5 sm:px-6 sm:mt-2">
            {/* "بيانات الطالب" Header Bar */}
            <div className="print-section-bar bg-gradient-to-br from-[#0f172a] to-[#1e3a8a] text-white py-2 px-4 rounded-t-xl text-[13px] font-bold text-center sm:text-base sm:py-2.5 flex items-center justify-center gap-2">
              <span>👨‍🎓</span>
              <span>بيانات الطالب</span>
            </div>

            {/* Student Info Rows */}
            <div className="border border-[#e5e7eb] dark:border-border border-t-0 rounded-b-xl overflow-hidden">
              <div className="print-info-row flex text-[13px] border-b border-[#e5e7eb] dark:border-border sm:text-sm">
                <div className="w-[38%] py-2.5 px-3 text-slate-500 dark:text-muted-foreground font-bold text-right border-l border-[#e5e7eb] dark:border-border sm:py-3 sm:px-4">
                  الصف الدراسي
                </div>
                <div className="w-[62%] py-2.5 px-3 text-black dark:text-foreground font-extrabold text-right sm:py-3 sm:px-4">
                  {gradeText}
                </div>
              </div>
              <div className="print-info-row flex text-[13px] border-b border-[#e5e7eb] dark:border-border sm:text-sm">
                <div className="w-[38%] py-2.5 px-3 text-slate-500 dark:text-muted-foreground font-bold text-right border-l border-[#e5e7eb] dark:border-border sm:py-3 sm:px-4">
                  الرقم القومي
                </div>
                <div className="w-[62%] py-2.5 px-3 text-black dark:text-foreground font-extrabold text-right sm:py-3 sm:px-4" dir="ltr" style={{ unicodeBidi: 'embed' }}>
                  {data.id}
                </div>
              </div>
              <div className="print-info-row flex text-[13px] sm:text-sm">
                <div className="w-[38%] py-2.5 px-3 text-slate-500 dark:text-muted-foreground font-bold text-right border-l border-[#e5e7eb] dark:border-border sm:py-3 sm:px-4">
                  اسم الطالب
                </div>
                <div className="w-[62%] py-2.5 px-3 text-black dark:text-foreground font-extrabold text-right sm:py-3 sm:px-4">
                  {data.stn}
                </div>
              </div>
            </div>
          </div>

          {/* ===== Grades Section ===== */}
          <div className="print-grades px-5 mt-2 sm:px-6 sm:mt-3">
            {/* "درجات الطالب" Header Bar */}
            <div className="print-section-bar bg-gradient-to-br from-[#0f172a] to-[#1e3a8a] text-white py-2 px-4 rounded-t-xl text-[13px] font-bold text-center sm:text-base sm:py-2.5 flex items-center justify-center gap-2">
              <span>📊</span>
              <span>درجات الطالب</span>
            </div>

            {/* "مواد مضافة للمجموع" Sub-header */}
            <div className="print-sub-bar bg-slate-500 dark:bg-slate-600 text-white py-1.5 px-4 text-[13px] font-bold text-center sm:text-sm sm:py-2">
              مواد مضافة للمجموع
            </div>

            {/* Table Header Row */}
            <div className="print-table-head flex bg-slate-700 dark:bg-slate-800 text-white text-[12px] font-bold sm:text-[13px]">
              <div className="flex-1 py-1.5 px-2 text-right border-l border-slate-600 sm:px-4 sm:py-2">المادة</div>
              <div className="flex-1 py-1.5 px-1.5 text-center border-l border-slate-600 sm:px-3 sm:py-2">الدرجة</div>
              <div className="flex-1 py-1.5 px-2 text-center sm:px-3 sm:py-2">التقدير</div>
            </div>

            {/* Subject Rows */}
            <div className="border border-[#e5e7eb] dark:border-border border-t-0">
              {totals.included.map((item, i) => {
                const pct = getSubjectPct(item);
                const grade = item.isNum ? getGradeInfo(pct) : null;
                const isEven = i % 2 === 1;
                return (
                  <div
                    key={`inc-${i}`}
                    className={`print-subject-row subject-row-transition flex items-center text-[12px] sm:text-[13px] ${
                      isEven ? 'subject-row-even' : ''
                    } ${
                      i < totals.included.length - 1 ? 'border-b border-[#e5e7eb] dark:border-border' : ''
                    }`}
                  >
                    <div className="flex-1 py-2.5 px-2 text-slate-600 dark:text-muted-foreground font-bold text-right border-l border-[#e5e7eb] dark:border-border sm:px-4 sm:py-3 leading-tight">
                      {item.clean}
                    </div>
                    <div className="flex-1 py-2.5 px-1.5 text-black dark:text-foreground font-extrabold text-center border-l border-[#e5e7eb] dark:border-border sm:px-3 sm:py-3 whitespace-nowrap">
                      {formatScore(item)}
                    </div>
                    <div className="flex-1 py-1.5 px-2 flex items-center justify-center sm:px-3 sm:py-2">
                      {grade ? (
                        <>
                          <span className={`${grade.badgeClass} sm:hidden`}>
                            {grade.text}
                          </span>
                          <span
                            className="hidden sm:inline-block text-white py-1 px-3 rounded-full text-[11px] font-extrabold whitespace-nowrap print-badge"
                            style={{ background: grade.bg }}
                          >
                            {grade.text}
                          </span>
                        </>
                      ) : (
                        <span className="text-slate-400 text-[11px] sm:text-xs">{item.rawScore}</span>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Total Row */}
              <div
                className="print-total-row flex items-center text-white text-[12px] font-bold sm:text-[14px]"
                style={{ background: totalColor }}
              >
                <div className="flex-1 py-2.5 px-2 text-right border-l border-white/20 sm:px-4 sm:py-3">
                  المجموع الكلي
                </div>
                <div className="flex-1 py-2.5 px-1.5 text-center border-l border-white/20 sm:px-3 sm:py-3 whitespace-nowrap font-extrabold text-[14px] sm:text-[18px]">
                  {totals.totalDisplay} / {totals.totalMax}
                </div>
                <div className="flex-1 py-1.5 px-2 flex items-center justify-center gap-1.5 sm:px-3 sm:gap-2">
                  <span className="font-extrabold text-[11px] sm:hidden">{totalLabel}</span>
                  <span className="text-white/80 text-[11px] font-bold sm:hidden">{totals.totalPct}%</span>
                  <span className="hidden sm:inline-block bg-white/25 text-white py-0.5 px-3 rounded-full text-[12px] font-extrabold whitespace-nowrap print-badge">
                    {totalLabel}
                  </span>
                  <span className="hidden sm:inline text-white/90 text-[13px] font-extrabold">
                    {totals.totalPct}%
                  </span>
                  <span className="hidden sm:inline text-[14px]">🏆</span>
                </div>
              </div>
            </div>

            {/* Percentage Bar — hidden in print */}
            <div className="mt-2 px-1 sm:mt-2.5 print-percentage-bar">
              <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden sm:h-2">
                <div
                  className="h-full rounded-full transition-[width] duration-1000 ease-out delay-500"
                  style={{ width: `${Math.min(totals.totalPct, 100)}%`, background: totalColor }}
                />
              </div>
            </div>
          </div>

          {/* ===== Excluded Subjects Section ===== */}
          {totals.excluded.length > 0 && (
            <div className="print-excluded px-5 mt-2 sm:px-6 sm:mt-3">
              <div className="print-sub-bar bg-slate-500 dark:bg-slate-600 text-white py-1.5 px-4 rounded-t-xl text-[13px] font-bold text-center sm:text-sm sm:py-2">
                مواد غير مضافة للمجموع
              </div>
              <div className="print-table-head flex bg-slate-700 dark:bg-slate-800 text-white text-[12px] font-bold sm:text-[13px]">
                <div className="flex-1 py-1.5 px-2 text-right border-l border-slate-600 sm:px-4 sm:py-2">المادة</div>
                <div className="flex-1 py-1.5 px-1.5 text-center border-l border-slate-600 sm:px-3 sm:py-2">الدرجة</div>
                <div className="flex-1 py-1.5 px-2 text-center sm:px-3 sm:py-2">التقدير</div>
              </div>
              <div className="border border-[#e5e7eb] dark:border-border border-t-0 rounded-b-xl overflow-hidden">
                {totals.excluded.map((item, i) => {
                  const pct = getSubjectPct(item);
                  const grade = item.isNum ? getGradeInfo(pct) : null;
                  const isEven = i % 2 === 1;
                  return (
                    <div
                      key={`exc-${i}`}
                      className={`print-subject-row subject-row-transition flex items-center text-[12px] sm:text-[13px] ${
                        isEven ? 'subject-row-even' : ''
                      } ${
                        i < totals.excluded.length - 1 ? 'border-b border-[#e5e7eb] dark:border-border' : ''
                      }`}
                    >
                      <div className="flex-1 py-2.5 px-2 text-slate-600 dark:text-muted-foreground font-bold text-right border-l border-[#e5e7eb] dark:border-border sm:px-4 sm:py-3 leading-tight">
                        {item.clean}
                      </div>
                      <div className="flex-1 py-2.5 px-1.5 text-black dark:text-foreground font-extrabold text-center border-l border-[#e5e7eb] dark:border-border sm:px-3 sm:py-3 whitespace-nowrap">
                        {formatScore(item)}
                      </div>
                      <div className="flex-1 py-1.5 px-2 flex items-center justify-center sm:px-3 sm:py-2">
                        {grade ? (
                          <>
                            <span className={`${grade.badgeClass} sm:hidden`}>
                              {grade.text}
                            </span>
                            <span
                              className="hidden sm:inline-block text-white py-1 px-3 rounded-full text-[11px] font-extrabold whitespace-nowrap print-badge"
                              style={{ background: grade.bg }}
                            >
                              {grade.text}
                            </span>
                          </>
                        ) : (
                          <span className="text-slate-400 text-[11px] sm:text-xs">{item.rawScore}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ===== Disclaimer Footer ===== */}
          <div className="print-disclaimer px-4 py-3 text-center sm:px-6 sm:py-4 border-t border-[#e5e7eb] dark:border-border/30 mt-2">
            <p className="text-[12px] font-bold text-slate-400 dark:text-muted-foreground sm:text-xs">
              هذه النتيجة استرشادية فقط ولا تعتبر مستنداً رسمياً
            </p>
            <p className="text-[10px] font-semibold text-slate-300 mt-1 sm:text-[11px]" dir="ltr">
              Designed by : Mr.Mohamed Khairy
            </p>
          </div>
        </div>

        {/* ===== Print Button (full width, on top) ===== */}
        <button
          className="print-btn no-print btn-tap w-full mt-3 h-14 rounded-2xl text-white font-bold text-base cursor-pointer transition-all duration-200 hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500 sm:mt-4"
          onClick={handlePrint}
          style={{ background: '#28a745' }}
          aria-label="طباعة شهادة النتيجة"
        >
          <span className="flex items-center justify-center gap-2">
            <Printer className="h-5 w-5" />
            طباعة الشهادة
          </span>
        </button>
      </div>

      {/* ===== Action Buttons (same height, row below print) ===== */}
      <div className="result-actions no-print flex gap-2.5 sm:gap-3">
        <Button
          onClick={onNewSearch}
          aria-label="بحث عن نتيجة أخرى"
          className="btn-tap flex-1 h-12 rounded-2xl font-bold gap-2 text-white text-sm transition-all duration-200 hover:brightness-110 sm:h-12 sm:text-base"
          style={{ background: '#001d3d' }}
        >
          <Search className="h-4 w-4" />
          بحث جديد
        </Button>
        <Button
          onClick={handleWhatsApp}
          aria-label="مشاركة عبر واتساب"
          className="btn-tap flex-1 h-12 rounded-2xl font-bold gap-2 bg-green-500 hover:bg-green-600 text-white text-sm transition-all duration-200 sm:h-12 sm:text-base"
        >
          <MessageCircle className="h-4 w-4" />
          واتساب
        </Button>
        <Button
          onClick={handleCopy}
          variant="outline"
          aria-label="نسخ النتيجة"
          className={`btn-tap flex-1 h-12 rounded-2xl font-bold gap-2 transition-all duration-200 text-sm sm:h-12 sm:text-base ${
            copied ? 'bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600' : ''
          }`}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? 'تم' : 'نسخ'}
        </Button>
      </div>
    </div>
  );
}
