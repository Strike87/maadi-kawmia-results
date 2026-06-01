'use client';

import { useEffect, useRef, useState } from 'react';

// Cloudflare Turnstile test keys
// Visible: 1x00000000000000000000AA (shows widget, always passes)
// Invisible: 1x00000000000000000000BB (invisible, always passes)
const TURNSTILE_SITE_KEY =
  (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY &&
   process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY !== '0x4AAAAAAA_your_site_key_here')
    ? process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
    : '1x00000000000000000000AA'; // Visible test key

interface TurnstileProps {
  onVerify: (token: string) => void;
  onExpire: () => void;
}

export function Turnstile({ onVerify, onExpire }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onVerifyRef = useRef(onVerify);
  const onExpireRef = useRef(onExpire);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Keep callbacks in refs
  useEffect(() => { onVerifyRef.current = onVerify; }, [onVerify]);
  useEffect(() => { onExpireRef.current = onExpire; }, [onExpire]);

  // Wait for Turnstile script to be available
  useEffect(() => {
    const checkAndRender = () => {
      if (!containerRef.current) return;
      if (!window.turnstile) return;

      // Clear any existing widget
      containerRef.current.innerHTML = '';

      try {
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          callback: (token: string) => onVerifyRef.current(token),
          'expired-callback': () => onExpireRef.current(),
          theme: 'light',
          size: 'normal',
        });
      } catch (e) {
        console.error('Turnstile render error:', e);
        // Fallback: auto-verify so the form still works
        onVerifyRef.current('test-token-fallback');
      }
    };

    // If turnstile is already loaded, render immediately
    if (window.turnstile) {
      checkAndRender();
      return;
    }

    // Wait for the script to load (it's loaded via <head> in layout.tsx)
    const interval = setInterval(() => {
      if (window.turnstile) {
        clearInterval(interval);
        checkAndRender();
      }
    }, 300);

    // Timeout after 10 seconds - auto-verify as fallback
    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (!window.turnstile) {
        console.warn('Turnstile script failed to load, auto-verifying');
        onVerifyRef.current('test-token-fallback');
      }
    }, 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <div ref={containerRef} className="flex justify-center min-h-[65px]" />
  );
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
