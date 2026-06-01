'use client';

import { motion } from 'framer-motion';
import {
  Copy,
  MessageCircle,
  Printer,
  Search,
  User,
  BookOpen,
  TrendingUp,
  Award,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  type StudentResult,
  type ComputedTotals,
  type SubjectItem,
  computeTotals,
  usesAdvancedScale,
  gradeLabel,
  gradeColor,
  thresholdClass,
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

const thresholdColors: Record<string, { bg: string; text: string; bar: string; badge: string }> = {
  red: {
    bg: 'bg-red-50 dark:bg-red-950/20',
    text: 'text-red-600 dark:text-red-400',
    bar: 'bg-red-500',
    badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  },
  yellow: {
    bg: 'bg-amber-50 dark:bg-amber-950/20',
    text: 'text-amber-600 dark:text-amber-400',
    bar: 'bg-amber-500',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  },
  green: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/20',
    text: 'text-emerald-600 dark:text-emerald-400',
    bar: 'bg-emerald-500',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  },
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-950/20',
    text: 'text-blue-600 dark:text-blue-400',
    bar: 'bg-blue-500',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  },
};

function ScoreCell({ item, adv }: { item: SubjectItem; adv: boolean }) {
  if (item.isNum) {
    const pct = Math.round((item.score / item.maxScore) * 100);
    const tc = thresholdClass(pct, adv);
    const colors = thresholdColors[tc];
    const label = gradeLabel(pct, adv);

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-bold" dir="ltr">
            {item.rawScore} / {item.maxScore}
          </span>
          <Badge
            className={`text-xs font-bold px-2 py-0.5 border-0 ${colors.badge}`}
          >
            {label}
          </Badge>
        </div>
        {!adv && (
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
            <motion.div
              className={`h-full rounded-full ${colors.bar}`}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
            />
          </div>
        )}
      </div>
    );
  }

  if (isAbsenceCode(item.rawScore)) {
    const raw = String(item.rawScore).trim();
    const label = raw === '' || raw === '-' ? '—' : raw;
    return (
      <Badge variant="outline" className="text-xs font-bold text-muted-foreground">
        {label}
      </Badge>
    );
  }

  return (
    <span className="text-sm font-bold text-red-500">{item.rawScore}</span>
  );
}

export function ResultDisplay({ data, onNewSearch }: ResultDisplayProps) {
  const [copied, setCopied] = useState(false);
  const adv = usesAdvancedScale(data);
  const totals: ComputedTotals = computeTotals(data);
  const totalLabel = gradeLabel(totals.totalPct, adv);
  const totalColor = gradeColor(totals.totalPct, adv);
  const totalTc = thresholdClass(totals.totalPct, adv);
  const totalColors = thresholdColors[totalTc];
  const gradeText = data.clLabel || GRADE_MAP[data.cl.replace(/@+$/, '')] || data.cl;

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="w-full max-w-2xl mx-auto space-y-5"
    >
      {/* Student Info Card */}
      <Card className="border-border/50 shadow-xl bg-card/80 backdrop-blur-sm overflow-hidden">
        {/* Top Banner */}
        <div
          className="px-6 py-4 text-white"
          style={{ background: `linear-gradient(135deg, ${totalColor}, ${totalColor}dd)` }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <User className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-black leading-tight">{data.stn}</h2>
                <p className="text-sm font-semibold opacity-90">{gradeText}</p>
              </div>
            </div>
            <div className="text-left">
              <div className="text-2xl font-black" dir="ltr">
                {totals.totalPct}%
              </div>
              <Badge className="bg-white/20 text-white border-white/30 font-bold text-sm">
                {totalLabel}
              </Badge>
            </div>
          </div>
        </div>

        <CardContent className="p-0">
          {/* Info Rows */}
          <div className="grid grid-cols-2 gap-0">
            <div className="px-6 py-3 border-l border-border/50">
              <p className="text-xs text-muted-foreground font-semibold mb-0.5">الصف الدراسي</p>
              <p className="text-sm font-bold">{gradeText}</p>
            </div>
            <div className="px-6 py-3">
              <p className="text-xs text-muted-foreground font-semibold mb-0.5">الرقم القومي</p>
              <p className="text-sm font-bold font-mono" dir="ltr">{data.id}</p>
            </div>
          </div>

          <Separator />

          {/* Total Summary Bar */}
          <div className={`px-6 py-4 ${totalColors.bg}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="font-black text-sm">المجموع الكلي</span>
              </div>
              <span className="font-black text-sm" dir="ltr">
                {totals.totalDisplay} / {totals.totalMax}
              </span>
            </div>
            <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
              <motion.div
                className={`h-full rounded-full ${totalColors.bar}`}
                initial={{ width: 0 }}
                animate={{ width: `${totals.totalPct}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
          </div>

          <Separator />

          {/* Included Subjects */}
          <div className="px-6 py-4">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="h-4 w-4 text-primary" />
              <h3 className="font-black text-sm">مواد مضافة للمجموع</h3>
            </div>
            <div className="space-y-3">
              {totals.included.map((item, i) => (
                <motion.div
                  key={`inc-${i}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className={`rounded-xl p-3 ${
                    item.isNum
                      ? thresholdColors[thresholdClass(Math.round((item.score / item.maxScore) * 100), adv)].bg
                      : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-bold text-sm leading-relaxed min-w-0 flex-1">
                      {item.clean}
                    </span>
                    <div className="flex-shrink-0 w-40">
                      <ScoreCell item={item} adv={adv} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Excluded Subjects */}
          {totals.excluded.length > 0 && (
            <>
              <Separator />
              <div className="px-6 py-4">
                <div className="flex items-center gap-2 mb-4">
                  <Award className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-black text-sm text-muted-foreground">
                    مواد غير مضافة للمجموع
                  </h3>
                </div>
                <div className="space-y-2">
                  {totals.excluded.map((item, i) => (
                    <motion.div
                      key={`exc-${i}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.05 + 0.3 }}
                      className="rounded-xl p-3 bg-muted/50"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-bold text-sm text-muted-foreground">
                          {item.clean}
                        </span>
                        <div className="flex-shrink-0 w-40">
                          <ScoreCell item={item} adv={adv} />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        <Button
          onClick={handleCopy}
          variant="outline"
          className={`h-12 rounded-xl font-bold gap-2 transition-all duration-300 ${
            copied
              ? 'bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600'
              : ''
          }`}
        >
          {copied ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          {copied ? 'تم النسخ' : 'نسخ'}
        </Button>
        <Button
          onClick={handleWhatsApp}
          className="h-12 rounded-xl font-bold gap-2 bg-green-500 hover:bg-green-600 text-white"
        >
          <MessageCircle className="h-4 w-4" />
          واتساب
        </Button>
        <Button
          onClick={handlePrint}
          variant="outline"
          className="h-12 rounded-xl font-bold gap-2"
        >
          <Printer className="h-4 w-4" />
          طباعة
        </Button>
        <Button
          onClick={onNewSearch}
          className="h-12 rounded-xl font-bold gap-2 bg-gradient-to-l from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
        >
          <Search className="h-4 w-4" />
          بحث جديد
        </Button>
      </motion.div>

      {/* Disclaimer */}
      <p className="text-center text-sm font-bold text-red-500 dark:text-red-400">
        هذه نتيجة استرشادية فقط ولا تعتبر مستنداً رسمياً
      </p>
    </motion.div>
  );
}
