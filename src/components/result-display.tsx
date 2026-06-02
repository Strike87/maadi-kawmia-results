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

export function ResultDisplay({ data, onNewSearch }: ResultDisplayProps) {
  const [copied, setCopied] = useState(false);
  const adv = usesAdvancedScale(data);
  const totals: ComputedTotals = computeTotals(data);
  const totalLabel = gradeLabel(totals.totalPct, adv);
  const gradeText = data.clLabel || GRADE_MAP[stripAt(data.cl)] || stripAt(data.cl);
  const isPassed = totals.totalPct >= 50;
  const resultText = isPassed ? 'ناجح' : 'دون المستوى';

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

  // Build table rows - exactly like the grading app: <tr><th>label</th><td>value</td></tr>
  type TableRow = { label: string; value: string };
  const rows: TableRow[] = [];

  // Student info rows
  rows.push({ label: 'اسم الطالب', value: data.stn });
  rows.push({ label: 'الصف الدراسي', value: gradeText });
  rows.push({ label: 'الرقم القومي', value: data.id });
  rows.push({ label: 'النتيجة', value: resultText });

  // Included subjects
  totals.included.forEach((item) => {
    if (item.isNum) {
      rows.push({
        label: item.clean,
        value: String(item.rawScore),
      });
    } else if (isAbsenceCode(item.rawScore)) {
      const raw = String(item.rawScore).trim();
      rows.push({
        label: item.clean,
        value: raw === '' || raw === '-' ? '—' : raw,
      });
    } else {
      rows.push({
        label: item.clean,
        value: item.rawScore,
      });
    }
  });

  // Total row
  rows.push({
    label: 'المجموع الكلي',
    value: `${totals.totalDisplay} / ${totals.totalMax}  (${totals.totalPct}%  -  ${totalLabel})`,
  });

  // Excluded subjects
  const excludedRows: TableRow[] = totals.excluded.map((item) => {
    if (item.isNum) {
      return { label: item.clean, value: String(item.rawScore) };
    } else if (isAbsenceCode(item.rawScore)) {
      const raw = String(item.rawScore).trim();
      return { label: item.clean, value: raw === '' || raw === '-' ? '—' : raw };
    } else {
      return { label: item.clean, value: item.rawScore };
    }
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="w-full max-w-lg mx-auto space-y-4"
    >
      {/* Result Table - Matching Grading App Exactly */}
      <div className="result-container">
        <table
          className="v-table"
          style={{
            width: '100%',
            background: 'white',
            borderCollapse: 'collapse',
            borderRadius: '15px',
            overflow: 'hidden',
            boxShadow: '0 5px 15px rgba(0,0,0,0.05)',
          }}
        >
          <tbody>
            {rows.map((row, i) => (
              <motion.tr
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: i * 0.03 }}
              >
                <th
                  style={{
                    background: '#f8f9fa',
                    color: '#001d3d',
                    padding: '15px',
                    textAlign: 'right',
                    width: '45%',
                    borderLeft: '5px solid #003566',
                    fontWeight: 'bold',
                    fontSize: '14px',
                  }}
                >
                  {row.label}
                </th>
                <td
                  style={{
                    padding: '15px',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    borderBottom: '1px solid #eee',
                    color: '#001d3d',
                    fontSize: '14px',
                  }}
                >
                  {row.value}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>

        {/* Excluded Subjects Table */}
        {excludedRows.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <p style={{ textAlign: 'center', color: '#666', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>
              مواد غير مضافة للمجموع
            </p>
            <table
              style={{
                width: '100%',
                background: 'white',
                borderCollapse: 'collapse',
                borderRadius: '15px',
                overflow: 'hidden',
                boxShadow: '0 5px 15px rgba(0,0,0,0.05)',
              }}
            >
              <tbody>
                {excludedRows.map((row, i) => (
                  <tr key={`exc-${i}`}>
                    <th
                      style={{
                        background: '#f8f9fa',
                        color: '#666',
                        padding: '12px',
                        textAlign: 'right',
                        width: '45%',
                        borderLeft: '5px solid #999',
                        fontWeight: 'bold',
                        fontSize: '13px',
                      }}
                    >
                      {row.label}
                    </th>
                    <td
                      style={{
                        padding: '12px',
                        textAlign: 'center',
                        fontWeight: 'bold',
                        borderBottom: '1px solid #eee',
                        color: '#666',
                        fontSize: '13px',
                      }}
                    >
                      {row.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Print Button - Exactly like grading app */}
        <button
          onClick={handlePrint}
          style={{
            marginTop: '15px',
            background: '#28a745',
            color: 'white',
            border: 'none',
            padding: '15px',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '18px',
            fontWeight: 'bold',
            width: '100%',
            transition: '0.3s',
          }}
          onMouseOver={(e) => { e.currentTarget.style.opacity = '0.9'; }}
          onMouseOut={(e) => { e.currentTarget.style.opacity = '1'; }}
        >
          طباعة الشهادة
        </button>
      </div>

      {/* Extra Action Buttons (Copy, WhatsApp, New Search) - hidden from print */}
      <div className="no-print" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <Button
          onClick={handleCopy}
          variant="outline"
          className={`flex-1 h-11 rounded-xl font-bold gap-2 transition-all duration-300 text-sm ${
            copied ? 'bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600' : ''
          }`}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? 'تم النسخ' : 'نسخ'}
        </Button>
        <Button
          onClick={handleWhatsApp}
          className="flex-1 h-11 rounded-xl font-bold gap-2 bg-green-500 hover:bg-green-600 text-white text-sm"
        >
          <MessageCircle className="h-4 w-4" />
          واتساب
        </Button>
        <Button
          onClick={onNewSearch}
          className="flex-1 h-11 rounded-xl font-bold gap-2 text-white text-sm"
          style={{ background: '#001d3d' }}
        >
          <Search className="h-4 w-4" />
          بحث جديد
        </Button>
      </div>

      {/* Disclaimer */}
      <p className="text-center text-xs font-bold text-gray-500 no-print" style={{ direction: 'rtl' }}>
        * هذه النتيجة استرشادية ولا يعتد بها كمستند رسمي *
      </p>
    </motion.div>
  );
}
