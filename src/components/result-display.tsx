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
  const getGradeBadge = (pct: number): { bg: string; text: string } => {
    if (pct >= 85) return { bg: '#2563eb', text: adv ? 'ممتاز' : 'يفوق التوقعات' };
    if (adv && pct >= 75) return { bg: '#16a34a', text: 'جيد جداً' };
    if (!adv && pct >= 65) return { bg: '#16a34a', text: 'يلبي التوقعات' };
    if (pct >= 50) return { bg: '#d97706', text: adv ? 'مقبول' : 'يلبي التوقعات أحياناً' };
    return { bg: '#dc2626', text: adv ? 'دون المستوى' : 'أقل من المتوقع' };
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
      className="w-full max-w-lg mx-auto space-y-4"
    >
      <div className="result-container">
        {/* ========== Result Card ========== */}
        <div
          className="print-result-card"
          style={{
            background: '#fff',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid #e2e8f0',
          }}
        >
          {/* ===== Header Section ===== */}
          <div style={{ padding: '20px 24px 12px', textAlign: 'right' }}>
            <h2
              style={{
                fontSize: '18px',
                fontWeight: 900,
                color: '#101827',
                margin: 0,
                lineHeight: 1.4,
              }}
            >
              نتائج الامتحانات
            </h2>
            <p
              style={{
                fontSize: '13px',
                fontWeight: 800,
                color: '#64748b',
                margin: '4px 0 0',
                direction: 'ltr',
                textAlign: 'right',
              }}
            >
              Hadayek El-maadi El-kawmia school
            </p>
            <p
              style={{
                fontSize: '16px',
                fontWeight: 900,
                color: '#000',
                margin: '6px 0 0',
              }}
            >
              {data.termName || 'أخر العام 2026'}
            </p>
          </div>

          {/* ===== Student Data Section ===== */}
          <div style={{ padding: '0 16px', marginTop: '8px' }}>
            {/* "بيانات الطالب" Header Bar */}
            <div
              style={{
                background: '#172033',
                color: '#fff',
                padding: '8px 16px',
                borderRadius: '8px 8px 0 0',
                fontSize: '14px',
                fontWeight: 900,
                textAlign: 'center',
              }}
            >
              بيانات الطالب
            </div>

            {/* Student Info Rows */}
            <div
              style={{
                border: '1px solid #334155',
                borderTop: 'none',
                borderRadius: '0 0 8px 8px',
                overflow: 'hidden',
              }}
            >
              {/* Row: الصف الدراسي */}
              <div style={{ display: 'flex', borderBottom: '1px solid #999', fontSize: '14px' }}>
                <div style={{ width: '40%', padding: '10px 14px', color: '#334155', fontWeight: 900, textAlign: 'right', borderLeft: '1px solid #999' }}>
                  الصف الدراسي
                </div>
                <div style={{ width: '60%', padding: '10px 14px', color: '#000', fontWeight: 900, textAlign: 'right' }}>
                  {gradeText}
                </div>
              </div>

              {/* Row: الرقم القومي */}
              <div style={{ display: 'flex', borderBottom: '1px solid #999', fontSize: '14px' }}>
                <div style={{ width: '40%', padding: '10px 14px', color: '#334155', fontWeight: 900, textAlign: 'right', borderLeft: '1px solid #999' }}>
                  الرقم القومي
                </div>
                <div style={{ width: '60%', padding: '10px 14px', color: '#000', fontWeight: 900, textAlign: 'right', direction: 'ltr', unicodeBidi: 'embed' }}>
                  {data.id}
                </div>
              </div>

              {/* Row: اسم الطالب */}
              <div style={{ display: 'flex', fontSize: '14px' }}>
                <div style={{ width: '40%', padding: '10px 14px', color: '#334155', fontWeight: 900, textAlign: 'right', borderLeft: '1px solid #999' }}>
                  اسم الطالب
                </div>
                <div style={{ width: '60%', padding: '10px 14px', color: '#000', fontWeight: 900, textAlign: 'right' }}>
                  {data.stn}
                </div>
              </div>
            </div>
          </div>

          {/* ===== Grades Section ===== */}
          <div style={{ padding: '0 16px', marginTop: '12px' }}>
            {/* "درجات الطالب" Header Bar */}
            <div
              style={{
                background: '#172033',
                color: '#fff',
                padding: '8px 16px',
                borderRadius: '8px 8px 0 0',
                fontSize: '14px',
                fontWeight: 900,
                textAlign: 'center',
              }}
            >
              درجات الطالب
            </div>

            {/* "مواد مضافة للمجموع" Sub-header */}
            <div
              style={{
                background: '#475569',
                color: '#fff',
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: 900,
                textAlign: 'center',
              }}
            >
              مواد مضافة للمجموع
            </div>

            {/* Table Header Row */}
            <div style={{ display: 'flex', background: '#334155', color: '#fff', fontSize: '14px', fontWeight: 900 }}>
              <div style={{ width: '50%', padding: '8px 14px', textAlign: 'right', borderLeft: '1px solid #475569' }}>المادة</div>
              <div style={{ width: '25%', padding: '8px 14px', textAlign: 'center', borderLeft: '1px solid #475569' }}>الدرجة</div>
              <div style={{ width: '25%', padding: '8px 14px', textAlign: 'center' }}>التقدير</div>
            </div>

            {/* Subject Rows */}
            <div style={{ border: '1px solid #999', borderTop: 'none' }}>
              {totals.included.map((item, i) => {
                const pct = getSubjectPct(item);
                const badge = item.isNum ? getGradeBadge(pct) : null;
                return (
                  <motion.div
                    key={`inc-${i}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.04 }}
                    style={{
                      display: 'flex',
                      borderBottom: i < totals.included.length - 1 ? '1px solid #e5e7eb' : 'none',
                      fontSize: '14px',
                      background: '#fff',
                    }}
                  >
                    <div style={{ width: '50%', padding: '10px 14px', color: '#334155', fontWeight: 900, textAlign: 'right', borderLeft: '1px solid #e5e7eb' }}>
                      {item.clean}
                    </div>
                    <div style={{ width: '25%', padding: '10px 14px', color: '#000', fontWeight: 900, textAlign: 'center', borderLeft: '1px solid #e5e7eb' }}>
                      {formatScore(item)}
                    </div>
                    <div style={{ width: '25%', padding: '6px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {badge ? (
                        <span style={{ background: badge.bg, color: '#fff', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 900, whiteSpace: 'nowrap', display: 'inline-block' }}>
                          {badge.text}
                        </span>
                      ) : (
                        <span style={{ color: '#999', fontSize: '13px' }}>{item.rawScore}</span>
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
                style={{
                  display: 'flex',
                  background: '#2563eb',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 900,
                }}
              >
                <div style={{ width: '50%', padding: '12px 14px', textAlign: 'right', borderLeft: '1px solid rgba(255,255,255,0.2)' }}>
                  المجموع الكلي
                </div>
                <div style={{ width: '25%', padding: '12px 14px', textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.2)' }}>
                  {totals.totalDisplay} / {totals.totalMax}
                </div>
                <div style={{ width: '25%', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ background: 'rgba(255,255,255,0.25)', color: '#fff', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 900, whiteSpace: 'nowrap' }}>
                    {totalLabel}
                  </span>
                </div>
              </motion.div>
            </div>
          </div>

          {/* ===== Excluded Subjects Section ===== */}
          {totals.excluded.length > 0 && (
            <div style={{ padding: '0 16px', marginTop: '8px' }}>
              <div style={{ background: '#475569', color: '#fff', padding: '8px 16px', fontSize: '14px', fontWeight: 900, textAlign: 'center', borderRadius: '8px 8px 0 0' }}>
                مواد غير مضافة للمجموع
              </div>
              <div style={{ display: 'flex', background: '#334155', color: '#fff', fontSize: '14px', fontWeight: 900 }}>
                <div style={{ width: '50%', padding: '8px 14px', textAlign: 'right', borderLeft: '1px solid #475569' }}>المادة</div>
                <div style={{ width: '25%', padding: '8px 14px', textAlign: 'center', borderLeft: '1px solid #475569' }}>الدرجة</div>
                <div style={{ width: '25%', padding: '8px 14px', textAlign: 'center' }}>التقدير</div>
              </div>
              <div style={{ border: '1px solid #999', borderTop: 'none', borderRadius: '0 0 8px 8px', overflow: 'hidden' }}>
                {totals.excluded.map((item, i) => {
                  const pct = getSubjectPct(item);
                  const badge = item.isNum ? getGradeBadge(pct) : null;
                  return (
                    <div
                      key={`exc-${i}`}
                      style={{
                        display: 'flex',
                        borderBottom: i < totals.excluded.length - 1 ? '1px solid #e5e7eb' : 'none',
                        fontSize: '14px',
                        background: '#fff',
                      }}
                    >
                      <div style={{ width: '50%', padding: '10px 14px', color: '#334155', fontWeight: 900, textAlign: 'right', borderLeft: '1px solid #e5e7eb' }}>
                        {item.clean}
                      </div>
                      <div style={{ width: '25%', padding: '10px 14px', color: '#000', fontWeight: 900, textAlign: 'center', borderLeft: '1px solid #e5e7eb' }}>
                        {formatScore(item)}
                      </div>
                      <div style={{ width: '25%', padding: '6px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {badge ? (
                          <span style={{ background: badge.bg, color: '#fff', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 900, whiteSpace: 'nowrap' }}>
                            {badge.text}
                          </span>
                        ) : (
                          <span style={{ color: '#999', fontSize: '13px' }}>{item.rawScore}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ===== Disclaimer Footer ===== */}
          <div className="print-disclaimer" style={{ padding: '16px 24px', textAlign: 'center' }}>
            <p style={{ fontSize: '13px', fontWeight: 900, color: '#000', margin: 0 }}>
              هذه النتيجة استرشادية فقط ولا تعتبر مستنداً رسمياً
            </p>
            <p style={{ fontSize: '10px', fontWeight: 800, color: '#555', margin: '8px 0 0', direction: 'ltr' }}>
              Designed by : Mr.Mohamed Khairy
            </p>
          </div>
        </div>

        {/* ===== Print Button (hidden in print) ===== */}
        <button
          className="print-btn no-print"
          onClick={handlePrint}
          style={{
            marginTop: '12px',
            background: '#28a745',
            color: 'white',
            border: 'none',
            padding: '14px',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '16px',
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

      {/* ===== Action Buttons (hidden from print) ===== */}
      <div className="result-actions no-print" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
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
    </motion.div>
  );
}
