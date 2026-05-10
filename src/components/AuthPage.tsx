'use client';

import { useState } from 'react';
import { createClient, isSupabaseConfigured, getSupabaseDebugInfo, testSupabaseConnection, getSupabaseUrl } from '@/lib/supabase-browser';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Drill, Mail, Lock, User, ArrowRight, Loader2, AlertCircle, CheckCircle2, WifiOff, RefreshCw, Activity } from 'lucide-react';

interface ConnectionTestResult {
  ok: boolean;
  status: number | null;
  message: string;
  url: string;
  serverResult?: any;
}

export default function AuthPage() {
  const supabaseConfigured = isSupabaseConfigured();
  const debugInfo = getSupabaseDebugInfo();
  const supabaseUrl = getSupabaseUrl();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  // Connection test state
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);
  const [testing, setTesting] = useState(false);

  const runConnectionTest = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      // Test from browser
      const browserResult = await testSupabaseConnection();

      // Test from server (bypasses CORS)
      let serverResult = null;
      try {
        const serverRes = await fetch('/api/health/supabase');
        serverResult = await serverRes.json();
      } catch {
        serverResult = { ok: false, error: 'Cannot reach our own API route — app may not be deployed correctly' };
      }

      setTestResult({
        ...browserResult,
        serverResult,
      });
    } catch (err: any) {
      setTestResult({
        ok: false,
        status: null,
        message: err?.message || 'Test failed',
        url: supabaseUrl,
      });
    }

    setTesting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setNeedsConfirmation(false);

    if (!supabaseConfigured) {
      setError('Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your Vercel environment variables and redeploy.');
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
          options: {
            data: { full_name: fullName },
          },
        });

        if (signUpError) {
          setError(signUpError.message);
          setLoading(false);
          return;
        }

        if (data.user && data.session) {
          setSuccess('Account created! Signing you in...');
        } else if (data.user && !data.session) {
          setSuccess('Account created! Check your email for a verification link, then come back to sign in.');
          setNeedsConfirmation(true);
          setIsSignUp(false);
        } else {
          setSuccess('Account created! You can now sign in.');
          setIsSignUp(false);
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          const msg = signInError.message || '';
          if (msg.includes('Email not confirmed') || msg.includes('email_not_confirmed')) {
            setError('Your email is not verified yet. Check your inbox/spam for the verification email, or ask admin to disable email confirmation in Supabase.');
            setNeedsConfirmation(true);
          } else if (msg.includes('Invalid login credentials') || msg.includes('invalid_credentials')) {
            setError('Invalid email or password. Please check your credentials and try again.');
          } else {
            setError(msg);
          }
        }
      }
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('Network request failed')) {
        setError(
          `Cannot connect to Supabase at ${supabaseUrl}\n\n` +
          'This usually means:\n' +
          '1. Your Supabase project is PAUSED — go to supabase.com and click "Restore"\n' +
          '2. The Supabase URL is wrong — it should look like https://abc123.supabase.co\n' +
          '3. The anon key is wrong — make sure you copied the "anon public" key, not the service role key\n\n' +
          'Click "Test Connection" below for a detailed diagnosis.'
        );
      } else {
        setError(msg || 'An unexpected error occurred. Please try again.');
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

        {/* Supabase not configured warning */}
        {!supabaseConfigured && (
          <div className="mb-4 rounded-lg border border-red-300 bg-red-50 dark:bg-red-950/40 dark:border-red-800 p-4 text-sm">
            <div className="flex items-center gap-2 font-semibold text-red-700 dark:text-red-400 mb-2">
              <WifiOff className="h-4 w-4" />
              Supabase Not Connected
            </div>
            <p className="text-red-600 dark:text-red-400 text-xs mb-2">
              The app cannot connect to Supabase because the environment variables are missing or invalid.
            </p>
            <div className="text-xs text-red-500 dark:text-red-400/70 space-y-1">
              <p><strong>To fix this:</strong></p>
              <ol className="list-decimal ml-4 space-y-1">
                <li>Go to your <strong>Vercel Dashboard</strong></li>
                <li>Select your project → <strong>Settings</strong> → <strong>Environment Variables</strong></li>
                <li>Add these two variables:
                  <div className="mt-1 font-mono bg-red-100 dark:bg-red-900/30 rounded p-2 text-[11px]">
                    NEXT_PUBLIC_SUPABASE_URL = https://your-project.supabase.co<br/>
                    NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJ...your-key
                  </div>
                </li>
                <li>Go to <strong>Deployments</strong> → Click <strong>Redeploy</strong></li>
              </ol>
              <p className="mt-2 font-mono">Debug: <code className="bg-red-100 dark:bg-red-900/30 px-1 rounded">{debugInfo}</code></p>
            </div>
          </div>
        )}

        {/* Green connection banner with Test button */}
        {supabaseConfigured && (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800 p-3">
            <div className="flex items-center justify-between">
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">
                Supabase URL: {supabaseUrl}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-6 text-[10px] gap-1 border-emerald-300 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-900/30"
                onClick={runConnectionTest}
                disabled={testing}
              >
                {testing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Activity className="h-3 w-3" />}
                Test Connection
              </Button>
            </div>
          </div>
        )}

        {/* Connection test results */}
        {testResult && (
          <div className={`mb-4 rounded-lg border p-3 text-xs ${
            testResult.ok
              ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-700'
              : 'border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-700'
          }`}>
            <div className="font-semibold mb-2 flex items-center gap-1">
              {testResult.ok ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
              )}
              Connection Test Result
            </div>
            <div className="space-y-2 font-mono">
              <div>
                <span className="font-bold">Browser → Supabase:</span>{' '}
                {testResult.ok ? (
                  <span className="text-emerald-700 dark:text-emerald-400">{testResult.message}</span>
                ) : (
                  <span className="text-amber-700 dark:text-amber-400 whitespace-pre-line">{testResult.message}</span>
                )}
              </div>
              {testResult.serverResult && (
                <div>
                  <span className="font-bold">Server → Supabase:</span>{' '}
                  {testResult.serverResult.ok ? (
                    <span className="text-emerald-700 dark:text-emerald-400">
                      OK (REST: HTTP {testResult.serverResult.restApi?.status}, Auth: {testResult.serverResult.authApi?.status})
                    </span>
                  ) : (
                    <span className="text-amber-700 dark:text-amber-400">
                      {testResult.serverResult.error || 'Failed'}
                      {testResult.serverResult.hint && <span className="block mt-1">{testResult.serverResult.hint}</span>}
                    </span>
                  )}
                </div>
              )}
            </div>
            {!testResult.ok && (
              <div className="mt-2 text-[11px] text-amber-600 dark:text-amber-400 border-t border-amber-200 dark:border-amber-800 pt-2">
                <strong>Quick fixes:</strong>
                <ul className="list-disc ml-4 mt-1 space-y-0.5">
                  <li>Check your Supabase project is not <strong>paused</strong> at supabase.com dashboard</li>
                  <li>Verify URL format: <code>https://your-ref.supabase.co</code> (no trailing slash)</li>
                  <li>Make sure you used the <strong>anon public</strong> key, not the service role key</li>
                  <li>In Supabase, go to Authentication → Settings → disable &quot;Confirm email&quot; for testing</li>
                </ul>
              </div>
            )}
          </div>
        )}

        <Card className="shadow-xl border-0 dark:border">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </CardTitle>
            <CardDescription>
              {isSignUp
                ? 'Sign up to start managing your drilling operations'
                : 'Sign in to your DrillOps Pro account'}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
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
                  <strong>Tip:</strong> If you didn&apos;t receive the email, check your spam folder. You can also ask your admin to disable email confirmation in Supabase Dashboard &rarr; Authentication &rarr; Settings &rarr; turn off &quot;Confirm email&quot;.
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

            <div className="mt-6 text-center">
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
