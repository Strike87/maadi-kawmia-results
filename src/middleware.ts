import { NextRequest, NextResponse } from 'next/server';

// ─── Rate Limiter ───
// NOTE: This in-memory Map is local to each Edge Function instance.
// On Vercel, cold starts get a fresh map, so rate limits reset per-cold-start.
// For production-grade distributed rate limiting, use Vercel KV or Upstash.
// Current approach still provides meaningful protection for warm instances.
const API_RATE_LIMIT = 15;       // /api: 15 req/min per IP (generous for families)
const WINDOW_MS = 60_000;       // 1 minute

const ipMap = new Map<string, { count: number; start: number }>();

// Clean up stale entries on each invocation instead of setInterval
// (setInterval is unreliable in serverless Edge Functions)
function cleanupStaleEntries() {
  const now = Date.now();
  for (const [key, entry] of ipMap.entries()) {
    if (now - entry.start > WINDOW_MS * 2) {
      ipMap.delete(key);
    }
  }
}

function isRateLimited(ip: string, endpoint: string, limit: number): boolean {
  const key = `${ip}:${endpoint}`;
  const now = Date.now();
  const entry = ipMap.get(key);

  if (!entry || now - entry.start > WINDOW_MS) {
    ipMap.set(key, { count: 1, start: now });
    return false;
  }

  entry.count++;
  return entry.count > limit;
}

// ─── Bot Detection — Whitelist legitimate crawlers for SEO ───
const BAD_BOT_PATTERNS = [
  /scrape/i, /curl/i, /wget/i,
  /python-requests/i, /httpclient/i, /java\//i, /node-fetch/i,
  /go-http/i, /php/i, /ruby/i, /semrush/i, /ahrefs/i,
  /majestic/i, /dotbot/i, /rogerbot/i, /exabot/i, /mj12bot/i,
];

// Legitimate bots that should be allowed (SEO, social previews)
const GOOD_BOT_PATTERNS = [
  /googlebot/i, /bingbot/i, /yandexbot/i,
  /twitterbot/i, /facebookexternalhit/i, /slackbot/i, /linkedinbot/i,
  /applebot/i, /duckduckbot/i, /baiduspider/i,
];

function isBadBot(userAgent: string): boolean {
  if (!userAgent) return true; // No UA = suspicious
  // Allow known good bots
  if (GOOD_BOT_PATTERNS.some((p) => p.test(userAgent))) return false;
  // Block known bad bots
  return BAD_BOT_PATTERNS.some((pattern) => pattern.test(userAgent));
}

// ─── Security Headers ───
function addSecurityHeaders(response: NextResponse, nonce?: string): NextResponse {
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  // Removed deprecated X-XSS-Protection — CSP provides equivalent protection
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      // Nonce for Turnstile script + 'self' for Next.js runtime + 'unsafe-inline' for Next.js hydration
      // Note: 'unsafe-inline' is needed because Next.js injects inline scripts for React hydration
      // that don't carry the nonce. The nonce still protects the Turnstile script specifically.
      nonce
        ? `script-src 'self' 'nonce-${nonce}' 'unsafe-inline' https://challenges.cloudflare.com`
        : "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https://lh3.googleusercontent.com",
      // Removed https://script.google.com — API proxies server-side, browser never connects directly
      "connect-src 'self' https://challenges.cloudflare.com",
      "frame-src https://challenges.cloudflare.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join('; ')
  );
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  return response;
}

// ─── Get Client IP ───
function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  );
}

// ─── Generate CSP nonce ───
// Uses Edge Runtime-compatible APIs only (no Buffer / Node.js)
function generateNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  // btoa is available in Edge Runtime
  return btoa(String.fromCharCode(...bytes));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Clean up stale rate limit entries (replaces unreliable setInterval)
  cleanupStaleEntries();

  // ─── Path traversal protection ───
  // Block encoded/decoded path traversal attempts (e.g. /..%2F, /%2e%2e/)
  const decodedPath = decodeURIComponent(pathname);
  if (decodedPath.includes('..') || /\0/.test(decodedPath)) {
    return new NextResponse(null, { status: 400 });
  }

  // ─── Bot Protection — only block bad bots on pages ───
  const userAgent = request.headers.get('user-agent') || '';
  if (isBadBot(userAgent) && !pathname.startsWith('/_next') && !pathname.startsWith('/api')) {
    return new NextResponse(null, {
      status: 403,
      statusText: 'Forbidden - Bot Detected',
    });
  }

  // ─── Rate Limiting on API routes ───
  if (pathname.startsWith('/api')) {
    const ip = getClientIP(request);

    // We don't know the action yet from middleware, so use a combined limit
    // The API route itself handles per-action logic
    if (isRateLimited(ip, 'api', API_RATE_LIMIT)) {
      return NextResponse.json(
        { error: 'تم إرسال طلبات كثيرة في وقت قصير' },
        { status: 429 }
      );
    }
  }

  // ─── Add Security Headers + CSP nonce to all responses ───
  const nonce = generateNonce();

  // Pass nonce to downstream via REQUEST header so server components can read it
  // (headers() in server components reads request headers, not response headers)
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-csp-nonce', nonce);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  return addSecurityHeaders(response, nonce);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except _next/static, _next/image, favicon
     */
    '/((?!_next/static|_next/image|favicon\\.ico).*)',
  ],
};
