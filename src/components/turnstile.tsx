'use client';

import { useEffect, useRef } from 'react';

// Use real site key if configured, otherwise use Cloudflare test key (always passes)
// Test keys from: https://developers.cloudflare.com/turnstile/troubleshooting/testing/
const TURNSTILE_SITE_KEY =
  (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY &&
   process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY !== '0x4AAAAAAA_your_site_key_here')
    ? process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
    : '1x00000000000000000000AA'; // Cloudflare always-passes test key

interface TurnstileProps {
  onVerify: (token: string) => void;
  onExpire: () => void;
}

export function Turnstile({ onVerify, onExpire }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onVerifyRef = useRef(onVerify);
  const onExpireRef = useRef(onExpire);

  // Keep callbacks in refs to avoid re-rendering the widget
  useEffect(() => { onVerifyRef.current = onVerify; }, [onVerify]);
  useEffect(() => { onExpireRef.current = onExpire; }, [onExpire]);

  useEffect(() => {
    const renderWidget = () => {
      if (!containerRef.current) return;
      if (!window.turnstile) return;

      // Clear any existing widget
      containerRef.current.innerHTML = '';

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: (token: string) => onVerifyRef.current(token),
        'expired-callback': () => onExpireRef.current(),
        theme: 'light',
        size: 'normal',
      });
    };

    // If turnstile is already loaded, render immediately
    if (window.turnstile) {
      renderWidget();
      return;
    }

    // Otherwise, wait for it to load
    const interval = setInterval(() => {
      if (window.turnstile) {
        clearInterval(interval);
        renderWidget();
      }
    }, 200);

    return () => clearInterval(interval);
  }, []);

  return <div ref={containerRef} className="flex justify-center" />;
}

// Extend window type for Turnstile
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
