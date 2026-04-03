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
  const [mode, setMode]       = useState<AuthState>(resetError ? 'forgot_password' : state);
  const router = useRouter();

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
          {mode === 'signin' ? 'Enter your email and password' : 'Enter your email to receive a reset link'}
        </CardDescription>
      </CardHeader>
      <CardContent>
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
              autoFocus
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
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Please wait…' : mode === 'signin' ? 'Sign In' : 'Send Reset Link'}
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
