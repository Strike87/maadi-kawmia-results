// =====================================================
// Grade & Stage Definitions
// =====================================================

export const GRADE_MAP: Record<string, string> = {
  '1': 'الصف الأول الابتدائي',
  '2': 'الصف الثاني الابتدائي',
  '3': 'الصف الثالث الابتدائي',
  '4': 'الصف الرابع الابتدائي',
  '5': 'الصف الخامس الابتدائي',
  '6': 'الصف السادس الابتدائي',
  '7': 'الصف الأول الإعدادي',
  '8': 'الصف الثاني الإعدادي',
  '10': 'الصف الأول الثانوي',
  '11S': 'الصف الثاني الثانوي علمي',
  '11A': 'الصف الثاني الثانوي أدبي',
};

export interface GradeOption {
  value: string;
  label: string;
}

export const STAGE_GRADES: Record<string, { label: string; grades: GradeOption[] }> = {
  primary: {
    label: 'الابتدائية',
    grades: [
      { value: '1', label: 'الأول' },
      { value: '2', label: 'الثاني' },
      { value: '3', label: 'الثالث' },
      { value: '4', label: 'الرابع' },
      { value: '5', label: 'الخامس' },
      { value: '6', label: 'السادس' },
    ],
  },
  prep: {
    label: 'الإعدادية',
    grades: [
      { value: '7', label: 'الأول' },
      { value: '8', label: 'الثاني' },
    ],
  },
  secondary: {
    label: 'الثانوية',
    grades: [
      { value: '10', label: 'الأول' },
      { value: '11S', label: 'الثاني علمي' },
      { value: '11A', label: 'الثاني أدبي' },
    ],
  },
};

// =====================================================
// Absence & Exclusion Lists
// =====================================================

export const ABSENCE_CODES = new Set([
  'غ', 'م', 'غائب', 'معذور', '-', 'N/A', '', '—',
]);

export const EXCLUDED_SUBJECTS = [
  'التربية الدينية',
  'المستوي الرفيع',
  'التربية الوطنية',
  'الكمبيوتر و تكنولوجيا المعلومات',
  'التربية الفنية',
  'التربية الرياضية',
  'التربية الموسيقية',
  'حاسب آلي',
  'تكنولوجيا المعلومات و الاتصالات',
  'البرمجة و الذكاء الاصطناعي',
  'اللغة الثانية',
];

export const ADVANCED_STAGE_KEYS = new Set(['7', '8', '10', '11S', '11A']);

// =====================================================
// API Configuration
// =====================================================

export const API_URL =
  'https://script.google.com/macros/s/AKfycbyNmK52XP0Ogl_x7JcgUAuZRDXyfXOdKNC4Rb42qusKBAjAMR1phQOpJQQpenpGCAAThQ/exec';

// =====================================================
// Type Definitions
// =====================================================

export interface StudentResult {
  termName: string;
  cl: string;
  clLabel: string;
  id: string;
  stn: string;
  headers: string[];
  scores: string[];
  maxScores: number[];
}

export interface TermInfo {
  terms: string[];
  activeSheets: string[];
  globalVersion: string;
}

export interface SubjectItem {
  clean: string;
  rawScore: string;
  maxScore: number;
  score: number;
  isNum: boolean;
}

export interface ComputedTotals {
  included: SubjectItem[];
  excluded: SubjectItem[];
  totalScore: number;
  totalDisplay: string;
  totalMax: number;
  totalPct: number;
}

// =====================================================
// Utility Functions
// =====================================================

