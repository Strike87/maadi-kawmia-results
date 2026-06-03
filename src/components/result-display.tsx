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

/* ── Shared clamp() font sizes for the result table ── */
const fz = {
  heading:   { fontSize: 'clamp(12px, 3.6vw, 20px)' },
  subtext:   { fontSize: 'clamp(9px, 2.6vw, 13px)' },
  term:      { fontSize: 'clamp(10px, 3vw, 15px)' },
  sectionBar:{ fontSize: 'clamp(10px, 3vw, 15px)' },
  subBar:    { fontSize: 'clamp(9px, 2.6vw, 13px)' },
  tableHead: { fontSize: 'clamp(8px, 2.4vw, 12px)' },
  row:       { fontSize: 'clamp(9px, 2.6vw, 13px)' },
  score:     { fontSize: 'clamp(9px, 2.6vw, 13px)' },
  badge:     { fontSize: 'clamp(7px, 2vw, 11px)' },
  totalRow:  { fontSize: 'clamp(10px, 3vw, 14px)' },
  totalScore:{ fontSize: 'clamp(11px, 3.4vw, 18px)' },
  mobileBadge:{ fontSize: 'clamp(7px, 2vw, 11px)' },
  pctText:   { fontSize: 'clamp(7px, 2vw, 11px)' },
  disclaimer:{ fontSize: 'clamp(7px, 2vw, 12px)' },
  credit:    { fontSize: 'clamp(6px, 1.8vw, 11px)' },
} as const;

/* ── Fixed column widths (percentage) for vertical alignment ── */
const col = {
  subject: 'w-[45%]',   // المادة — widest, subject names
  score:   'w-[25%]',   // الدرجة — e.g. "15 / 20"
  grade:   'w-[30%]',   // التقدير — badge or text
} as const;

