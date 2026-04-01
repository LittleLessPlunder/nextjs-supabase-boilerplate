'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const COOLDOWN_SECONDS = 60;
const COOLDOWN_KEY = 'ytw_magic_link_sent_at';

export type AuthState = 'signin' | 'signup' | 'forgot_password';

export default function AuthForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Restore cooldown from localStorage on mount
  useEffect(() => {
    const sentAt = localStorage.getItem(COOLDOWN_KEY);
    if (sentAt) {
      const elapsed = Math.floor((Date.now() - Number(sentAt)) / 1000);
      const remaining = COOLDOWN_SECONDS - elapsed;
      if (remaining > 0) setCooldown(remaining);
    }
  }, []);

  // Countdown tick
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const startCooldown = () => {
    localStorage.setItem(COOLDOWN_KEY, String(Date.now()));
    setCooldown(COOLDOWN_SECONDS);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldown > 0) return;
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (otpError) throw otpError;
      startCooldown();
      setSent(true);
    } catch (err: any) {
      const msg: string = err.message ?? '';
      if (msg.toLowerCase().includes('rate limit')) {
        // A link was already sent — show the check-your-email screen instead of looping
        setSent(true);
      } else {
        setError(msg || 'Something went wrong');
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
          <CardDescription>We sent a sign-in link to {email}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Click the link in the email to access the YTW Portal. You can close this tab.
          </p>
          {cooldown > 0 && (
            <p className="mt-3 text-xs text-muted-foreground">
              Didn't receive it? You can resend in {cooldown}s.
            </p>
          )}
          {cooldown === 0 && (
            <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => setSent(false)}>
              Resend link
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>Enter your email to receive a sign-in link</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              autoFocus
            />
          </div>
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-2 rounded">
              {error}
            </div>
          )}
          <Button type="submit" className="w-full" disabled={loading || cooldown > 0}>
            {loading ? 'Sending…' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Send Sign-In Link'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
