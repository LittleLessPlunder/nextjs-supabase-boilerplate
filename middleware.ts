import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';

export async function middleware(request: NextRequest) {
  // Always run updateSession so cookies are refreshed on every route.
  // The /landing page is public but still needs session cookie maintenance.
  const sessionResponse = await updateSession(request);

  // Override the auth redirect for /landing — let it through regardless of session.
  if (request.nextUrl.pathname === '/landing' && sessionResponse.status === 307) {
    return NextResponse.next();
  }

  return sessionResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
  ]
};
