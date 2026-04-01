import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

/**
 * Auth callback route — handles the PKCE code exchange on the server.
 *
 * Supabase magic links redirect here with ?code=XXX. We exchange the code
 * for a session on the server so that the session cookies are set on the
 * redirect response *before* the browser navigates. This avoids the race
 * condition that occurs when the exchange happens client-side (the middleware
 * session check would run before cookies were written → redirect loop).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  const redirectUrl = new URL(next, request.url);
  const response = NextResponse.redirect(redirectUrl);

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            // Write cookies onto the redirect response so they arrive in
            // the browser together with the 307, not on the next request.
            response.cookies.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            response.cookies.set({ name, value: '', ...options });
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      // Code invalid or expired — send back to sign-in with error context
      const errorUrl = new URL('/auth/signin', request.url);
      errorUrl.searchParams.set('error', 'link_expired');
      return NextResponse.redirect(errorUrl);
    }
  }

  return response;
}
