'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import type { StudentResult } from '@/lib/constants';

// Dynamic imports — ResultDisplay and LoadingAnimation are only needed
// after user interaction, so they don't need to be in the initial bundle.
const LoadingAnimation = dynamic(
  () => import('@/components/loading-animation').then((mod) => ({ default: mod.LoadingAnimation })),
  { ssr: false }
);

const ResultDisplay = dynamic(
  () => import('@/components/result-display').then((mod) => ({ default: mod.ResultDisplay })),
  { ssr: false }
);

// SearchForm is imported eagerly — it's the first thing users see
import { SearchForm } from '@/components/search-form';

export function SearchPageClient() {
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
    <>
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
          <ResultDisplay data={result!} onNewSearch={handleNewSearch} />
        </div>
      )}
    </>
  );
}
