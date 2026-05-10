'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Drill, Mail, Lock, User, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function AuthPage() {
  const { signIn, signUp } = useAuth();
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
    setLoading(true);

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
      const { error } = await signUp(email, password, fullName);
      if (error) {
        setError(error);
      } else {
        setSuccess('Account created! Check your email for a verification link, then come back to sign in.');
        setNeedsConfirmation(true);
        setIsSignUp(false);
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        // Show user-friendly error messages
        if (error.includes('Email not confirmed') || error.includes('email_not_confirmed')) {
          setError('Your email is not verified yet. Please check your inbox (and spam folder) for the verification email, then try again.');
          setNeedsConfirmation(true);
        } else if (error.includes('Invalid login credentials') || error.includes('invalid_credentials')) {
          setError('Invalid email or password. Please check your credentials and try again.');
        } else {
          setError(error);
        }
      }
      // If no error, the auth state change listener in AuthProvider
      // will automatically update the UI
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
                  <span>{error}</span>
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
                  <strong>Tip:</strong> If you didn&apos;t receive the email, check your spam folder. You can also ask your admin to disable email confirmation in Supabase Dashboard → Authentication → Settings → turn off &quot;Confirm email&quot;.
                </div>
              )}

              <Button type="submit" className="w-full gap-2" disabled={loading}>
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
