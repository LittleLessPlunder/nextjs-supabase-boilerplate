'use client';

import { useState } from 'react';
import { getURL } from '@/utils/helpers';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export type AuthState = 'signin' | 'forgot_password';

export default function AuthForm({ state = 'signin', resetError }: { state?: AuthState; resetError?: string }) {
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]     = useState<string | null>(resetError ?? null);
  const [sent, setSent]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [mode, setMode]       = useState<AuthState>(resetError ? 'forgot_password' : state);
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    setError(null);
    setOauthLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: getURL('auth/callback') },
      });
      if (error) throw error;
    } catch {
      setError('Something went wrong. Please try again.');
      setOauthLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();

      if (mode === 'signin') {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        router.push('/');
        router.refresh();
      } else {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: getURL('auth/callback?next=/auth/update-password'),
        });
        if (resetError) throw resetError;
        setSent(true);
      }
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === 'invalid_credentials' || code === 'user_not_found') {
        setError('Invalid email or password.');
      } else if (code === 'over_email_send_rate_limit' || code === 'over_request_rate_limit') {
        setError('Too many attempts. Please wait a few minutes and try again.');
      } else if (code === 'email_not_confirmed') {
        setError('Please confirm your email address before signing in.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>Password reset link sent to {email}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Click the link in the email to set a new password.
          </p>
          <Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => { setSent(false); setMode('signin'); }}>
            Back to sign in
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === 'signin' ? 'Sign In' : 'Reset Password'}</CardTitle>
        <CardDescription>
          {mode === 'signin' ? 'Sign in to your account' : 'Enter your email to receive a reset link'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {mode === 'signin' && (
          <>
            <Button
              type="button"
              variant="outline"
              className="w-full flex items-center gap-2"
              onClick={handleGoogleSignIn}
              disabled={oauthLoading || loading}
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {oauthLoading ? 'Redirecting…' : 'Continue with Google'}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or</span>
              </div>
            </div>
          </>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              autoFocus={mode === 'forgot_password'}
            />
          </div>
          {mode === 'signin' && (
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
              />
            </div>
          )}
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-2 rounded">
              {error}
            </div>
          )}
          <Button type="submit" className="w-full" disabled={loading || oauthLoading}>
            {loading ? 'Please wait…' : mode === 'signin' ? 'Sign In with Email' : 'Send Reset Link'}
          </Button>
          {mode === 'signin' ? (
            <button type="button" onClick={() => { setMode('forgot_password'); setError(null); }}
              className="w-full text-xs text-muted-foreground hover:text-foreground text-center transition-colors">
              Forgot your password?
            </button>
          ) : (
            <button type="button" onClick={() => { setMode('signin'); setError(null); }}
              className="w-full text-xs text-muted-foreground hover:text-foreground text-center transition-colors">
              Back to sign in
            </button>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
