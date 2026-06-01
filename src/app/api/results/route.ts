import { NextRequest, NextResponse } from 'next/server';

const API_URL =
  'https://script.google.com/macros/s/AKfycbxPL1cx3w-T_A-1u2xui0Nu9T9QJlJH2j_LgDP7qeorEtZ5sHg7PjiL287MbjLrlUAk-Q/exec';

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

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'getStudentData',
          termName,
          cls,
          roll,
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
