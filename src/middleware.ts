import { NextRequest, NextResponse } from 'next/server';

// ─── Rate Limiter: 5 requests / minute per IP ───
const RATE_LIMIT = 5;
const WINDOW_MS = 60_000; // 1 minute

const ipMap = new Map<string, { count: number; start: number }>();

// Periodically clean up stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of ipMap.entries()) {
    if (now - entry.start > WINDOW_MS * 2) {
      ipMap.delete(ip);
    }
  }
}, 5 * 60_000);

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = ipMap.get(ip);

  if (!entry || now - entry.start > WINDOW_MS) {
    ipMap.set(ip, { count: 1, start: now });
    return false;
  }

  entry.count++;
  return entry.count > RATE_LIMIT;
}

// ─── Bot Detection ───
const BOT_PATTERNS = [
  /bot/i, /crawl/i, /spider/i, /scrape/i, /curl/i, /wget/i,
  /python-requests/i, /httpclient/i, /java\//i, /node-fetch/i,
  /go-http/i, /php/i, /ruby/i, /semrush/i, /ahrefs/i,
  /majestic/i, /dotbot/i, /rogerbot/i, /exabot/i, /mj12bot/i,
];

function isBot(userAgent: string): boolean {
  if (!userAgent) return true; // No UA = suspicious
  return BOT_PATTERNS.some((pattern) => pattern.test(userAgent));
}

// ─── Security Headers ───
function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https://lh3.googleusercontent.com",
      "connect-src 'self' https://challenges.cloudflare.com https://script.google.com",
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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ─── Bot Protection ───
  const userAgent = request.headers.get('user-agent') || '';
  if (isBot(userAgent) && !pathname.startsWith('/_next') && !pathname.startsWith('/api')) {
    // Allow bots on static assets but block them on pages
    return new NextResponse(null, {
      status: 403,
      statusText: 'Forbidden - Bot Detected',
    });
  }

  // ─── Rate Limiting on API routes ───
  if (pathname.startsWith('/api')) {
    const ip = getClientIP(request);
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'تم إرسال طلبات كثيرة في وقت قصير' },
        { status: 429 }
      );
    }
  }

  // ─── Add Security Headers to all responses ───
  const response = NextResponse.next();
  return addSecurityHeaders(response);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except _next/static, _next/image, favicon
     */
    '/((?!_next/static|_next/image|favicon\\.ico).*)',
  ],
};
