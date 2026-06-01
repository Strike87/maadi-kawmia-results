'use client';

import { useEffect, useRef } from 'react';

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';

interface TurnstileProps {
  onVerify: (token: string) => void;
  onExpire: () => void;
}

export function Turnstile({ onVerify, onExpire }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Don't render if no site key or placeholder key
    if (!TURNSTILE_SITE_KEY || TURNSTILE_SITE_KEY === '0x4AAAAAAA_your_site_key_here') {
      return;
    }

    const renderWidget = () => {
      if (!containerRef.current) return;
      if (!window.turnstile) return;

      // Clear any existing widget
      containerRef.current.innerHTML = '';

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: onVerify,
        'expired-callback': onExpire,
        theme: 'light',
        size: 'normal',
        dir: 'rtl',
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
  }, [onVerify, onExpire]);

  // Don't render anything if no site key
  if (!TURNSTILE_SITE_KEY || TURNSTILE_SITE_KEY === '0x4AAAAAAA_your_site_key_here') {
    return null;
  }

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