/* ── Shared row cell classes (padding via clamp) ── */
const cellPad = 'py-[clamp(6px,1.6vw,12px)] px-[clamp(4px,1vw,16px)]';

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

  useEffect(() => {
    const originalTitle = document.title;
    document.title = `نتيجة ${data.stn} - المعادي القومية`;
    return () => { document.title = originalTitle; };
  }, [data.stn]);

  const getGradeInfo = (pct: number): { bg: string; text: string; badgeClass: string } => {
    if (pct >= 85) return { bg: '#2563eb', text: adv ? 'ممتاز' : 'يفوق التوقعات', badgeClass: 'grade-badge-excellent' };
    if (adv && pct >= 75) return { bg: '#16a34a', text: 'جيد جداً', badgeClass: 'grade-badge-good' };
    if (!adv && pct >= 65) return { bg: '#16a34a', text: 'يلبي التوقعات', badgeClass: 'grade-badge-good' };
    if (pct >= 50) return { bg: '#d97706', text: adv ? 'مقبول' : 'يلبي التوقعات أحياناً', badgeClass: 'grade-badge-pass' };
    return { bg: '#dc2626', text: adv ? 'دون المستوى' : 'أقل من المتوقع', badgeClass: 'grade-badge-fail' };
  };

  const getSubjectPct = (item: SubjectItem): number => {
    if (!item.isNum || item.maxScore === 0) return 0;
    return Math.round((item.score / item.maxScore) * 100);
  };

  const formatScore = (item: SubjectItem): string => {
    if (item.isNum) return `${item.score} / ${item.maxScore}`;
    if (isAbsenceCode(item.rawScore)) {
      const raw = String(item.rawScore).trim();
      return raw === '' || raw === '-' ? '—' : raw;
    }
    return item.rawScore;
  };

  /* ── Reusable grade badge renderer ── */
  const GradeBadge = ({ grade }: { grade: { bg: string; text: string; badgeClass: string } | null }) => {
    if (!grade) return <span className="text-slate-400" style={fz.badge}>—</span>;
    return (
      <span
        className="text-white py-[2px] px-[clamp(4px,1vw,12px)] rounded-full font-extrabold whitespace-nowrap print-badge"
        style={{ background: grade.bg, ...fz.badge }}
      >
        {grade.text}
      </span>
    );
  };

  /* ── Reusable table header row ── */
  const TableHeader = () => (
    <div className="print-table-head flex bg-slate-700 dark:bg-slate-800 text-white font-bold">
      <div className={`${col.subject} ${cellPad} text-right border-l border-slate-600`} style={fz.tableHead}>المادة</div>
      <div className={`${col.score} ${cellPad} text-center border-l border-slate-600`} style={fz.tableHead}>الدرجة</div>
      <div className={`${col.grade} ${cellPad} text-center`} style={fz.tableHead}>التقدير</div>
    </div>
  );

  /* ── Reusable subject row ── */
  const SubjectRow = ({ item, i, total, isLast }: { item: SubjectItem; i: number; total: number; isLast: boolean }) => {
    const pct = getSubjectPct(item);
    const grade = item.isNum ? getGradeInfo(pct) : null;
    const isEven = i % 2 === 1;
    return (
      <div
        className={`print-subject-row subject-row-transition flex items-center ${
          isEven ? 'subject-row-even' : ''
        } ${!isLast ? 'border-b border-[#e5e7eb] dark:border-border' : ''}`}
      >
        <div className={`${col.subject} ${cellPad} text-slate-600 dark:text-muted-foreground font-semibold text-right border-l border-[#e5e7eb] dark:border-border leading-tight`} style={fz.row}>
          {item.clean}
        </div>
        <div className={`${col.score} ${cellPad} text-black dark:text-foreground font-bold text-center border-l border-[#e5e7eb] dark:border-border whitespace-nowrap`} style={fz.score}>
          {formatScore(item)}
        </div>
        <div className={`${col.grade} ${cellPad} flex items-center justify-center`}>
          <GradeBadge grade={grade} />
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-lg mx-auto space-y-3 sm:space-y-4 animate-fadeUp" aria-live="polite">
      <div className="result-container">
        {/* ========== Result Card ========== */}
        <div className="print-result-card bg-white dark:bg-card rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-[#e5e7eb] dark:border-border/50">

          {/* ===== Header Section ===== */}
          <div className="print-header px-[clamp(12px,3vw,24px)] pt-[clamp(8px,2vw,20px)] pb-[clamp(4px,1vw,12px)] text-right">
            <h2 className="font-extrabold text-gray-900 dark:text-foreground leading-relaxed" style={fz.heading}>
              نتائج الامتحانات
            </h2>
            <p className="font-semibold text-slate-500 dark:text-muted-foreground mt-0.5" dir="ltr" style={{ textAlign: 'right', ...fz.subtext }}>
              Hadayek El-maadi El-kawmia school
            </p>
            <p className="font-bold text-black dark:text-foreground mt-0.5" style={fz.term}>
              {data.termName || 'أخر العام 2026'}
            </p>
          </div>

          {/* ===== Student Data Section ===== */}
          <div className="print-student-data px-[clamp(12px,3vw,24px)] mt-[clamp(4px,1vw,8px)]">
            {/* "بيانات الطالب" Header Bar */}
            <div className="print-section-bar bg-gradient-to-br from-[#0f172a] to-[#1e3a8a] text-white py-[clamp(5px,1.4vw,10px)] px-4 rounded-t-xl font-bold text-center flex items-center justify-center gap-2" style={fz.sectionBar}>
              <span>👨‍🎓</span>
              <span>بيانات الطالب</span>
            </div>

            {/* Student Info Rows — label col matches subject col, value spans score+grade */}
            <div className="border border-[#e5e7eb] dark:border-border border-t-0 rounded-b-xl overflow-hidden">
              {[
                { label: 'الصف الدراسي', value: gradeText },
                { label: 'الرقم القومي', value: data.id, dir: 'ltr' as const, unicodeBidi: 'embed' as const },
                { label: 'اسم الطالب', value: data.stn },
              ].map((row, idx, arr) => (
                <div
                  key={row.label}
                  className={`print-info-row flex ${idx < arr.length - 1 ? 'border-b border-[#e5e7eb] dark:border-border' : ''}`}
                  style={fz.row}
                >
                  <div className={`${col.subject} ${cellPad} text-slate-500 dark:text-muted-foreground font-semibold text-right border-l border-[#e5e7eb] dark:border-border`}>
                    {row.label}
                  </div>
                  <div className={`w-[55%] ${cellPad} text-black dark:text-foreground font-bold text-right`} dir={row.dir} style={row.unicodeBidi ? { unicodeBidi: row.unicodeBidi } : undefined}>
                    {row.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ===== Grades Section ===== */}
          <div className="print-grades px-[clamp(12px,3vw,24px)] mt-[clamp(6px,1.6vw,12px)]">
            {/* "درجات الطالب" Header Bar */}
            <div className="print-section-bar bg-gradient-to-br from-[#0f172a] to-[#1e3a8a] text-white py-[clamp(5px,1.4vw,10px)] px-4 rounded-t-xl font-bold text-center flex items-center justify-center gap-2" style={fz.sectionBar}>
              <span>📊</span>
              <span>درجات الطالب</span>
            </div>

            {/* "مواد مضافة للمجموع" Sub-header */}
            <div className="print-sub-bar bg-slate-500 dark:bg-slate-600 text-white py-[clamp(4px,1vw,8px)] px-4 font-bold text-center" style={fz.subBar}>
              مواد مضافة للمجموع
            </div>

            {/* Table Header */}
            <TableHeader />

            {/* Subject Rows */}
            <div className="border border-[#e5e7eb] dark:border-border border-t-0">
              {totals.included.map((item, i) => (
                <SubjectRow key={`inc-${i}`} item={item} i={i} total={totals.included.length} isLast={i === totals.included.length - 1} />
              ))}

              {/* Total Row */}
              <div
                className="print-total-row flex items-center text-white font-bold"
                style={{ background: totalColor, ...fz.totalRow }}
              >
                <div className={`${col.subject} ${cellPad} text-right border-l border-white/20`}>
                  المجموع الكلي
                </div>
                <div className={`${col.score} ${cellPad} text-center border-l border-white/20 whitespace-nowrap font-extrabold`} style={fz.totalScore}>
                  {totals.totalDisplay} / {totals.totalMax}
                </div>
                <div className={`${col.grade} ${cellPad} flex items-center justify-center gap-1`}>
                  <span
                    className="bg-white/25 text-white py-[2px] px-[clamp(4px,1vw,12px)] rounded-full font-extrabold whitespace-nowrap print-badge"
                    style={fz.badge}
                  >
                    {totalLabel}
                  </span>
                  <span className="text-white/90 font-extrabold" style={fz.pctText}>
                    {totals.totalPct}%
                  </span>
                </div>
              </div>
            </div>

            {/* Percentage Bar — hidden in print */}
            <div className="mt-2 px-1 print-percentage-bar">
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
            <div className="print-excluded px-[clamp(12px,3vw,24px)] mt-[clamp(6px,1.6vw,12px)]">
              <div className="print-sub-bar bg-slate-500 dark:bg-slate-600 text-white py-[clamp(4px,1vw,8px)] px-4 rounded-t-xl font-bold text-center" style={fz.subBar}>
                مواد غير مضافة للمجموع
              </div>
              <TableHeader />
              <div className="border border-[#e5e7eb] dark:border-border border-t-0 rounded-b-xl overflow-hidden">
                {totals.excluded.map((item, i) => (
                  <SubjectRow key={`exc-${i}`} item={item} i={i} total={totals.excluded.length} isLast={i === totals.excluded.length - 1} />
                ))}
              </div>
            </div>
          )}

          {/* ===== Disclaimer Footer ===== */}
          <div className="print-disclaimer px-[clamp(12px,3vw,24px)] py-[clamp(8px,2vw,16px)] text-center border-t border-[#e5e7eb] dark:border-border/30 mt-2">
            <p className="font-bold text-slate-400 dark:text-muted-foreground" style={fz.disclaimer}>
              هذه النتيجة استرشادية فقط ولا تعتبر مستنداً رسمياً
            </p>
            <p className="font-semibold text-slate-400 dark:text-muted-foreground mt-1" dir="ltr" style={fz.credit}>
              Designed by : Mr.Mohamed Khairy
            </p>
          </div>
        </div>

        {/* ===== Print Button ===== */}
        <button
          className="print-btn no-print btn-tap w-full mt-3 rounded-2xl text-white font-bold cursor-pointer transition-all duration-200 hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500 sm:mt-4"
          onClick={handlePrint}
          style={{ background: '#28a745', height: 'clamp(44px,12vw,56px)', fontSize: 'clamp(13px,3.6vw,16px)' }}
          aria-label="طباعة شهادة النتيجة"
        >
          <span className="flex items-center justify-center gap-2">
            <Printer className="h-5 w-5" />
            طباعة الشهادة
          </span>
        </button>
      </div>

      {/* ===== Action Buttons ===== */}
      <div className="result-actions no-print flex gap-2.5 sm:gap-3">
        <Button
          onClick={onNewSearch}
          aria-label="بحث عن نتيجة أخرى"
          className="btn-tap flex-1 rounded-2xl font-bold gap-2 text-white transition-all duration-200 hover:brightness-110"
          style={{ background: '#001d3d', height: 'clamp(44px,12vw,48px)', fontSize: 'clamp(12px,3.2vw,16px)' }}
        >
          <Search className="h-4 w-4" />
          بحث جديد
        </Button>
        <Button
          onClick={handleWhatsApp}
          aria-label="مشاركة عبر واتساب"
          className="btn-tap flex-1 rounded-2xl font-bold gap-2 bg-green-500 hover:bg-green-600 text-white transition-all duration-200"
          style={{ height: 'clamp(44px,12vw,48px)', fontSize: 'clamp(12px,3.2vw,16px)' }}
        >
          <MessageCircle className="h-4 w-4" />
          واتساب
        </Button>
        <Button
          onClick={handleCopy}
          variant="outline"
          aria-label="نسخ النتيجة"
          className={`btn-tap flex-1 rounded-2xl font-bold gap-2 transition-all duration-200 ${
            copied ? 'bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600' : ''
          }`}
          style={{ height: 'clamp(44px,12vw,48px)', fontSize: 'clamp(12px,3.2vw,16px)' }}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? 'تم' : 'نسخ'}
        </Button>
      </div>
    </div>
  );
}
