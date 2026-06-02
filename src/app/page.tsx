'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SchoolHeader } from '@/components/school-header';
import { SearchForm } from '@/components/search-form';
import { ResultDisplay } from '@/components/result-display';
import { LoadingAnimation } from '@/components/loading-animation';
import { CommonErrors } from '@/components/common-errors';
import type { StudentResult } from '@/lib/constants';

export default function HomePage() {
  const [result, setResult] = useState<StudentResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(true);

  const handleResult = (data: StudentResult) => {
    setResult(data);
    setShowSearch(false);
  };

  const handleNewSearch = () => {
    setResult(null);
    setShowSearch(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoading = (loading: boolean) => {
    setIsLoading(loading);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-pattern">
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-6 sm:px-6 sm:py-8 space-y-6">
        {/* Header */}
        <SchoolHeader />

        {/* Content */}
        <AnimatePresence mode="wait">
          {isLoading && (
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

          {!isLoading && showSearch && (
            <motion.div
              key="search"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <SearchForm onResult={handleResult} onLoading={handleLoading} />
            </motion.div>
          )}

          {!isLoading && !showSearch && result && (
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

        {/* Common Errors - only show on search screen */}
        {!isLoading && showSearch && <CommonErrors />}
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
