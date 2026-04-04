import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') ?? '';
  const pathname = request.nextUrl.pathname;

  // Public website — www.yogatayoelnido.com (or bare domain)
  // Rewrite internally to /www/* so Next.js serves app/www/* pages.
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

  // Portal — portal.yogatayoelnido.com (or localhost dev default)
  // Run existing session + auth logic.
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
