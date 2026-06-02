import { NextRequest, NextResponse } from 'next/server';

const API_URL =
  'https://script.google.com/macros/s/AKfycbw14UqwxrsY4bdaJOdlruK1Ik80vzgqqitmsQIvV9Z5VsVQuOq9ynqWq0AJLIgzDpUV/exec';

// ← نفس المفتاح في Google Apps Script setupProperties
const API_KEY = 'mk-results-2026-secure-key-x9z7w4';

const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY || '';

async function verifyTurnstile(token: string): Promise<boolean> {
  if (!TURNSTILE_SECRET_KEY) {
    // In development without a secret key, skip verification
    console.warn('TURNSTILE_SECRET_KEY not set — skipping captcha verification');
    return true;
  }

  try {
    const res = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          secret: TURNSTILE_SECRET_KEY,
          response: token,
        }),
      }
    );

    const data = await res.json();
    return data.success === true;
  } catch (error) {
    console.error('Turnstile verification error:', error);
    return false;
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Hello, world!' });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, termName, cls, roll, captchaToken } = body;

    if (action === 'getTermNames') {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'getTermNames' }),
      });

      if (!res.ok) {
        throw new Error(`Google API error: ${res.status}`);
      }

      const data = await res.json();
      return NextResponse.json(data);
    }

    if (action === 'getStudentData') {
      if (!termName || !cls || !roll) {
        return NextResponse.json(
          { error: 'يرجى ملء جميع الحقول المطلوبة.' },
          { status: 400 }
        );
      }

      // Verify Turnstile captcha
      if (captchaToken) {
        const isValid = await verifyTurnstile(captchaToken);
        if (!isValid) {
          return NextResponse.json(
            { error: 'فشل التحقق من الكابتشا. يرجى المحاولة مرة أخرى.' },
            { status: 403 }
          );
        }
      } else if (TURNSTILE_SECRET_KEY) {
        return NextResponse.json(
          { error: 'يرجى إكمال التحقق من الكابتشا.' },
          { status: 403 }
        );
      }

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'getStudentData',
          termName,
          cls,
          roll,
          apiKey: API_KEY,
        }),
      });

      if (!res.ok) {
        throw new Error(`Google API error: ${res.status}`);
      }

      const data = await res.json();
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: 'إجراء غير صالح.' }, { status: 400 });
  } catch (error) {
    console.error('API proxy error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في الاتصال بالخادم. يرجى المحاولة مرة أخرى.' },
      { status: 500 }
    );
  }
}

