'use client';

import { useEffect, useRef, useState } from 'react';

interface TurnstileProps {
  onVerify: (token: string) => void;
  onExpire: () => void;
}

export function Turnstile({ onVerify, onExpire }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onVerifyRef = useRef(onVerify);
  const onExpireRef = useRef(onExpire);
  const verifiedRef = useRef(false);
  const [showLabel, setShowLabel] = useState(false);
  const [widgetError, setWidgetError] = useState(false);

  useEffect(() => { onVerifyRef.current = onVerify; }, [onVerify]);
  useEffect(() => { onExpireRef.current = onExpire; }, [onExpire]);

  // Detect dark mode for Turnstile widget theme
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDark(mq.matches || document.documentElement.classList.contains('dark'));
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    const hasRealKey = !!(siteKey && siteKey !== '0x4AAAAAAA_your_site_key_here');

    if (!hasRealKey) {
      setShowLabel(true);
    }

    // Store interval/timeout IDs for cleanup
    let pollIntervalId: ReturnType<typeof setInterval> | null = null;
    let loadIntervalId: ReturnType<typeof setInterval> | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const doVerify = (token: string) => {
      if (!verifiedRef.current) {
        verifiedRef.current = true;
        onVerifyRef.current(token);
      }
    };

    // Poll the hidden input for the real Turnstile response token.
    // Only accepts REAL tokens from the widget — NO fake fallback tokens.
    const startPolling = () => {
      pollIntervalId = setInterval(() => {
        if (verifiedRef.current) {
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
      if (!containerRef.current || !window.turnstile) return;
      containerRef.current.innerHTML = '';
      try {
        window.turnstile.render(containerRef.current, {
          sitekey: hasRealKey ? siteKey! : '1x00000000000000000000AA',
          callback: (token: string) => doVerify(token),
          'expired-callback': () => {
            verifiedRef.current = false;
            onExpireRef.current();
          },
          'error-callback': () => {
            // Widget encountered an error — show message, don't generate fake token
            setWidgetError(true);
            return true; // Don't retry
          },
          theme: isDark ? 'dark' : 'light',
          appearance: 'always',
          size: 'normal',
        });
      } catch {
        // Render failed — show message, don't generate fake token
        setWidgetError(true);
        return;
      }
      // Start polling for the real token
      startPolling();
    };

    if (window.turnstile) {
      renderWidget();
    } else {
      loadIntervalId = setInterval(() => {
        if (window.turnstile) {
          if (loadIntervalId) clearInterval(loadIntervalId);
          renderWidget();
        }
      }, 300);

      // After 15 seconds, if Turnstile script still hasn't loaded,
      // show an error instead of generating a fake token
      timeoutId = setTimeout(() => {
        if (loadIntervalId) clearInterval(loadIntervalId);
        if (!verifiedRef.current) {
          setWidgetError(true);
        }
      }, 15000);
    }

    return () => {
      if (pollIntervalId) clearInterval(pollIntervalId);
      if (loadIntervalId) clearInterval(loadIntervalId);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  // Reset widget error state when component remounts
  useEffect(() => {
    verifiedRef.current = false;
    setWidgetError(false);
  }, []);

  return (
    <div className="flex flex-col items-center gap-2 min-h-[65px] w-full">
      {/* Bordered rectangle wrapper around the captcha widget */}
      <div
        className="cf-turnstile-border w-full flex justify-center items-center rounded-lg border-2 border-input bg-muted/30 p-2"
        style={{ maxWidth: '302px', minHeight: '65px' }}
      >
        <div
          ref={containerRef}
          className="cf-turnstile-container flex justify-center w-full"
        />
      </div>
      {showLabel && !widgetError && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>
          <span className="font-semibold">التحقق الأمني</span>
        </div>
      )}
      {widgetError && (
        <div className="flex items-center gap-2 text-sm text-amber-600">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <span className="font-semibold">تعذر تحميل التحقق الأمني — يرجى إعادة تحميل الصفحة</span>
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
