'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Loader2,
  GraduationCap,
  BookOpen,
  ChevronDown,
  Hash,
  AlertCircle,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  STAGE_GRADES,
  GRADE_MAP,
  normalizeId,
  isGradeActive,
  resolveSheetName,
  type StudentResult,
  type TermInfo,
} from '@/lib/constants';
import { Turnstile } from '@/components/turnstile';

interface SearchFormProps {
  onResult: (data: StudentResult) => void;
  onLoading: (loading: boolean) => void;
}

export function SearchForm({ onResult, onLoading }: SearchFormProps) {
  const [terms, setTerms] = useState<string[]>([]);
  const [activeSheets, setActiveSheets] = useState<string[]>([]);
  const [selectedTerm, setSelectedTerm] = useState('');
  const [selectedStage, setSelectedStage] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [termsLoaded, setTermsLoaded] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  // Fetch terms on mount
  useEffect(() => {
    async function fetchTerms() {
      try {
        const res = await fetch('/api', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'getTermNames' }),
        });
        const data: TermInfo = await res.json();

        if (data.terms?.length) {
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

  // Get available stages
  const getAvailableStages = useCallback(() => {
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

  const availableStages = getAvailableStages();
  const currentStageGrades = selectedStage ? availableStages[selectedStage]?.grades || [] : [];

  // Handle national ID input
  const handleIdChange = (value: string) => {
    const cleaned = normalizeId(value);
    setNationalId(cleaned);
    setError('');
  };

  // Handle search
  const handleSearch = async () => {
    setError('');
    setWarning('');

    if (!selectedTerm) {
      setError('يرجى اختيار الفترة الدراسية.');
      return;
    }
    if (!selectedGrade) {
      setError('يرجى اختيار الصف الدراسي.');
      return;
    }
    if (!/^[0-9]{14}$/.test(nationalId)) {
      setError('الرقم القومي يجب أن يكون 14 رقماً.');
      return;
    }

    if (!captchaToken) {
      setError('يرجى إكمال التحقق الأمني أولاً.');
      return;
    }

    setIsLoading(true);
    onLoading(true);

    try {
      // Resolve the actual sheet name (e.g. "7" → "7@")
      const resolvedGrade = resolveSheetName(selectedGrade, activeSheets);

      const res = await fetch('/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'getStudentData',
          termName: selectedTerm,
          cls: resolvedGrade,
          roll: nationalId,
          captchaToken: captchaToken || undefined,
        }),
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      onResult(data);
    } catch {
      setError('حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.');
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <Card className="w-full max-w-lg mx-auto border-border/50 shadow-xl bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-bold text-center flex items-center justify-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            <span>البحث عن النتيجة</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Warning Alert */}
          <AnimatePresence>
            {warning && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Alert className="border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-700 dark:text-amber-300 text-sm font-semibold">
                    {warning}
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Alert */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Alert variant="destructive" className="border-red-300">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm font-bold">
                    {error}
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Term Select */}
          <div className="space-y-2">
            <Label htmlFor="term" className="text-sm font-bold flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-primary" />
              الفترة الدراسية
            </Label>
            <Select
              value={selectedTerm}
              onValueChange={(val) => {
                setSelectedTerm(val);
                setSelectedStage('');
                setSelectedGrade('');
                setError('');
              }}
              disabled={!termsLoaded}
            >
              <SelectTrigger id="term" className="w-full h-12 text-base">
                <SelectValue placeholder="-- اختر الفترة الدراسية --" />
              </SelectTrigger>
              <SelectContent>
                {terms.map((term) => (
                  <SelectItem key={term} value={term} className="text-base">
                    {term}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Stage Select */}
          <div className="space-y-2">
            <Label htmlFor="stage" className="text-sm font-bold flex items-center gap-1.5">
              <GraduationCap className="h-3.5 w-3.5 text-primary" />
              المرحلة الدراسية
            </Label>
            <Select
              value={selectedStage}
              onValueChange={(val) => {
                setSelectedStage(val);
                setSelectedGrade('');
                setError('');
              }}
              disabled={!selectedTerm}
            >
              <SelectTrigger id="stage" className="w-full h-12 text-base">
                <SelectValue placeholder="-- اختر المرحلة الدراسية --" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(availableStages).map(([key, stage]) => (
                  <SelectItem key={key} value={key} className="text-base">
                    {stage.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Grade Select */}
          <div className="space-y-2">
            <Label htmlFor="grade" className="text-sm font-bold flex items-center gap-1.5">
              <ChevronDown className="h-3.5 w-3.5 text-primary" />
              الصف الدراسي
            </Label>
            <Select
              value={selectedGrade}
              onValueChange={(val) => {
                setSelectedGrade(val);
                setError('');
              }}
              disabled={!selectedStage}
            >
              <SelectTrigger id="grade" className="w-full h-12 text-base">
                <SelectValue placeholder={
                  selectedStage
                    ? '-- اختر الصف الدراسي --'
                    : '-- اختر المرحلة الدراسية أولاً --'
                } />
              </SelectTrigger>
              <SelectContent>
                {currentStageGrades.map((grade) => (
                  <SelectItem key={grade.value} value={grade.value} className="text-base">
                    {grade.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedGrade && (
              <p className="text-xs text-muted-foreground font-semibold">
                {GRADE_MAP[selectedGrade]}
              </p>
            )}
          </div>

          {/* National ID Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="nationalId" className="text-sm font-bold flex items-center gap-1.5">
                <Hash className="h-3.5 w-3.5 text-primary" />
                الرقم القومي
              </Label>
              <span
                className={`text-xs font-bold transition-colors duration-300 ${
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
              className={`h-12 text-base text-left font-mono tracking-wider ${
                idLength > 0 && !isIdComplete
                  ? 'border-amber-400 focus:border-amber-500 focus:ring-amber-500/20'
                  : isIdComplete
                    ? 'border-emerald-400 focus:border-emerald-500 focus:ring-emerald-500/20'
                    : ''
              }`}
            />
            {idLength > 0 && !isIdComplete && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-amber-500 font-bold"
              >
                الرقم القومي يجب أن يكون 14 رقماً
              </motion.p>
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
            className="w-full h-13 text-base font-bold gap-2 rounded-xl bg-gradient-to-l from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/30 disabled:opacity-60 disabled:shadow-none"
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
                <span>عرض النتيجة</span>
              </>
            )}
          </Button>

          {/* Security Note */}
          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Shield className="h-3 w-3" />
            <span className="font-semibold">بياناتك محمية ولا يتم تخزينها</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
