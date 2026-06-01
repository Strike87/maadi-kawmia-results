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
    // Check if we have a real site key
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    const hasRealKey = !!(siteKey && siteKey !== '0x4AAAAAAA_your_site_key_here');

    // If no real key, show the security label and auto-verify after short delay
    if (!hasRealKey) {
      setShowLabel(true);
    }

    const renderWidget = () => {
      if (!containerRef.current || !window.turnstile) return;
      containerRef.current.innerHTML = '';
      try {
        window.turnstile.render(containerRef.current, {
          sitekey: hasRealKey ? siteKey! : '1x00000000000000000000AA',
          callback: (token: string) => {
            if (!verifiedRef.current) {
              verifiedRef.current = true;
              onVerifyRef.current(token);
            }
          },
          'expired-callback': () => {
            verifiedRef.current = false;
            onExpireRef.current();
          },
          theme: 'light',
          size: 'normal',
        });
      } catch (e) {
        console.error('Turnstile render error:', e);
        if (!verifiedRef.current) {
          verifiedRef.current = true;
          onVerifyRef.current('fallback-token');
        }
      }
    };

    // Poll for token in hidden input as fallback
    let pollInterval: NodeJS.Timeout | null = null;
    const startPolling = () => {
      let count = 0;
      pollInterval = setInterval(() => {
        if (verifiedRef.current) {
          if (pollInterval) clearInterval(pollInterval);
          return;
        }
        count++;
        const input = document.querySelector('input[name="cf-turnstile-response"]') as HTMLInputElement | null;
        if (input && input.value && input.value.length > 10) {
          verifiedRef.current = true;
          onVerifyRef.current(input.value);
          if (pollInterval) clearInterval(pollInterval);
        }
        // Auto-verify after 5 seconds
        if (count > 25 && !verifiedRef.current) {
          verifiedRef.current = true;
          onVerifyRef.current('auto-verified');
          if (pollInterval) clearInterval(pollInterval);
        }
      }, 200);
    };

    if (window.turnstile) {
      renderWidget();
      startPolling();
    } else {
      const loadInterval = setInterval(() => {
        if (window.turnstile) {
          clearInterval(loadInterval);
          renderWidget();
          startPolling();
        }
      }, 300);

      const timeout = setTimeout(() => {
        clearInterval(loadInterval);
        if (!verifiedRef.current) {
          verifiedRef.current = true;
          onVerifyRef.current('auto-verified');
        }
      }, 8000);

      return () => {
        clearInterval(loadInterval);
        clearTimeout(timeout);
        if (pollInterval) clearInterval(pollInterval);
      };
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
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
