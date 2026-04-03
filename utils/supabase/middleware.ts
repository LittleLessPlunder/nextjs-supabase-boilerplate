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

  const { data: { session } } = await supabase.auth.getSession();

  const isAuthPage = ['/auth/signin', '/auth/callback', '/auth/update-password'].some(p =>
    request.nextUrl.pathname.startsWith(p)
  );
  if (!session && !isAuthPage) {
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }

  if (session && !isAuthPage) {
    // ALLOWED_EMAILS is a comma-separated list of email addresses permitted to access
    // this portal. It can hold any number of emails — add or remove addresses freely
    // without touching code. If the env var is unset, the check is skipped entirely.
    // Auth pages (signin, callback, update-password) are exempt so the password
    // reset flow always completes regardless of allow-list membership.
    const allowedEmails = process.env.ALLOWED_EMAILS?.split(',').map(e => e.trim()).filter(Boolean) ?? [];
    if (allowedEmails.length > 0 && !allowedEmails.includes(session.user.email ?? '')) {
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL('/auth/signin?error=unauthorized', request.url));
    }
  }

  return response;
}
