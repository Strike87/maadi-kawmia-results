// =====================================================
// Sheet Names - Constants
// Sheet names must be exactly: 1, 2, 3, 4, 5, 6, 7, 8, 10, 11S, 11A
// =====================================================

export const SHEET_NAMES = ['1', '2', '3', '4', '5', '6', '7', '8', '10', '11S', '11A'] as const;
export type SheetName = (typeof SHEET_NAMES)[number];

// =====================================================
// Grade & Stage Definitions (Master Configuration)
// This is the "source of truth" for all possible stages/grades.
// The dropdowns are filtered dynamically based on activeSheets
// returned from Google Sheets — only grades with existing tabs appear.
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
// Error Messages — User-Facing
// Maps error keys (from API / frontend validation)
// to the Arabic messages shown in the red alert box.
// =====================================================

export const ERROR_MESSAGES: Record<string, string> = {
  // ── Frontend validation ──
  INVALID_TERM: 'فترة دراسية غير صالحة',
  INVALID_GRADE: 'صف دراسي غير صالح',
  INVALID_ID: 'الرقم القومي يجب أن يكون 14 رقمًا',
  MISSING_FIELDS: 'يرجى ملء جميع الحقول المطلوبة.',
  MISSING_CAPTCHA: 'يرجى إكمال التحقق الأمني أولاً.',
  CAPTCHA_FAILED: 'فشل التحقق من الكابتشا. يرجى المحاولة مرة أخرى.',

  // ── Backend / GAS errors ──
  RESULTS_UNAVAILABLE: 'النتائج غير متاحة حالياً',
  SHEET_NOT_FOUND: 'لم يتم العثور على بيانات هذا الصف',
  RATE_LIMITED: 'تم إرسال طلبات كثيرة في وقت قصير',
  CONNECTION_ERROR: 'حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.',
  SERVER_ERROR: 'حدث خطأ في الاتصال بالخادم. يرجى المحاولة مرة أخرى.',
  SETTINGS_INCOMPLETE: 'إعدادات الشيت غير مكتملة. يرجى التواصل مع الإدارة.',
  DATA_READ_ERROR: 'حدث خطأ أثناء قراءة البيانات. يرجى المحاولة لاحقاً.',
  NO_RESULT: 'الرقم القومى الذى أدخلته غير موجود بقاعدة البيانات',
  FEES_UNPAID: 'المصاريف غير مسددة. يرجى التوجه إلى إدارة المدرسة.',
  UNKNOWN_ERROR: 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.',
};

/**
 * Map a raw error string from Google Apps Script
 * to a standardized error key used by ERROR_MESSAGES.
 *
 * GAS may return Arabic strings, English keys, or HTTP status codes.
 * This function normalises them so the UI always shows the right message.
 */
export function mapGasError(rawError: string): string {
  if (!rawError) return 'UNKNOWN_ERROR';
  const e = rawError.trim();

  // ── Exact-match keys (if GAS returns an error key) ──
  if (ERROR_MESSAGES[e]) return e;

  // ── Pattern-match Arabic strings from GAS ──
  if (/غير صالحة.*فترة|فترة.*غير صالحة|invalid.*term/i.test(e)) return 'INVALID_TERM';
  if (/صف دراسي غير صالح|غير صالحة.*صف|invalid.*grade|invalid.*class/i.test(e)) return 'INVALID_GRADE';
  if (/الرقم القومي.*14|14.*رقم|national.*id.*14/i.test(e)) return 'INVALID_ID';
  if (/غير متاحة|not published|published.*false|_isPublished|B1.*false/i.test(e)) return 'RESULTS_UNAVAILABLE';
  // ── IMPORTANT: NO_RESULT must be checked BEFORE SHEET_NOT_FOUND ──
  // Both contain "لم يتم العثور" but "لم يتم العثور على نتيجة" means student not found,
  // while "لم يتم العثور على بيانات هذا الصف" means sheet not found.
  if (/لم يتم العثور على نتيجة|الرقم القومي.*غير موجود|no.*result|no.*data.*found|not found.*student|student.*not/i.test(e)) return 'NO_RESULT';
  if (/لم يتم العثور|not found|sheet.*not.*found|no.*sheet/i.test(e)) return 'SHEET_NOT_FOUND';
  if (/طلبات كثيرة|rate.?limit|too many|throttl/i.test(e)) return 'RATE_LIMITED';
  if (/إعدادات.*غير مكتملة|settings.*incomplete|missing.*column|لم يتم العثور على عمود/i.test(e)) return 'SETTINGS_INCOMPLETE';
  if (/خطأ أثناء قراءة|error.*reading|read.*error|corrupted/i.test(e)) return 'DATA_READ_ERROR';
  if (/مصاريف|fees|المصاريف/i.test(e)) return 'FEES_UNPAID';

  // ── Fallback: return the raw string as-is so something is always shown ──
  return e;
}

/**
 * Get the user-facing Arabic message for an error key.
 * Falls back to the raw key if no mapping exists.
 */
export function getErrorMessage(keyOrRaw: string): string {
  const key = mapGasError(keyOrRaw);
  return ERROR_MESSAGES[key] || keyOrRaw;
}

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
  'https://script.google.com/macros/s/AKfycbw14UqwxrsY4bdaJOdlruK1Ik80vzgqqitmsQIvV9Z5VsVQuOq9ynqWq0AJLIgzDpUV/exec';

// Whether Turnstile captcha is configured (has a real site key)
export const CAPTCHA_ENABLED =
  typeof window !== 'undefined' &&
  !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY &&
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY !== '0x4AAAAAAA_your_site_key_here';

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

/**
 * Check if a grade is active based on the active sheets list
 * returned by Google Apps Script (_getActiveSheets).
 *
 * Matching logic:
 * 1. Direct match: gradeVal "7" matches sheet name "7"
 * 2. Arabic label match: gradeVal "7" matches sheet name "الصف الأول الإعدادي"
 *
 * This enables dynamic dropdown filtering — only grades with
 * existing sheet tabs appear in the menu.
 */
export function isGradeActive(
  gradeVal: string,
  activeSheets: string[]
): boolean {
  if (!activeSheets?.length) return true; // No data yet — show all
  const fullName = GRADE_MAP[gradeVal] || '';
  return activeSheets.some((sheetName) => {
    const s = sheetName.trim();
    // Skip non-grade sheets
    if (s === 'template' || s === 'RateLimitLog' || s === 'Settings') return false;
    // Direct match (e.g. "7" === "7")
    if (s === gradeVal) return true;
    // Match by Arabic label name (e.g. "الصف الأول الإعدادي")
    if (fullName) {
      const sNorm = normalizeArabic(s);
      const fNorm = normalizeArabic(fullName);
      if (fNorm && sNorm === fNorm) return true;
    }
    return false;
  });
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
  const gradeText = data.clLabel || GRADE_MAP[data.cl] || data.cl;

  const lines = [
    `${mark}نتيجة امتحانات مدرسة حدائق المعادي القومية${mark}`,
    '─────────────────',
    `الفترة: ${data.termName || ''}`,
    `الطالب: ${mark}${data.stn}${mark}`,
    `الصف: ${gradeText}`,
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
