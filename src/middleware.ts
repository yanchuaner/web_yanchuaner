import { NextRequest, NextResponse } from 'next/server';

/**
 * 燕中校友数字母港 — 路由中间件
 *
 * 职责:
 * 1. 保护 /admin/* 和 /api/admin/* 路由，要求有效的 auth cookie
 * 2. /admin/login 已登录用户自动跳转到 /admin
 * 3. 透明放行其他所有路由
 */

function isValidToken(token: string): boolean {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const payload = JSON.parse(decoded);
    return payload.v === 1 && typeof payload.exp === 'number' && payload.exp > Date.now();
  } catch {
    return false;
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    const token = req.cookies.get('yc_access_token')?.value;
    const authenticated = token && isValidToken(token);

    // 已登录用户访问登录页 → 跳转后台
    if (pathname === '/admin/login') {
      if (authenticated) {
        return NextResponse.redirect(new URL('/admin', req.url));
      }
      return NextResponse.next();
    }

    if (!authenticated) {
      // API 路由返回 401 JSON
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      // 页面路由重定向到登录页
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
  ],
};