export function normalizeArabic(str: string): string {
  return String(str || '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/\s+/g, ' ')
    .trim();
}

const NORMALIZED_EXCLUDED = EXCLUDED_SUBJECTS.map(normalizeArabic);

export function isExcluded(name: string): boolean {
  const normalized = normalizeArabic(name);
  return NORMALIZED_EXCLUDED.some((n) => normalized.includes(n));
}

export function isAbsenceCode(value: string): boolean {
  return ABSENCE_CODES.has(String(value).trim());
}

export function usesAdvancedScale(data: StudentResult): boolean {
  return [data?.cl, data?.clLabel]
    .map(normalizeArabic)
    .some(
      (v) =>
        ADVANCED_STAGE_KEYS.has(v) ||
        v.includes('اعدادي') ||
        v.includes('ثانوي')
    );
}

export function gradeLabel(pct: number, adv: boolean): string {
  if (adv) {
    return pct >= 85
      ? 'ممتاز'
      : pct >= 75
        ? 'جيد جداً'
        : pct >= 65
          ? 'جيد'
          : pct >= 50
            ? 'مقبول'
            : 'دون المستوى';
  }
  return pct >= 85
    ? 'يفوق التوقعات'
    : pct >= 65
      ? 'يلبي التوقعات'
      : pct >= 50
        ? 'يلبي التوقعات أحياناً'
        : 'أقل من المتوقع';
}

export function gradeColor(pct: number, adv: boolean): string {
  if (pct >= 85) return '#2563eb';
  if ((adv && pct >= 75) || pct >= 65) return '#16a34a';
  if (pct >= 50) return '#d9a400';
  return '#dc2626';
}

export type ThresholdClass = 'red' | 'yellow' | 'green' | 'blue';

export function thresholdClass(pct: number, adv: boolean): ThresholdClass {
  if (pct < 50) return 'red';
  if (pct < 65) return 'yellow';
  if (adv && pct < 75) return 'green';
  if (pct < 85) return 'green';
  return 'blue';
}

export function computeTotals(data: StudentResult): ComputedTotals {
  const included: SubjectItem[] = [];
  const excluded: SubjectItem[] = [];
  let totalScore100 = 0;
  let totalMax = 0;

  data.headers.forEach((header, index) => {
    const clean = String(header).replace(/\/\s*\d+/, '').trim();
    if (!clean || clean === 'undefined') return;
    const rawScore = data.scores[index];
    const maxScore = Number(data.maxScores[index]) || 10;
    const score = parseFloat(rawScore);
    const isNum = !isNaN(score) && String(rawScore).trim() !== '';
    const item: SubjectItem = { clean, rawScore, maxScore, score, isNum };

    if (isExcluded(clean)) {
      excluded.push(item);
      return;
    }
    included.push(item);
    if (isNum) {
      totalScore100 += Math.round(score * 100);
      totalMax += maxScore;
    }
  });

  const totalScore = totalScore100 / 100;
  const totalDisplay = Number.isInteger(totalScore)
    ? String(totalScore)
    : totalScore.toFixed(2).replace(/\.?0+$/, '');
  const totalPct = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;

  return { included, excluded, totalScore, totalDisplay, totalMax, totalPct };
}

export function normalizeId(val: string): string {
  return String(val || '')
    .trim()
    .replace(/\s+/g, '')
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[^0-9]/g, '');
}

export function buildShareLines(data: StudentResult, bold: boolean): string[] {
  const mark = bold ? '*' : '';
  const totals = computeTotals(data);
  const adv = usesAdvancedScale(data);

  const lines = [
    `${mark}نتيجة امتحانات مدرسة حدائق المعادي القومية${mark}`,
    '─────────────────',
    `الفترة: ${data.termName || ''}`,
    `الطالب: ${mark}${data.stn}${mark}`,
    `الصف: ${data.clLabel || GRADE_MAP[data.cl] || data.cl}`,
    '─────────────────',
  ];

  totals.included.forEach((item) => {
    lines.push(
      `${item.clean}: ${item.isNum ? `${item.score} / ${item.maxScore}` : item.rawScore}`
    );
  });

  lines.push(
    '─────────────────',
    `${mark}المجموع: ${totals.totalDisplay} / ${totals.totalMax} (${totals.totalPct}%) - ${gradeLabel(totals.totalPct, adv)}${mark}`
  );

  if (totals.excluded.length > 0) {
    lines.push('─────────────────', 'مواد غير مضافة للمجموع:');
    totals.excluded.forEach((item) => {
      lines.push(
        `${item.clean}: ${item.isNum ? `${item.score} / ${item.maxScore}` : item.rawScore}`
      );
    });
  }

  return lines;
}

export function isGradeActive(
  gradeVal: string,
  activeSheets: string[]
): boolean {
  if (!activeSheets?.length) return true;
  const fullName = GRADE_MAP[gradeVal] || '';
  return activeSheets.some((sheetName) => {
    const s = sheetName.trim();
    const sNorm = normalizeArabic(s);
    const fNorm = normalizeArabic(fullName);
    return s === gradeVal || (fNorm && sNorm === fNorm);
  });
}
