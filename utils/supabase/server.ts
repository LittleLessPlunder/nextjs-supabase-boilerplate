import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: Omit<ResponseCookie, 'name' | 'value'>) {
          try {
            cookieStore.set(name, value, options);
          } catch (error) {
            // Expected in Server Components — cookies can only be written in
            // Server Actions or Route Handlers. Safe to ignore here.
          }
        },
        remove(name: string, options: Omit<ResponseCookie, 'name' | 'value'>) {
          try {
            cookieStore.delete({ name, ...options });
          } catch (error) {
            // Expected in Server Components — safe to ignore here.
          }
        },
      },
    }
  );
}
