'use client';

import { useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function AuthCallback() {
  useEffect(() => {
    const supabase = createClient();

    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');

      try {
        if (code) {
          await supabase.auth.exchangeCodeForSession(code);
        }
      } catch (_) {
        // session may already be set via hash/implicit flow — proceed
      }

      // Hard navigation so the server re-reads the fresh session cookies
      window.location.replace('/');
    };

    handleCallback();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-muted-foreground">Signing you in…</p>
    </div>
  );
}
