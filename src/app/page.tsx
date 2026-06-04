import { SchoolHeader } from '@/components/school-header';
import { SearchPageClient } from '@/components/search-page-client';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-pattern">
      {/* Skip to content link for keyboard navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:right-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:text-sm focus:font-bold"
      >
        تخطي إلى المحتوى الرئيسي
      </a>
      <main id="main-content" className="flex-1 w-full max-w-4xl mx-auto px-5 py-5 sm:px-8 sm:py-8 space-y-4 sm:space-y-6">
        {/* Header — server-rendered for SEO and FCP */}
        <SchoolHeader />

        {/* Interactive search/result content — client component */}
        <SearchPageClient />
      </main>
    </div>
  );
}
