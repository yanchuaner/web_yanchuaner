import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';

const ACCESS_PASSWORD = process.env.ACCESS_PASSWORD || 'iloveyanchuan!';
const ACCESS_HASH = createHash('sha256').update(ACCESS_PASSWORD).digest('hex');
const TOKEN_TTL_DAYS = 7;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const password = (body.password || '').trim();

    if (!password) {
      return NextResponse.json({ error: '\u8bf7\u8f93\u5165\u6821\u9a8c\u53e3\u4ee4' }, { status: 400 });
    }

    const inputHash = createHash('sha256').update(password).digest('hex');

    if (inputHash !== ACCESS_HASH && password !== ACCESS_PASSWORD) {
      return NextResponse.json({ error: '\u53e3\u4ee4\u9519\u8bef\uff0c\u8bf7\u67e5\u9605\u6821\u53cb\u7fa4\u516c\u544a' }, { status: 401 });
    }

    const exp = Date.now() + TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000;
    const tokenPayload = JSON.stringify({ v: 1, exp });
    const token = Buffer.from(tokenPayload).toString('base64');

    const response = NextResponse.json({ success: true });
    response.cookies.set('yc_access_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: TOKEN_TTL_DAYS * 24 * 60 * 60,
    });

    return response;
  } catch {
    return NextResponse.json({ error: '\u670d\u52a1\u5668\u9519\u8bef\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5' }, { status: 500 });
  }
}
