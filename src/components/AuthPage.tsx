'use client';

import { useState } from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase-browser';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Drill, Mail, Lock, User, ArrowRight, Loader2, AlertCircle, CheckCircle2, Eye, Rocket } from 'lucide-react';

interface AuthPageProps {
  onGuestMode?: () => void;
}

export default function AuthPage({ onGuestMode }: AuthPageProps) {
  const supabaseConfigured = isSupabaseConfigured();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setNeedsConfirmation(false);

    if (!supabaseConfigured) {
      setError('Supabase is not configured. Click "Try as Guest" to explore the app with demo data, or set up environment variables.');
      return;
    }

    setLoading(true);
    const supabase = createClient();

    try {
      if (isSignUp) {
        if (!fullName.trim()) {
          setError('Please enter your full name');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters');
          setLoading(false);
          return;
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });

        if (signUpError) {
          setError(signUpError.message);
          setLoading(false);
          return;
        }

        if (data.user && data.session) {
          setSuccess('Account created! Signing you in...');
        } else if (data.user && !data.session) {
          setSuccess('Account created! Check your email for verification, then sign in.');
          setNeedsConfirmation(true);
          setIsSignUp(false);
        } else {
          setSuccess('Account created! You can now sign in.');
          setIsSignUp(false);
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

        if (signInError) {
          const msg = signInError.message || '';
          if (msg.includes('Email not confirmed') || msg.includes('email_not_confirmed')) {
            setError('Email not verified. Check your inbox, or disable "Confirm email" in Supabase Dashboard → Authentication → Settings.');
            setNeedsConfirmation(true);
          } else if (msg.includes('Invalid login credentials') || msg.includes('invalid_credentials')) {
            setError('Invalid email or password.');
          } else {
            setError(msg);
          }
        }
      }
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('Network request failed')) {
        setError('Cannot connect to Supabase. Your project may be paused — go to supabase.com and click "Restore". Or try Guest Mode to explore the app.');
      } else {
        setError(msg || 'An unexpected error occurred.');
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg mb-4">
            <Drill className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">DrillOps Pro</h1>
          <p className="text-sm text-muted-foreground mt-1">Borewell Operations Management</p>
        </div>

        {/* Guest Mode Card - PROMINENT */}
        <Card className="mb-4 border-2 border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 shadow-lg">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white shrink-0">
                <Rocket className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-emerald-800 dark:text-emerald-300">Try Demo Mode</h3>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                  Explore the full app with sample data — no account needed. Changes won&apos;t be saved.
                </p>
                <Button
                  className="mt-3 w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={onGuestMode}
                >
                  <Eye className="h-4 w-4" />
                  Launch Demo
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Auth Card */}
        <Card className="shadow-xl border-0 dark:border">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl">
              {isSignUp ? 'Create Account' : 'Sign In'}
            </CardTitle>
            <CardDescription>
              {isSignUp
                ? 'Sign up to save your drilling data to the cloud'
                : 'Sign in to your DrillOps Pro account'}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {!supabaseConfigured && (
              <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-2.5 text-xs text-amber-700 dark:text-amber-400">
                <strong>Note:</strong> Supabase is not connected. Use Demo Mode above, or configure env vars to enable cloud sync.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Your full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-9"
                      required={isSignUp}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder={isSignUp ? 'Min 6 characters' : 'Enter your password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-400 flex gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span className="whitespace-pre-line">{error}</span>
                </div>
              )}

              {success && !error && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800 p-3 text-sm text-emerald-700 dark:text-emerald-400 flex gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{success}</span>
                </div>
              )}

              {needsConfirmation && !isSignUp && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-3 text-xs text-amber-700 dark:text-amber-400">
                  <strong>Tip:</strong> Disable email confirmation in Supabase Dashboard → Authentication → Settings → turn off &quot;Confirm email&quot;.
                </div>
              )}

              <Button type="submit" className="w-full gap-2" disabled={loading || !supabaseConfigured}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    {isSignUp ? 'Create Account' : 'Sign In'}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}
              </p>
              <Button
                variant="link"
                className="mt-1"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                  setSuccess('');
                  setNeedsConfirmation(false);
                }}
              >
                {isSignUp ? 'Sign in instead' : 'Create an account'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          DrillOps Pro — Professional ERP for Borewell Drilling Operations
        </p>
      </div>
    </div>
  );
}
