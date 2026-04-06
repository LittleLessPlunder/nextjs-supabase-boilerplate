import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') ?? '';
  const pathname = request.nextUrl.pathname;

  // Public website — www.yogatayoelnido.com (or bare domain)
  // No auth required.
  const isWww =
    hostname.startsWith('www.') ||
    hostname === 'yogatayoelnido.com' ||
    process.env.NEXT_PUBLIC_SITE === 'www';

  if (isWww) {
    const url = request.nextUrl.clone();
    url.pathname = pathname === '/' ? '/www' : `/www${pathname}`;
    return NextResponse.rewrite(url);
  }

  // Dev convenience — /yoga-tayo path also bypasses auth.
  if (pathname === '/landing' || pathname.startsWith('/yoga-tayo')) {
    return NextResponse.next();
  }

  // Portal — portal.yogatayoelnido.com — run session + auth logic.
  const sessionResponse = await updateSession(request);

  if (pathname === '/landing' && sessionResponse.status === 307) {
    return NextResponse.next();
  }

  return sessionResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
  ]
};
