'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SchoolHeader } from '@/components/school-header';
import { SearchForm } from '@/components/search-form';
import { ResultDisplay } from '@/components/result-display';
import { LoadingAnimation } from '@/components/loading-animation';
import type { StudentResult } from '@/lib/constants';

export default function HomePage() {
  const [result, setResult] = useState<StudentResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState('');

  const handleResult = (data: StudentResult) => {
    setResult(data);
    setSearchError('');
  };

  const handleNewSearch = () => {
    setResult(null);
    setSearchError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoading = (loading: boolean) => {
    setIsLoading(loading);
  };

  const handleError = (errorMsg: string) => {
    setSearchError(errorMsg);
  };

  // Determine which view to show:
  // 1. Loading → show loading animation
  // 2. Result → show result display
  // 3. Default (search/error) → show search form
  const showLoading = isLoading && !result;
  const showResult = !isLoading && result !== null;
  const showSearch = !isLoading && result === null;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-pattern">
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-6 sm:px-6 sm:py-8 space-y-6">
        {/* Header */}
        <SchoolHeader />

        {/* Content */}
        <AnimatePresence mode="wait">
          {showLoading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <LoadingAnimation />
            </motion.div>
          )}

          {showSearch && (
            <motion.div
              key="search"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <SearchForm
                onResult={handleResult}
                onLoading={handleLoading}
                onError={handleError}
                initialError={searchError}
              />
            </motion.div>
          )}

          {showResult && (
            <motion.div
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ResultDisplay data={result} onNewSearch={handleNewSearch} />
            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* Footer */}
      <footer className="py-4 text-center no-print">
        <p className="text-xs text-muted-foreground font-semibold">
          هذه نتيجة استرشادية فقط ولا تعتبر مستنداً رسمياً © {new Date().getFullYear()}
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1 font-medium" dir="ltr">
          Designed by: Mr. Mohamed Khairy
        </p>
      </footer>
    </div>
  );
}
