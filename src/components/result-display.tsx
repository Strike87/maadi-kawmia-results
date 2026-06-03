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
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="w-full max-w-lg mx-auto space-y-3 sm:space-y-4"
    >
      <div className="result-container">
        {/* ========== Result Card ========== */}
        <div className="print-result-card bg-white dark:bg-card rounded-[28px] overflow-hidden shadow-[0_12px_30px_rgba(0,0,0,0.15)] border border-slate-200 dark:border-border/50">

          {/* ===== Header Section ===== */}
          <div className="print-header px-4 pt-3 pb-1.5 text-right sm:px-6 sm:pt-5 sm:pb-3">
            <h2 className="text-base font-black text-gray-900 dark:text-foreground leading-relaxed sm:text-xl">
              نتائج الامتحانات
            </h2>
            <p className="text-[11px] font-extrabold text-slate-500 dark:text-muted-foreground mt-0.5 sm:text-sm" dir="ltr" style={{ textAlign: 'right' }}>
              Hadayek El-maadi El-kawmia school
            </p>
            <p className="text-sm font-black text-black dark:text-foreground mt-0.5 sm:text-base">
              {data.termName || 'أخر العام 2026'}
            </p>
          </div>

          {/* ===== Student Data Section ===== */}
          <div className="print-student-data px-3 mt-1.5 sm:px-4 sm:mt-2">
            {/* "بيانات الطالب" Header Bar — Premium gradient */}
            <div className="print-section-bar bg-gradient-to-br from-[#0f172a] to-[#1e3a8a] text-white py-2.5 px-4 rounded-t-lg text-[13px] font-black text-center sm:text-base sm:py-3 flex items-center justify-center gap-2">
              <span>👨‍🎓</span>
              <span>بيانات الطالب</span>
            </div>

            {/* Student Info Rows */}
            <div className="border border-slate-400 dark:border-border border-t-0 rounded-b-lg overflow-hidden">
              <div className="print-info-row flex text-[13px] border-b border-slate-300 dark:border-border sm:text-sm">
                <div className="w-[38%] py-2.5 px-3 text-slate-600 dark:text-muted-foreground font-black text-right border-l border-slate-300 dark:border-border sm:py-3 sm:px-4">
                  الصف الدراسي
                </div>
                <div className="w-[62%] py-2.5 px-3 text-black dark:text-foreground font-black text-right sm:py-3 sm:px-4">
                  {gradeText}
                </div>
              </div>
              <div className="print-info-row flex text-[13px] border-b border-slate-300 dark:border-border sm:text-sm">
                <div className="w-[38%] py-2.5 px-3 text-slate-600 dark:text-muted-foreground font-black text-right border-l border-slate-300 dark:border-border sm:py-3 sm:px-4">
                  الرقم القومي
                </div>
                <div className="w-[62%] py-2.5 px-3 text-black dark:text-foreground font-black text-right sm:py-3 sm:px-4" dir="ltr" style={{ unicodeBidi: 'embed' }}>
                  {data.id}
                </div>
              </div>
              <div className="print-info-row flex text-[13px] sm:text-sm">
                <div className="w-[38%] py-2.5 px-3 text-slate-600 dark:text-muted-foreground font-black text-right border-l border-slate-300 dark:border-border sm:py-3 sm:px-4">
                  اسم الطالب
                </div>
                <div className="w-[62%] py-2.5 px-3 text-black dark:text-foreground font-black text-right sm:py-3 sm:px-4">
                  {data.stn}
                </div>
              </div>
            </div>
          </div>

          {/* ===== Grades Section ===== */}
          <div className="print-grades px-3 mt-2 sm:px-4 sm:mt-3">
            {/* "درجات الطالب" Header Bar — Premium gradient */}
            <div className="print-section-bar bg-gradient-to-br from-[#0f172a] to-[#1e3a8a] text-white py-2.5 px-4 rounded-t-lg text-[13px] font-black text-center sm:text-base sm:py-3 flex items-center justify-center gap-2">
              <span>📊</span>
              <span>درجات الطالب</span>
            </div>

            {/* "مواد مضافة للمجموع" Sub-header */}
            <div className="print-sub-bar bg-slate-500 dark:bg-slate-600 text-white py-1.5 px-4 text-[13px] font-black text-center sm:text-sm sm:py-2">
              مواد مضافة للمجموع
            </div>

            {/* Table Header Row */}
            <div className="print-table-head flex bg-slate-700 dark:bg-slate-800 text-white text-[12px] font-black sm:text-[13px]">
              <div className="flex-1 py-1.5 px-2 text-right border-l border-slate-600 sm:px-4 sm:py-2">المادة</div>
              <div className="flex-1 py-1.5 px-1.5 text-center border-l border-slate-600 sm:px-3 sm:py-2">الدرجة</div>
              <div className="flex-1 py-1.5 px-2 text-center sm:px-3 sm:py-2">التقدير</div>
            </div>

            {/* Subject Rows */}
            <div className="border border-slate-400 dark:border-border border-t-0">
              {totals.included.map((item, i) => {
                const pct = getSubjectPct(item);
                const grade = item.isNum ? getGradeInfo(pct) : null;
                const isEven = i % 2 === 1;
                return (
                  <motion.div
                    key={`inc-${i}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.04 }}
                    className={`print-subject-row subject-row-transition flex items-center text-[12px] sm:text-[13px] ${
                      isEven ? 'subject-row-even' : ''
                    } ${
                      i < totals.included.length - 1 ? 'border-b border-slate-200 dark:border-border' : ''
                    }`}
                  >
                    <div className="flex-1 py-2.5 px-2 text-slate-600 dark:text-muted-foreground font-black text-right border-l border-slate-200 dark:border-border sm:px-4 sm:py-3 leading-tight">
                      {item.clean}
                    </div>
                    <div className="flex-1 py-2.5 px-1.5 text-black dark:text-foreground font-black text-center border-l border-slate-200 dark:border-border sm:px-3 sm:py-3 whitespace-nowrap">
                      {formatScore(item)}
                    </div>
                    <div className="flex-1 py-1.5 px-2 flex items-center justify-center sm:px-3 sm:py-2">
                      {grade ? (
                        <>
                          {/* Mobile: colored badge pill */}
                          <span
                            className={`${grade.badgeClass} sm:hidden`}
                          >
                            {grade.text}
                          </span>
                          {/* Desktop + Print: badge pill with solid bg */}
                          <span
                            className="hidden sm:inline-block text-white py-1 px-3 rounded-full text-[11px] font-black whitespace-nowrap print-badge"
                            style={{ background: grade.bg }}
                          >
                            {grade.text}
                          </span>
                        </>
                      ) : (
                        <span className="text-slate-400 text-[10px] sm:text-xs">{item.rawScore}</span>
                      )}
                    </div>
                  </motion.div>
                );
              })}

              {/* Total Row — Premium style */}
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: totals.included.length * 0.04 + 0.1 }}
                className="print-total-row flex items-center text-white text-[12px] font-black sm:text-[14px]"
                style={{ background: totalColor }}
              >
                <div className="flex-1 py-2.5 px-2 text-right border-l border-white/20 sm:px-4 sm:py-3">
                  المجموع الكلي
                </div>
                <div className="flex-1 py-2.5 px-1.5 text-center border-l border-white/20 sm:px-3 sm:py-3 whitespace-nowrap font-black text-[14px] sm:text-[18px]">
                  {totals.totalDisplay} / {totals.totalMax}
                </div>
                <div className="flex-1 py-1.5 px-2 flex items-center justify-center gap-1.5 sm:px-3 sm:gap-2">
                  {/* Mobile: plain text */}
                  <span className="font-black text-[11px] sm:hidden">{totalLabel}</span>
                  <span className="text-white/80 text-[10px] font-black sm:hidden">{totals.totalPct}%</span>
                  {/* Desktop + Print: badge + percentage with trophy */}
                  <span className="hidden sm:inline-block bg-white/25 text-white py-0.5 px-3 rounded-full text-[12px] font-black whitespace-nowrap print-badge">
                    {totalLabel}
                  </span>
                  <span className="hidden sm:inline text-white/90 text-[13px] font-black">
                    {totals.totalPct}%
                  </span>
                  <span className="hidden sm:inline text-[14px]">🏆</span>
                </div>
              </motion.div>
            </div>

            {/* Percentage Bar — hidden in print */}
            <div className="mt-2 px-1 sm:mt-2.5 print-percentage-bar">
              <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden sm:h-2">
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
            <div className="print-excluded px-3 mt-2 sm:px-4 sm:mt-3">
              <div className="print-sub-bar bg-slate-500 dark:bg-slate-600 text-white py-1.5 px-4 rounded-t-lg text-[13px] font-black text-center sm:text-sm sm:py-2">
                مواد غير مضافة للمجموع
              </div>
              <div className="print-table-head flex bg-slate-700 dark:bg-slate-800 text-white text-[12px] font-black sm:text-[13px]">
                <div className="flex-1 py-1.5 px-2 text-right border-l border-slate-600 sm:px-4 sm:py-2">المادة</div>
                <div className="flex-1 py-1.5 px-1.5 text-center border-l border-slate-600 sm:px-3 sm:py-2">الدرجة</div>
                <div className="flex-1 py-1.5 px-2 text-center sm:px-3 sm:py-2">التقدير</div>
              </div>
              <div className="border border-slate-400 dark:border-border border-t-0 rounded-b-lg overflow-hidden">
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
                        i < totals.excluded.length - 1 ? 'border-b border-slate-200 dark:border-border' : ''
                      }`}
                    >
                      <div className="flex-1 py-2.5 px-2 text-slate-600 dark:text-muted-foreground font-black text-right border-l border-slate-200 dark:border-border sm:px-4 sm:py-3 leading-tight">
                        {item.clean}
                      </div>
                      <div className="flex-1 py-2.5 px-1.5 text-black dark:text-foreground font-black text-center border-l border-slate-200 dark:border-border sm:px-3 sm:py-3 whitespace-nowrap">
                        {formatScore(item)}
                      </div>
                      <div className="flex-1 py-1.5 px-2 flex items-center justify-center sm:px-3 sm:py-2">
                        {grade ? (
                          <>
                            <span
                              className={`${grade.badgeClass} sm:hidden`}
                            >
                              {grade.text}
                            </span>
                            <span
                              className="hidden sm:inline-block text-white py-1 px-3 rounded-full text-[11px] font-black whitespace-nowrap print-badge"
                              style={{ background: grade.bg }}
                            >
                              {grade.text}
                            </span>
                          </>
                        ) : (
                          <span className="text-slate-400 text-[10px] sm:text-xs">{item.rawScore}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ===== Disclaimer Footer (inside card — single copy) ===== */}
          <div className="print-disclaimer px-4 py-3 text-center sm:px-6 sm:py-4 border-t border-slate-100 dark:border-border/30 mt-2">
            <p className="text-[11px] font-black text-slate-500 dark:text-muted-foreground sm:text-xs">
              هذه النتيجة استرشادية فقط ولا تعتبر مستنداً رسمياً
            </p>
            <p className="text-[9px] font-extrabold text-slate-400 mt-1 sm:text-[10px]" dir="ltr">
              Designed by : Mr.Mohamed Khairy
            </p>
          </div>
        </div>

        {/* ===== Print Button (hidden in print) ===== */}
        <button
          className="print-btn no-print btn-tap w-full mt-3 py-3.5 rounded-2xl text-white font-bold text-base cursor-pointer transition-all duration-300 hover:opacity-90 hover:shadow-lg sm:mt-4 sm:py-4 sm:text-lg"
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
          className={`btn-tap flex-1 h-14 rounded-2xl font-bold gap-2 transition-all duration-300 text-base sm:h-14 sm:text-lg ${
            copied ? 'bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600' : ''
          }`}
        >
          {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
          {copied ? 'تم النسخ' : 'نسخ'}
        </Button>
        <Button
          onClick={handleWhatsApp}
          className="btn-tap flex-1 h-14 rounded-2xl font-bold gap-2 bg-green-500 hover:bg-green-600 text-white text-base sm:h-14 sm:text-lg"
        >
          <MessageCircle className="h-5 w-5" />
          واتساب
        </Button>
        <Button
          onClick={onNewSearch}
          className="btn-tap flex-1 h-14 rounded-2xl font-bold gap-2 text-white text-base sm:h-14 sm:text-lg"
          style={{ background: '#001d3d' }}
        >
          <Search className="h-5 w-5" />
          بحث جديد
        </Button>
      </div>
    </motion.div>
  );
}
