'use client';

import { useState } from 'react';
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

  const showLoading = isLoading && !result;
  const showResult = !isLoading && result !== null;
  const showSearch = !isLoading && result === null;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-pattern">
      {/* Skip to content link for keyboard navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:right-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:text-sm focus:font-bold"
      >
        تخطي إلى المحتوى الرئيسي
      </a>
      <main id="main-content" className="flex-1 w-full max-w-4xl mx-auto px-5 py-5 sm:px-8 sm:py-8 space-y-4 sm:space-y-6" aria-live="polite">
        {/* Header */}
        <SchoolHeader />

        {/* Content — CSS-only transitions */}
        {showLoading && (
          <div key="loading" className="animate-fadeIn">
            <LoadingAnimation />
          </div>
        )}

        {showSearch && (
          <div key="search" className="animate-fadeIn">
            <SearchForm
              onResult={handleResult}
              onLoading={handleLoading}
              onError={handleError}
              initialError={searchError}
            />
          </div>
        )}

        {showResult && (
          <div key="result" className="animate-fadeIn">
            <ResultDisplay data={result} onNewSearch={handleNewSearch} />
          </div>
        )}

      </main>
    </div>
  );
}
