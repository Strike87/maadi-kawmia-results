import { NextRequest, NextResponse } from 'next/server';

const API_URL =
  'https://script.google.com/macros/s/AKfycbyJnOsjfKBZgksLbOyP1kTspgp2_2BImhbVwcuQJoIgf7IFEpHGJ2oo7rrhRoYI1agGxw/exec';

// ← نفس المفتاح في Google Apps Script setupProperties
const API_KEY = 'mk-results-2026-secure-key-x9z7w4';

const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY || '';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/** Strip trailing @ signs from sheet/term names */
function stripAt(val: string): string {
  return String(val || '').replace(/@+$/, '');
}

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

/**
 * Try to fetch student data from Google Apps Script.
 * Handles @ suffix on sheet names: tries the name as-is first,
 * then with @ appended if the first attempt finds nothing.
 */
async function fetchStudentData(
  termName: string,
  cls: string,
  roll: string
): Promise<{ data: Record<string, unknown> | null; error: string | null }> {
  const tryRequest = async (cn: string, tn: string) => {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'getStudentData',
        termName: tn,
        cls: cn,
        roll,
        apiKey: API_KEY,
      }),
    });

    if (!res.ok) return null;
    const json = await res.json();
    // If GAS returned an error or no student found, return null
    if (json.error || !json.stn) return null;
    return json;
  };

  // Strategy: try multiple name variants for both cls and termName
  // to handle sheets that use @ suffix to hide from direct access.
  const clsVariants = [cls, cls + '@'];
  const termVariants = [termName, termName + '@'];

  for (const cn of clsVariants) {
    for (const tn of termVariants) {
      const result = await tryRequest(cn, tn);
      if (result) {
        return { data: result, error: null };
      }
    }
  }

  // Nothing found — try one last time with original names to get the actual error
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
    return { data: null, error: 'حدث خطأ في الاتصال بالخادم. يرجى المحاولة مرة أخرى.' };
  }

  const data = await res.json();
  if (data.error) {
    return { data: null, error: data.error };
  }

  return { data: null, error: 'لم يتم العثور على نتيجة. تأكد من صحة البيانات.' };
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
        if (IS_PRODUCTION) {
          console.error('Google API error');
        } else {
          console.error(`Google API error: ${res.status}`);
        }
        return NextResponse.json(
          { error: 'حدث خطأ في الاتصال بالخادم. يرجى المحاولة مرة أخرى.' },
          { status: 502 }
        );
      }

      const data = await res.json();

      // Strip @ suffix from terms and activeSheets before sending to frontend
      if (data.terms && Array.isArray(data.terms)) {
        data.terms = data.terms.map((t: string) => stripAt(t));
      }
      if (data.activeSheets && Array.isArray(data.activeSheets)) {
        data.activeSheets = data.activeSheets.map((s: string) => stripAt(s));
      }

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

      // Try fetching student data, handling @ suffix on sheet names
      const { data, error } = await fetchStudentData(termName, cls, roll);

      if (error) {
        return NextResponse.json({ error }, { status: 400 });
      }

      // Strip @ from termName and cl in the response before sending to frontend
      if (data!.termName) {
        data!.termName = stripAt(data!.termName as string);
      }
      if (data!.cl) {
        data!.cl = stripAt(data!.cl as string);
      }

      return NextResponse.json(data);
    }

    return NextResponse.json({ error: 'إجراء غير صالح.' }, { status: 400 });
  } catch (error) {
    if (IS_PRODUCTION) {
      console.error('API proxy error');
    } else {
      console.error('API proxy error:', error);
    }
    return NextResponse.json(
      { error: 'حدث خطأ في الاتصال بالخادم. يرجى المحاولة مرة أخرى.' },
      { status: 500 }
    );
  }
}
