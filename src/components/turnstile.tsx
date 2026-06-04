'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface TurnstileProps {
  onVerify: (token: string) => void;
  onExpire: () => void;
}

const MAX_RETRIES = 3;

export function Turnstile({ onVerify, onExpire }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onVerifyRef = useRef(onVerify);
  const onExpireRef = useRef(onExpire);
  const verifiedRef = useRef(false);
  const widgetIdRef = useRef<string | null>(null);
  const [showLabel, setShowLabel] = useState(false);
  const [widgetError, setWidgetError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const retryCountRef = useRef(0);

  useEffect(() => { onVerifyRef.current = onVerify; }, [onVerify]);
  useEffect(() => { onExpireRef.current = onExpire; }, [onExpire]);

  // Detect dark mode for Turnstile widget theme — store in ref to avoid
  // destroying the widget on theme toggle; we reset() instead.
  const isDarkRef = useRef(false);
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const current = mq.matches || document.documentElement.classList.contains('dark');
    isDarkRef.current = current;
    setIsDark(current);

    const observer = new MutationObserver(() => {
      const now = document.documentElement.classList.contains('dark');
      if (now !== isDarkRef.current) {
        isDarkRef.current = now;
        setIsDark(now);
        // Instead of destroying & recreating, just reset the widget
        // so it picks up the new theme on re-render
        if (widgetIdRef.current && window.turnstile) {
          try { window.turnstile.reset(widgetIdRef.current); } catch { /* ignore */ }
        }
      }
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const doVerify = useCallback((token: string) => {
    if (!verifiedRef.current) {
      verifiedRef.current = true;
      onVerifyRef.current(token);
    }
  }, []);

  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    const hasRealKey = !!(siteKey && siteKey !== '0x4AAAAAAA_your_site_key_here');

    // In production, fail if no real key is configured
    if (!hasRealKey && process.env.NODE_ENV === 'production') {
      setWidgetError(true);
      return;
    }

    // In development without a real key, skip captcha and auto-verify
    if (!hasRealKey) {
      setShowLabel(true);
      onVerifyRef.current('dev-bypass-token');
      verifiedRef.current = true;
      return;
    }

    // Reset state for this render cycle
    verifiedRef.current = false;
    setWidgetError(false);

    let pollIntervalId: ReturnType<typeof setInterval> | null = null;
    let loadIntervalId: ReturnType<typeof setInterval> | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const startPolling = () => {
      pollIntervalId = setInterval(() => {
        if (verifiedRef.current || cancelled) {
          if (pollIntervalId) clearInterval(pollIntervalId);
          return;
        }
        try {
          const input = document.querySelector('input[name="cf-turnstile-response"]') as HTMLInputElement | null;
          if (input && input.value && input.value.length > 20) {
            doVerify(input.value);
            if (pollIntervalId) clearInterval(pollIntervalId);
          }
        } catch { /* ignore */ }
      }, 300);
    };

    const renderWidget = () => {
      if (!containerRef.current || !window.turnstile || cancelled) return;

      // Clear previous widget content
      containerRef.current.innerHTML = '';

      try {
        const wid = window.turnstile.render(containerRef.current, {
          sitekey: siteKey!,
          callback: (token: string) => doVerify(token),
          'expired-callback': () => {
            verifiedRef.current = false;
            onExpireRef.current();
          },
          'error-callback': () => {
            // Return false to let Turnstile auto-retry internally
            // Only set our error state if retries are exhausted
            if (retryCountRef.current >= MAX_RETRIES) {
              setWidgetError(true);
            }
            return false; // Allow Turnstile to retry
          },
          theme: isDarkRef.current ? 'dark' : 'light',
          appearance: 'always',
          size: 'normal',
        });
        widgetIdRef.current = wid;
      } catch {
        if (retryCountRef.current >= MAX_RETRIES) {
          setWidgetError(true);
        }
        return;
      }
      startPolling();
    };

    if (window.turnstile) {
      renderWidget();
    } else {
      loadIntervalId = setInterval(() => {
        if (cancelled) {
          if (loadIntervalId) clearInterval(loadIntervalId);
          return;
        }
        if (window.turnstile) {
          if (loadIntervalId) clearInterval(loadIntervalId);
          renderWidget();
        }
      }, 300);

      // After 20 seconds, if Turnstile script still hasn't loaded, show error
      timeoutId = setTimeout(() => {
        if (loadIntervalId) clearInterval(loadIntervalId);
        if (!verifiedRef.current && !cancelled) {
          setWidgetError(true);
        }
      }, 20000);
    }

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        try { window.turnstile.remove(widgetIdRef.current); } catch { /* ignore */ }
        widgetIdRef.current = null;
      }
      if (pollIntervalId) clearInterval(pollIntervalId);
      if (loadIntervalId) clearInterval(loadIntervalId);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [retryCount, doVerify, isDark]); // Re-run on retry or theme change

  // Manual retry handler
  const handleRetry = () => {
    retryCountRef.current += 1;
    setRetryCount(prev => prev + 1);
    // State reset happens in the effect above
  };

  // Full page reload as last resort
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="flex flex-col items-center gap-2 min-h-[65px] w-full" aria-label="التحقق الأمني من Cloudflare">
      <div
        ref={containerRef}
        className="cf-turnstile-container flex justify-center w-full"
        aria-label="تحقق كابتشا"
      />
      {showLabel && !widgetError && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>
          <span className="font-extrabold">التحقق الأمني</span>
        </div>
      )}
      {widgetError && (
        <div className="flex flex-col items-center gap-2 text-sm text-amber-600">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <span className="font-extrabold">تعذر تحميل التحقق الأمني</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRetry}
              className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-extrabold text-xs transition-colors"
              type="button"
            >
              إعادة المحاولة
            </button>
            <button
              onClick={handleReload}
              className="px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-extrabold text-xs transition-colors"
              type="button"
            >
              تحديث الصفحة
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

declare global {
  interface Window {
    turnstile: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'expired-callback': () => void;
          'error-callback'?: () => boolean;
          theme?: string;
          size?: string;
          appearance?: 'always' | 'execute' | 'interaction-only';
          dir?: string;
        }
      ) => string;
      reset: (widgetIdOrContainer?: string | HTMLElement) => void;
      remove: (widgetIdOrContainer?: string | HTMLElement) => void;
    };
  }
}
