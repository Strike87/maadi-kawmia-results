'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Loader2,
  GraduationCap,
  BookOpen,
  ChevronDown,
  Hash,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  STAGE_GRADES,
  GRADE_MAP,
  normalizeId,
  isGradeActive,
  getErrorMessage,
  type StudentResult,
  type TermInfo,
} from '@/lib/constants';
import { Turnstile } from '@/components/turnstile';

interface SearchFormProps {
  onResult: (data: StudentResult) => void;
  onLoading: (loading: boolean) => void;
  onError: (errorMsg: string) => void;
  initialError?: string;
}

export function SearchForm({ onResult, onLoading, onError, initialError = '' }: SearchFormProps) {
  const [terms, setTerms] = useState<string[]>([]);
  const [activeSheets, setActiveSheets] = useState<string[]>([]);
  const [selectedTerm, setSelectedTerm] = useState('');
  const [selectedStage, setSelectedStage] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [nationalId, setNationalId] = useState('');
  // Use initialError from page.tsx so error survives component remount
  const [error, setError] = useState(initialError);
  const [warning, setWarning] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [termsLoaded, setTermsLoaded] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  // ─── Live Sync: Fetch terms + activeSheets from Google Sheets ───
  useEffect(() => {
    async function fetchTerms() {
      try {
        const res = await fetch('/api', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'getTermNames' }),
        });
        const data: TermInfo & { error?: string } = await res.json();

        if (data.error) {
          setTerms(['أخر العام 2026']);
          setWarning(getErrorMessage(data.error));
        } else if (data.terms?.length) {
          setTerms(data.terms);
          setActiveSheets(data.activeSheets || []);
        } else {
          setTerms(['أخر العام 2026']);
          setWarning('تعذر الاتصال بالخادم. يتم عرض البيانات الافتراضية.');
        }
      } catch {
        setTerms(['أخر العام 2026']);
        setWarning('تعذر الاتصال بالخادم. يتم عرض البيانات الافتراضية.');
      }
      setTermsLoaded(true);
    }
    fetchTerms();
  }, []);

  // Auto-select term if only one
  useEffect(() => {
    if (terms.length === 1 && !selectedTerm) {
      setSelectedTerm(terms[0]);
    }
  }, [terms, selectedTerm]);

  // ─── filterStages(): Only show stages that have at least 1 active grade ───
  // Changed from useCallback to useMemo — the result is computed, not a function
  const filteredStages = useMemo(() => {
    if (!activeSheets.length) return STAGE_GRADES;
    const filtered: Record<string, { label: string; grades: { value: string; label: string }[] }> = {};
    for (const [key, stage] of Object.entries(STAGE_GRADES)) {
      const activeGrades = stage.grades.filter((g) => isGradeActive(g.value, activeSheets));
      if (activeGrades.length > 0) {
        filtered[key] = { ...stage, grades: activeGrades };
      }
    }
    return filtered;
  }, [activeSheets]);

  // ─── loadGrades(): Only show grades that are active for the selected stage ───
  const currentStageGrades = selectedStage
    ? (filteredStages[selectedStage]?.grades || [])
    : [];

  // Sync error from parent (page.tsx) — e.g. after remount
  useEffect(() => {
    if (initialError) setError(initialError);
  }, [initialError]);

  // Helper: set error locally + notify parent
  const showError = (msg: string) => {
    setError(msg);
    onError(msg);
  };

  // Clear error locally + notify parent
  const clearError = () => {
    setError('');
    onError('');
  };

  // Handle national ID input
  const handleIdChange = (value: string) => {
    const cleaned = normalizeId(value);
    setNationalId(cleaned);
    clearError();
  };

  // Handle search
  const handleSearch = async () => {
    clearError();
    setWarning('');

    // ── Frontend validation ──
    if (!selectedTerm) {
      showError(getErrorMessage('MISSING_FIELDS'));
      return;
    }

    // Validate that the selected term is in the fetched terms list
    if (terms.length > 0 && !terms.includes(selectedTerm)) {
      showError(getErrorMessage('INVALID_TERM'));
      return;
    }

    if (!selectedGrade) {
      showError(getErrorMessage('MISSING_FIELDS'));
      return;
    }

    // Validate that the selected grade exists in GRADE_MAP
    if (!(selectedGrade in GRADE_MAP)) {
      showError(getErrorMessage('INVALID_GRADE'));
      return;
    }

    if (!/^[0-9]{14}$/.test(nationalId)) {
      showError(getErrorMessage('INVALID_ID'));
      return;
    }

    if (!captchaToken) {
      showError(getErrorMessage('MISSING_CAPTCHA'));
      return;
    }

    setIsLoading(true);
    onLoading(true);

    try {
      const res = await fetch('/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'getStudentData',
          termName: selectedTerm,
          cls: selectedGrade,
          roll: nationalId,
          captchaToken: captchaToken || undefined,
        }),
      });

      const data = await res.json();

      if (data.error) {
        // Error already mapped by API route — display and notify parent
        showError(data.error);
        return;
      }

      // ── Extra check: no student found (ID not in database) ──
      // If student name is missing, there is no valid result.
      if (!data.stn || !String(data.stn).trim()) {
        showError(getErrorMessage('NO_RESULT'));
        return;
      }

      onResult(data);
    } catch {
      showError(getErrorMessage('CONNECTION_ERROR'));
    } finally {
      setIsLoading(false);
      onLoading(false);
      setCaptchaToken(null);
      if (window.turnstile) {
        try { window.turnstile.reset(); } catch {}
      }
    }
  };

  const idLength = nationalId.length;
  const isIdComplete = idLength === 14;
  const canSearch = isIdComplete && !!selectedGrade && !!selectedTerm && !!captchaToken;

  return (
    <div className="animate-fadeUp">
      <Card className="w-full max-w-lg mx-auto border-border/50 shadow-xl bg-card/80 backdrop-blur-sm overflow-hidden" role="search" aria-label="البحث عن النتيجة">
        <CardHeader className="pb-3 sm:pb-4 px-5 sm:px-6">
          <CardTitle className="text-lg sm:text-xl font-extrabold text-center flex items-center justify-center gap-2">
            <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            <span>البحث عن النتيجة</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-5 px-5 sm:px-6 pb-6">
          {/* Warning Alert */}
          {warning && (
            <Alert className="border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-700 dark:text-amber-300 text-sm font-extrabold">
                {warning}
              </AlertDescription>
            </Alert>
          )}

          {/* Error Alert */}
          {error && (
            <Alert id="search-form-error" variant="destructive" className="border-red-300">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm font-extrabold" role="alert">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Term Select */}
          <div className="space-y-2">
            <Label htmlFor="term" className="text-sm font-extrabold flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-primary" />
              الفترة الدراسية
            </Label>
            <div className="relative">
              <select
                id="term"
                value={selectedTerm}
                onChange={(e) => {
                  setSelectedTerm(e.target.value);
                  setSelectedStage('');
                  setSelectedGrade('');
                  clearError();
                }}
                disabled={!termsLoaded}
                aria-required="true"
                aria-describedby={error ? 'search-form-error' : undefined}
                className="w-full h-12 sm:h-12 text-sm sm:text-base rounded-lg border border-input bg-transparent px-3 py-2 pr-3 pl-8 font-extrabold appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring disabled:cursor-not-allowed disabled:opacity-50 overflow-hidden text-ellipsis"
                style={{ direction: 'rtl' }}
              >
                <option value="" disabled>-- اختر الفترة الدراسية --</option>
                {terms.map((term) => (
                  <option key={term} value={term}>{term}</option>
                ))}
              </select>
              <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50 pointer-events-none" />
            </div>
          </div>

          {/* Stage Select — filtered: only stages with active grades */}
          <div className="space-y-2">
            <Label htmlFor="stage" className="text-sm font-extrabold flex items-center gap-1.5">
              <GraduationCap className="h-3.5 w-3.5 text-primary" />
              المرحلة الدراسية
            </Label>
            <div className="relative">
              <select
                id="stage"
                value={selectedStage}
                onChange={(e) => {
                  setSelectedStage(e.target.value);
                  setSelectedGrade('');
                  clearError();
                }}
                disabled={!selectedTerm}
                aria-required="true"
                aria-describedby={error ? 'search-form-error' : undefined}
                className="w-full h-12 sm:h-12 text-sm sm:text-base rounded-lg border border-input bg-transparent px-3 py-2 pr-3 pl-8 font-extrabold appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring disabled:cursor-not-allowed disabled:opacity-50 overflow-hidden text-ellipsis"
                style={{ direction: 'rtl' }}
              >
                <option value="" disabled>-- اختر المرحلة الدراسية --</option>
                {Object.entries(filteredStages).map(([key, stage]) => (
                  <option key={key} value={key}>{stage.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50 pointer-events-none" />
            </div>
          </div>

          {/* Grade Select — filtered: only active grades for selected stage */}
          <div className="space-y-2">
            <Label htmlFor="grade" className="text-sm font-extrabold flex items-center gap-1.5">
              <ChevronDown className="h-3.5 w-3.5 text-primary" />
              الصف الدراسي
            </Label>
            <div className="relative">
              <select
                id="grade"
                value={selectedGrade}
                onChange={(e) => {
                  setSelectedGrade(e.target.value);
                  clearError();
                }}
                disabled={!selectedStage}
                aria-required="true"
                aria-describedby={error ? 'search-form-error' : undefined}
                className="w-full h-12 sm:h-12 text-sm sm:text-base rounded-lg border border-input bg-transparent px-3 py-2 pr-3 pl-8 font-extrabold appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring disabled:cursor-not-allowed disabled:opacity-50 overflow-hidden text-ellipsis"
                style={{ direction: 'rtl' }}
              >
                <option value="" disabled>
                  {selectedStage ? '-- اختر الصف الدراسي --' : '-- اختر المرحلة أولاً --'}
                </option>
                {currentStageGrades.map((grade) => (
                  <option key={grade.value} value={grade.value}>{grade.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50 pointer-events-none" />
            </div>
            {selectedGrade && (
              <p className="text-xs text-muted-foreground font-semibold">
                {GRADE_MAP[selectedGrade]}
              </p>
            )}
          </div>

          {/* National ID Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="nationalId" className="text-sm font-extrabold flex items-center gap-1.5">
                <Hash className="h-3.5 w-3.5 text-primary" />
                الرقم القومي
              </Label>
              <span
                className={`text-xs font-extrabold transition-colors duration-300 ${
                  isIdComplete
                    ? 'text-emerald-500'
                    : idLength > 0
                      ? 'text-amber-500'
                      : 'text-muted-foreground'
                }`}
                dir="ltr"
              >
                {idLength} / 14
              </span>
            </div>
            <Input
              id="nationalId"
              type="tel"
              dir="ltr"
              inputMode="numeric"
              maxLength={14}
              placeholder="أدخل الرقم القومي هنا"
              value={nationalId}
              onChange={(e) => handleIdChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isLoading && canSearch) handleSearch();
              }}
              aria-required="true"
              aria-label="الرقم القومي"
              aria-describedby={error ? 'search-form-error' : undefined}
              autoComplete="off"
              className={`h-12 sm:h-12 text-sm sm:text-base text-left font-mono tracking-wider ${
                idLength > 0 && !isIdComplete
                  ? 'border-amber-400 focus:border-amber-500 focus:ring-amber-500/20'
                  : isIdComplete
                    ? 'border-emerald-400 focus:border-emerald-500 focus:ring-emerald-500/20'
                    : ''
              }`}
            />
            {idLength > 0 && !isIdComplete && (
              <p className="text-xs text-amber-500 font-extrabold animate-fadeIn">
                الرقم القومي يجب أن يكون 14 رقماً
              </p>
            )}
          </div>

          {/* Turnstile Captcha */}
          <Turnstile
            onVerify={(token) => setCaptchaToken(token)}
            onExpire={() => setCaptchaToken(null)}
          />

          {/* Submit Button */}
          <Button
            onClick={handleSearch}
            disabled={isLoading || !canSearch}
            className="w-full h-13 text-base font-extrabold gap-2 rounded-xl bg-gradient-to-l from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/30 disabled:opacity-60 disabled:shadow-none"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>جاري البحث...</span>
              </>
            ) : (
              <>
                <Search className="h-5 w-5" />
                <span>عرض النتيجة الآن</span>
              </>
            )}
          </Button>

        </CardContent>
      </Card>
    </div>
  );
}
