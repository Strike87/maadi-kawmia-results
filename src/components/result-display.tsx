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
  thresholdClass,
  isAbsenceCode,
  buildShareLines,
  GRADE_MAP,
  stripAt,
} from '@/lib/constants';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

interface ResultDisplayProps {
  data: StudentResult;
  onNewSearch: () => void;
}

function scoreColor(pct: number): string {
  if (pct >= 85) return '#2563eb';  // blue - excellent
  if (pct >= 75) return '#16a34a';  // green - very good
  if (pct >= 65) return '#16a34a';  // green - good
  if (pct >= 50) return '#d97706';  // amber - pass
  return '#dc2626';                  // red - fail
}

function scoreBgColor(pct: number): string {
  if (pct >= 85) return 'rgba(37,99,235,0.08)';
  if (pct >= 65) return 'rgba(22,163,74,0.08)';
  if (pct >= 50) return 'rgba(217,119,6,0.08)';
  return 'rgba(220,38,38,0.08)';
}

export function ResultDisplay({ data, onNewSearch }: ResultDisplayProps) {
  const [copied, setCopied] = useState(false);
  const adv = usesAdvancedScale(data);
  const totals: ComputedTotals = computeTotals(data);
  const totalLabel = gradeLabel(totals.totalPct, adv);
  const gradeText = data.clLabel || GRADE_MAP[stripAt(data.cl)] || stripAt(data.cl);
  const isPassed = totals.totalPct >= 50;
  const resultText = isPassed ? 'ناجح' : 'دون المستوى';
  const resultColor = isPassed ? '#16a34a' : '#dc2626';

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

  // Build all rows for the table
  type TableRow = { label: string; value: string; isSubject?: boolean; pct?: number; isTotal?: boolean; isResult?: boolean; resultColor?: string };
  const rows: TableRow[] = [];

  // Student info rows
  rows.push({ label: 'اسم الطالب', value: data.stn });
  rows.push({ label: 'الصف الدراسي', value: gradeText });
  rows.push({ label: 'الرقم القومي', value: data.id });
  rows.push({ label: 'النتيجة', value: resultText, isResult: true, resultColor });

  // Included subjects
  totals.included.forEach((item) => {
    if (item.isNum) {
      const pct = Math.round((item.score / item.maxScore) * 100);
      rows.push({
        label: item.clean,
        value: `${item.rawScore} / ${item.maxScore}`,
        isSubject: true,
        pct,
      });
    } else if (isAbsenceCode(item.rawScore)) {
      const raw = String(item.rawScore).trim();
      rows.push({
        label: item.clean,
        value: raw === '' || raw === '-' ? '—' : raw,
        isSubject: true,
      });
    } else {
      rows.push({
        label: item.clean,
        value: item.rawScore,
        isSubject: true,
      });
    }
  });

  // Total row
  rows.push({
    label: 'المجموع الكلي',
    value: `${totals.totalDisplay} / ${totals.totalMax}  (${totals.totalPct}%  -  ${totalLabel})`,
    isTotal: true,
    pct: totals.totalPct,
  });

  // Excluded subjects (shown separately if any)
  const excludedRows: TableRow[] = totals.excluded.map((item) => {
    if (item.isNum) {
      const pct = Math.round((item.score / item.maxScore) * 100);
      return {
        label: item.clean,
        value: `${item.rawScore} / ${item.maxScore}`,
        isSubject: true,
        pct,
      };
    } else if (isAbsenceCode(item.rawScore)) {
      const raw = String(item.rawScore).trim();
      return {
        label: item.clean,
        value: raw === '' || raw === '-' ? '—' : raw,
        isSubject: true,
      };
    } else {
      return {
        label: item.clean,
        value: item.rawScore,
        isSubject: true,
      };
    }
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="w-full max-w-lg mx-auto space-y-5"
    >
      {/* Result Card */}
      <div
        className="rounded-2xl overflow-hidden shadow-xl"
        style={{ border: '2px solid #003566' }}
      >
        {/* Header Banner */}
        <div
          className="px-5 py-4 text-white text-center"
          style={{ background: 'linear-gradient(135deg, #001d3d, #003566)' }}
        >
          <h2 className="text-lg font-black">نتيجة الامتحانات</h2>
          <p className="text-sm font-bold opacity-90 mt-1">مدرسة حدائق المعادي القومية</p>
        </div>

        {/* Vertical Table */}
        <div className="bg-white dark:bg-card">
          <table className="w-full" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
            <tbody>
              {rows.map((row, i) => {
                const isLast = i === rows.length - 1;
                const borderBottom = isLast ? 'none' : '1px solid #e5e7eb';

                return (
                  <motion.tr
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.03 }}
                    style={{ borderBottom }}
                  >
                    {/* Label (th) */}
                    <td
                      className="px-4 py-2.5 text-sm font-bold text-right"
                      style={{
                        width: '45%',
                        background: row.isTotal
                          ? '#f0f4ff'
                          : row.isResult
                            ? 'rgba(22,163,74,0.06)'
                            : '#f8f9fa',
                        borderLeft: row.isSubject && row.pct !== undefined
                          ? `4px solid ${scoreColor(row.pct)}`
                          : row.isTotal
                            ? '4px solid #003566'
                            : row.isResult
                              ? `4px solid ${row.resultColor}`
                              : '4px solid #003566',
                        color: row.isTotal ? '#001d3d' : '#001d3d',
                      }}
                    >
                      {row.label}
                    </td>
                    {/* Value (td) */}
                    <td
                      className="px-4 py-2.5 text-sm font-bold text-center"
                      style={{
                        color: row.isResult
                          ? row.resultColor
                          : row.isTotal
                            ? '#001d3d'
                            : row.isSubject && row.pct !== undefined
                              ? scoreColor(row.pct)
                              : '#1f2937',
                        background: row.isTotal
                          ? '#f0f4ff'
                          : row.isSubject && row.pct !== undefined
                            ? scoreBgColor(row.pct)
                            : row.isResult
                              ? 'rgba(22,163,74,0.06)'
                              : 'transparent',
                        fontWeight: row.isTotal || row.isResult ? 900 : 700,
                        fontSize: row.isTotal ? '15px' : row.isResult ? '15px' : '14px',
                      }}
                    >
                      {row.value}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Excluded Subjects (if any) */}
        {excludedRows.length > 0 && (
          <>
            <div className="px-4 py-2 text-center" style={{ background: '#f8f9fa', borderTop: '1px solid #e5e7eb' }}>
              <span className="text-xs font-bold text-gray-500">مواد غير مضافة للمجموع</span>
            </div>
            <div className="bg-white dark:bg-card">
              <table className="w-full" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
                <tbody>
                  {excludedRows.map((row, i) => {
                    const isLast = i === excludedRows.length - 1;
                    const borderBottom = isLast ? 'none' : '1px solid #e5e7eb';

                    return (
                      <motion.tr
                        key={`exc-${i}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: (rows.length + i) * 0.03 }}
                        style={{ borderBottom }}
                      >
                        <td
                          className="px-4 py-2.5 text-sm font-bold text-right text-gray-500"
                          style={{
                            width: '45%',
                            background: '#fafafa',
                            borderLeft: row.pct !== undefined
                              ? `4px solid ${scoreColor(row.pct)}`
                              : '4px solid #9ca3af',
                          }}
                        >
                          {row.label}
                        </td>
                        <td
                          className="px-4 py-2.5 text-sm text-center text-gray-600"
                          style={{
                            color: row.pct !== undefined ? scoreColor(row.pct) : '#6b7280',
                            background: row.pct !== undefined ? scoreBgColor(row.pct) : 'transparent',
                            fontWeight: 600,
                          }}
                        >
                          {row.value}
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Total Progress Bar */}
        <div className="px-4 py-3" style={{ background: '#f8f9fa', borderTop: '1px solid #e5e7eb' }}>
          <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
            <motion.div
              className="h-full rounded-full"
              style={{ background: scoreColor(totals.totalPct) }}
              initial={{ width: 0 }}
              animate={{ width: `${totals.totalPct}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 no-print"
      >
        <Button
          onClick={handleCopy}
          variant="outline"
          className={`h-11 rounded-xl font-bold gap-2 transition-all duration-300 text-sm ${
            copied
              ? 'bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600'
              : ''
          }`}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? 'تم النسخ' : 'نسخ'}
        </Button>
        <Button
          onClick={handleWhatsApp}
          className="h-11 rounded-xl font-bold gap-2 bg-green-500 hover:bg-green-600 text-white text-sm"
        >
          <MessageCircle className="h-4 w-4" />
          واتساب
        </Button>
        <Button
          onClick={handlePrint}
          className="h-11 rounded-xl font-bold gap-2 text-white text-sm"
          style={{ background: '#28a745' }}
        >
          <Printer className="h-4 w-4" />
          طباعة
        </Button>
        <Button
          onClick={onNewSearch}
          className="h-11 rounded-xl font-bold gap-2 text-white text-sm"
          style={{ background: 'linear-gradient(to left, #001d3d, #003566)' }}
        >
          <Search className="h-4 w-4" />
          بحث جديد
        </Button>
      </motion.div>

      {/* Disclaimer */}
      <p className="text-center text-xs font-bold text-red-500 dark:text-red-400 no-print">
        * هذه النتيجة استرشادية ولا يعتد بها كمستند رسمي *
      </p>
    </motion.div>
  );
}
