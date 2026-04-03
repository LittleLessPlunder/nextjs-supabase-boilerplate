import AuthForm from '@/components/misc/AuthForm';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function SignIn({ searchParams }: { searchParams: Promise<{ reset_error?: string }> }) {
  const supabase = await createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    return redirect('/');
  }

  const params = await searchParams;
  const resetError = params.reset_error === '1'
    ? 'Your password reset link has expired or was already used. Please request a new one below.'
    : undefined;

  return <AuthForm resetError={resetError} />;
} 