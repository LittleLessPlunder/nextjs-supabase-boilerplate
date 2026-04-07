import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Use getUser() (not getSession()) so the JWT is verified server-side on every request.
  const { data: { user } } = await supabase.auth.getUser();

  const isAuthPage = ['/auth/signin', '/auth/callback', '/auth/update-password'].some(p =>
    request.nextUrl.pathname.startsWith(p)
  );
  const isPublicPage =
    request.nextUrl.pathname === '/landing' ||
    request.nextUrl.pathname.startsWith('/api/public/');

  // Hostname-based routing: on the public domain (www.*) serve only the landing page;
  // everything else redirects to /landing. On the portal domain (portal.*) apply the
  // standard BMS auth guards.
  const host = request.headers.get('host') ?? '';
  const isPublicHost = host.startsWith('www.') || host === 'yogatayoelnido.com';
  if (isPublicHost && !isPublicPage && request.nextUrl.pathname !== '/') {
    return NextResponse.redirect(new URL('/landing', request.url));
  }

  // Root path: send unauthenticated visitors to the public site, not the sign-in page.
  if (!user && request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/landing', request.url));
  }

  if (!user && !isAuthPage && !isPublicPage) {
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }

  if (user && !isAuthPage) {
    // ALLOWED_EMAILS is a comma-separated list of email addresses permitted to access
    // this portal. It can hold any number of emails — add or remove addresses freely
    // without touching code. If the env var is unset, the check is skipped entirely.
    // Auth pages (signin, callback, update-password) are exempt so the password
    // reset flow always completes regardless of allow-list membership.
    const allowedEmails = process.env.ALLOWED_EMAILS?.split(',').map(e => e.trim()).filter(Boolean) ?? [];
    if (allowedEmails.length > 0 && !allowedEmails.includes(user.email ?? '')) {
      // Return a redirect that carries the cleared session cookies from the signOut call.
      await supabase.auth.signOut();
      const redirectResponse = NextResponse.redirect(new URL('/auth/signin?error=unauthorized', request.url));
      response.cookies.getAll().forEach(cookie => redirectResponse.cookies.set(cookie));
      return redirectResponse;
    }
  }

  return response;
}
