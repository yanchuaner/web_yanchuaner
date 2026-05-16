import { NextRequest, NextResponse } from 'next/server';

/**
 * 燕川校友数字母港 — 路由中间件
 *
 * 职责:
 * 1. 保护 /admin/* 和 /api/admin/* 路由，要求有效的 auth cookie
 * 2. 透明放行其他所有路由（公共内容由 Gatekeeper 客户端组件控制）
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

  // 仅保护管理后台路由
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    const token = req.cookies.get('yc_access_token')?.value;

    if (!token || !isValidToken(token)) {
      // API 路由返回 401 JSON
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      // 页面路由重定向到首页（Gatekeeper 会拦截）
      return NextResponse.redirect(new URL('/', req.url));
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
