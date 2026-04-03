import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code       = searchParams.get('code');
  const tokenHash  = searchParams.get('token_hash');
  const type       = searchParams.get('type');
  const rawNext    = searchParams.get('next') ?? '/';
  // Prevent open redirect — only allow same-origin relative paths
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/';

  const response = NextResponse.redirect(new URL(next, request.url));

  if (code || tokenHash) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            response.cookies.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            response.cookies.set({ name, value: '', ...options });
          },
        },
      }
    );

    let authError: { message: string } | null = null;

    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      authError = error;
    } else if (tokenHash && type) {
      // Password reset links use token_hash + type=recovery instead of code
      const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as 'recovery' | 'email' });
      authError = error;
    }

    if (authError) {
      return NextResponse.redirect(
        new URL('/auth/signin?reset_error=1', request.url)
      );
    }
  }

  return response;
}
