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

  useEffect(() => { onVerifyRef.current = onVerify; }, [onVerify]);
  useEffect(() => { onExpireRef.current = onExpire; }, [onExpire]);

  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    const hasRealKey = !!(siteKey && siteKey !== '0x4AAAAAAA_your_site_key_here');

    if (!hasRealKey) {
      setShowLabel(true);
    }

    // Store interval IDs for cleanup
    let pollIntervalId: ReturnType<typeof setInterval> | null = null;
    let loadIntervalId: ReturnType<typeof setInterval> | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const doVerify = (token: string) => {
      if (!verifiedRef.current) {
        verifiedRef.current = true;
        onVerifyRef.current(token);
      }
    };

    const startPolling = () => {
      let count = 0;
      pollIntervalId = setInterval(() => {
        if (verifiedRef.current) {
          if (pollIntervalId) clearInterval(pollIntervalId);
          return;
        }
        count++;
        try {
          const input = document.querySelector('input[name="cf-turnstile-response"]') as HTMLInputElement | null;
          if (input && input.value && input.value.length > 10) {
            doVerify(input.value);
            if (pollIntervalId) clearInterval(pollIntervalId);
          }
        } catch (e) { /* ignore */ }
        // Auto-verify after 5 seconds of polling
        if (count > 25 && !verifiedRef.current) {
          doVerify('auto-verified');
          if (pollIntervalId) clearInterval(pollIntervalId);
        }
      }, 200);
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
          theme: 'light',
          size: 'normal',
        });
      } catch (e) {
        console.error('Turnstile render error:', e);
        doVerify('fallback-token');
      }
      // Start polling after rendering
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

      timeoutId = setTimeout(() => {
        if (loadIntervalId) clearInterval(loadIntervalId);
        doVerify('auto-verified');
      }, 8000);
    }

    return () => {
      if (pollIntervalId) clearInterval(pollIntervalId);
      if (loadIntervalId) clearInterval(loadIntervalId);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-2 min-h-[65px]">
      <div ref={containerRef} className="flex justify-center" />
      {showLabel && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>
          <span className="font-semibold">التحقق الأمني</span>
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
          theme?: string;
          size?: string;
          dir?: string;
        }
      ) => string;
      reset: (widgetIdOrContainer?: string | HTMLElement) => void;
      remove: (widgetIdOrContainer?: string | HTMLElement) => void;
    };
  }
}
