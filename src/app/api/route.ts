import { NextRequest, NextResponse } from 'next/server';

const API_URL = 'https://script.google.com/macros/s/AKfycbyNmK52XP0Ogl_x7JcgUAuZRDXyfXOdKNC4Rb42qusKBAjAMR1phQOpJQQpenpGCAAThQ/exec';
const API_KEY = 'mk-results-2026-secure-key-x9z7w4'; // ← نفس المفتاح في Google Apps Script

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, termName, cls, roll } = body;

    if (action === 'getTermNames') {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'getTermNames' }),
      });
      if (!res.ok) throw new Error(`Google API error: ${res.status}`);
      const data = await res.json();
      return NextResponse.json(data);
    }

    if (action === 'getStudentData') {
      if (!termName || !cls || !roll) {
        return NextResponse.json({ error: 'يرجى ملء جميع الحقول المطلوبة.' }, { status: 400 });
      }
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'getStudentData',
          termName,
          cls,
          roll,
          apiKey: API_KEY,  // ← أضف هذا
        }),
      });
      if (!res.ok) throw new Error(`Google API error: ${res.status}`);
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
