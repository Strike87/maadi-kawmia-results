import { NextRequest, NextResponse } from 'next/server';
import { GRADE_MAP, getErrorMessage, mapGasError } from '@/lib/constants';

const API_URL =
  'https://script.google.com/macros/s/AKfycbyJnOsjfKBZgksLbOyP1kTspgp2_2BImhbVwcuQJoIgf7IFEpHGJ2oo7rrhRoYI1agGxw/exec';

// ← نفس المفتاح في Google Apps Script setupProperties
const API_KEY = 'mk-results-2026-secure-key-x9z7w4';

const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY || '';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

async function verifyTurnstile(token: string): Promise<boolean> {
  if (!TURNSTILE_SECRET_KEY) {
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
    if (IS_PRODUCTION) {
      console.error('Turnstile verification failed');
    } else {
      console.error('Turnstile verification error:', error);
    }
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

    // ─── getTermNames ───
    if (action === 'getTermNames') {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'getTermNames' }),
      });

      if (!res.ok) {
        if (IS_PRODUCTION) {
          console.error('Google API error');
        } else {
          console.error(`Google API error: ${res.status}`);
        }
        return NextResponse.json(
          { error: getErrorMessage('SERVER_ERROR') },
          { status: 502 }
        );
      }

      const data = await res.json();

      // Pass through GAS errors with mapping
      if (data.error) {
        return NextResponse.json(
          { error: getErrorMessage(data.error) },
          { status: 502 }
        );
      }

      return NextResponse.json(data);
    }

    // ─── getStudentData ───
    if (action === 'getStudentData') {
      // ── Validate required fields ──
      if (!termName || !cls || !roll) {
        return NextResponse.json(
          { error: getErrorMessage('MISSING_FIELDS') },
          { status: 400 }
        );
      }

      // ── Validate termName (must be a non-empty string) ──
      if (typeof termName !== 'string' || !termName.trim()) {
        return NextResponse.json(
          { error: getErrorMessage('INVALID_TERM') },
          { status: 400 }
        );
      }

      // ── Validate grade (must be in GRADE_MAP) ──
      if (!(cls in GRADE_MAP)) {
        return NextResponse.json(
          { error: getErrorMessage('INVALID_GRADE') },
          { status: 400 }
        );
      }

      // ── Validate national ID ──
      if (!/^[0-9]{14}$/.test(String(roll).trim())) {
        return NextResponse.json(
          { error: getErrorMessage('INVALID_ID') },
          { status: 400 }
        );
      }

      // ── Verify Turnstile captcha ──
      if (captchaToken) {
        const isValid = await verifyTurnstile(captchaToken);
        if (!isValid) {
          return NextResponse.json(
            { error: getErrorMessage('CAPTCHA_FAILED') },
            { status: 403 }
          );
        }
      } else if (TURNSTILE_SECRET_KEY) {
        return NextResponse.json(
          { error: getErrorMessage('MISSING_CAPTCHA') },
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

      // ── Handle HTTP-level errors from GAS ──
      if (!res.ok) {
        if (IS_PRODUCTION) {
          console.error('Google API error');
        } else {
          console.error(`Google API error: ${res.status}`);
        }

        // 429 = rate limited by GAS backend
        if (res.status === 429) {
          return NextResponse.json(
            { error: getErrorMessage('RATE_LIMITED') },
            { status: 429 }
          );
        }

        return NextResponse.json(
          { error: getErrorMessage('SERVER_ERROR') },
          { status: 502 }
        );
      }

      // ── Parse GAS response and map any error ──
      let data: Record<string, unknown>;
      try {
        const rawText = await res.text();
        console.log('[API] GAS raw response:', rawText.substring(0, 300));
        data = JSON.parse(rawText);
      } catch {
        return NextResponse.json(
          { error: getErrorMessage('DATA_READ_ERROR') },
          { status: 502 }
        );
      }

      if (data.error) {
        const rawError = String(data.error);
        const mappedError = getErrorMessage(rawError);
        // Determine appropriate HTTP status based on mapped error key
        const errorKey = mapGasError(rawError);
        let status = 400;

        if (errorKey === 'RESULTS_UNAVAILABLE') {
          status = 403;
        } else if (errorKey === 'RATE_LIMITED') {
          status = 429;
        } else if (errorKey === 'NO_RESULT' || errorKey === 'SHEET_NOT_FOUND') {
          status = 404;
        } else if (errorKey === 'FEES_UNPAID') {
          status = 403;
        }

        return NextResponse.json(
          { error: mappedError },
          { status }
        );
      }

      // ── Check for no-student result ──
      // If the student name (stn) is missing, there is no valid result —
      // regardless of whether headers/scores are present.
      // GAS may return sheet structure even without a matching student.
      const stn = String(data.stn || '').trim();
      if (!stn) {
        return NextResponse.json(
          { error: getErrorMessage('NO_RESULT') },
          { status: 404 }
        );
      }

      return NextResponse.json(data);
    }

    return NextResponse.json(
      { error: getErrorMessage('UNKNOWN_ERROR') },
      { status: 400 }
    );
  } catch (error) {
    if (IS_PRODUCTION) {
      console.error('API proxy error');
    } else {
      console.error('API proxy error:', error);
    }
    return NextResponse.json(
      { error: getErrorMessage('CONNECTION_ERROR') },
      { status: 500 }
    );
  }
}
