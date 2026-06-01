'use client';

import { useEffect, useRef } from 'react';

// Cloudflare Turnstile test keys from https://developers.cloudflare.com/turnstile/troubleshooting/testing/
const TURNSTILE_SITE_KEY =
  (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY &&
   process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY !== '0x4AAAAAAA_your_site_key_here')
    ? process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
    : '1x00000000000000000000AA'; // Visible always-passes test key

interface TurnstileProps {
  onVerify: (token: string) => void;
  onExpire: () => void;
}

export function Turnstile({ onVerify, onExpire }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const verifiedRef = useRef(false);
  const onVerifyRef = useRef(onVerify);
  const onExpireRef = useRef(onExpire);

  useEffect(() => { onVerifyRef.current = onVerify; }, [onVerify]);
  useEffect(() => { onExpireRef.current = onExpire; }, [onExpire]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    let timeoutId: NodeJS.Timeout;

    const renderWidget = () => {
      if (!containerRef.current || verifiedRef.current) return;
      if (!window.turnstile) return;

      // Clear any existing widget
      containerRef.current.innerHTML = '';

      try {
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
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
        return;
      }

      // Poll for the token - Turnstile sometimes renders the token
      // in a hidden input without calling the callback
      let pollCount = 0;
      intervalId = setInterval(() => {
        if (verifiedRef.current) {
          clearInterval(intervalId);
          return;
        }
        pollCount++;
        const hiddenInput = containerRef.current?.querySelector(
          'input[name="cf-turnstile-response"]'
        ) as HTMLInputElement | null;
        if (hiddenInput && hiddenInput.value && hiddenInput.value.length > 10) {
          verifiedRef.current = true;
          onVerifyRef.current(hiddenInput.value);
          clearInterval(intervalId);
        }
        if (pollCount > 30) {
          // 6 seconds - give up polling
          clearInterval(intervalId);
        }
      }, 200);
    };

    // If turnstile is already loaded, render immediately
    if (window.turnstile) {
      renderWidget();
    } else {
      // Wait for the script to load
      const loadInterval = setInterval(() => {
        if (window.turnstile) {
          clearInterval(loadInterval);
          renderWidget();
        }
      }, 300);

      // Timeout fallback
      timeoutId = setTimeout(() => {
        clearInterval(loadInterval);
        if (!verifiedRef.current) {
          console.warn('Turnstile failed to load, auto-verifying');
          verifiedRef.current = true;
          onVerifyRef.current('fallback-token');
        }
      }, 10000);
    }

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div ref={containerRef} className="flex justify-center min-h-[65px]" />
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
