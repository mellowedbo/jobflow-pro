'use client';

import { useState } from 'react';
import {
  isSupabaseConfigured,
  getSupabaseDebugInfo,
  testSupabaseConnection,
  saveSupabaseCredentials,
  getCredentialsSource,
  getSupabaseUrl,
} from '@/lib/supabase-browser';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Drill, Database, Key, CheckCircle2, AlertCircle, Loader2, ExternalLink, Trash2 } from 'lucide-react';

interface SupabaseSetupProps {
  onConfigured: () => void;
}

export default function SupabaseSetup({ onConfigured }: SupabaseSetupProps) {
  const configured = isSupabaseConfigured();
  const debugInfo = getSupabaseDebugInfo();
  const currentSource = getCredentialsSource();

  const [url, setUrl] = useState(getSupabaseUrl() || '');
  const [anonKey, setAnonKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [saved, setSaved] = useState(false);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);

    // Test with the entered credentials (don't save yet)
    const result = await testSupabaseConnection(url, anonKey || undefined);
    setTestResult({ ok: result.ok, message: result.message });
    setTesting(false);
  };

  const handleSave = () => {
    saveSupabaseCredentials(url, anonKey);
    setSaved(true);
    // Small delay so the user sees the success state
    setTimeout(() => {
      onConfigured();
    }, 500);
  };

  const handleTestCurrent = async () => {
    setTesting(true);
    setTestResult(null);
    const result = await testSupabaseConnection();
    setTestResult({ ok: result.ok, message: result.message });
    setTesting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg mb-4">
            <Drill className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">DrillOps Pro</h1>
          <p className="text-sm text-muted-foreground mt-1">Supabase Configuration</p>
        </div>

        {/* Current status */}
        <div className={`mb-4 rounded-lg border p-3 text-sm ${
          configured
            ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800'
            : 'border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800'
        }`}>
          <div className="flex items-center gap-2 font-semibold mb-1">
            {configured ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-amber-600" />
            )}
            {configured ? 'Supabase is configured' : 'Supabase is NOT configured'}
          </div>
          <p className="text-xs font-mono opacity-80">{debugInfo}</p>
          {configured && currentSource === 'env vars' && (
            <p className="text-xs mt-1 opacity-70">
              Credentials from Vercel env vars. You can override them by entering new ones below.
            </p>
          )}
          {configured && currentSource === 'localStorage' && (
            <p className="text-xs mt-1 opacity-70">
              Using credentials you entered previously.
            </p>
          )}
        </div>

        <Card className="shadow-xl border-0 dark:border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Database className="h-5 w-5" />
              Connect Your Supabase Project
            </CardTitle>
            <CardDescription>
              Paste your Supabase URL and anon key below. This is stored in your browser only — no server-side setup needed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Step 1: Where to find credentials */}
            <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-3 text-xs space-y-2">
              <p className="font-semibold text-blue-700 dark:text-blue-400">Where to find your credentials:</p>
              <ol className="list-decimal ml-4 space-y-1 text-blue-600 dark:text-blue-400">
                <li>Go to <a href="https://supabase.com/dashboard" target="_blank" rel="noopener" className="underline inline-flex items-center gap-0.5">supabase.com/dashboard <ExternalLink className="h-3 w-3" /></a></li>
                <li>Click your project</li>
                <li>Go to <strong>Settings</strong> (gear icon) → <strong>API</strong></li>
                <li>Copy the <strong>Project URL</strong> → paste below</li>
                <li>Copy the <strong>anon public</strong> key → paste below</li>
              </ol>
            </div>

            {/* URL input */}
            <div className="space-y-2">
              <Label htmlFor="supabase-url" className="flex items-center gap-1.5">
                <Database className="h-3.5 w-3.5" />
                Project URL
              </Label>
              <Input
                id="supabase-url"
                type="url"
                placeholder="https://your-project-ref.supabase.co"
                value={url}
                onChange={(e) => { setUrl(e.target.value); setTestResult(null); setSaved(false); }}
                className="font-mono text-sm"
              />
              <p className="text-[11px] text-muted-foreground">Format: https://your-project-ref.supabase.co</p>
            </div>

            {/* Anon Key input */}
            <div className="space-y-2">
              <Label htmlFor="supabase-key" className="flex items-center gap-1.5">
                <Key className="h-3.5 w-3.5" />
                Anon Public Key
              </Label>
              <Input
                id="supabase-key"
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={anonKey}
                onChange={(e) => { setAnonKey(e.target.value); setTestResult(null); setSaved(false); }}
                className="font-mono text-sm"
              />
              <p className="text-[11px] text-muted-foreground">
                Use the <strong>anon public</strong> key, NOT the service_role key
              </p>
            </div>

            {/* Test result */}
            {testResult && (
              <div className={`rounded-lg border p-3 text-sm ${
                testResult.ok
                  ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-700'
                  : 'border-red-300 bg-red-50 dark:bg-red-950/20 dark:border-red-700'
              }`}>
                <div className="flex items-center gap-2">
                  {testResult.ok ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                  )}
                  <span className={testResult.ok ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}>
                    {testResult.message}
                  </span>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 gap-1.5"
                onClick={handleTest}
                disabled={testing || !url}
              >
                {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
                Test Connection
              </Button>

              <Button
                className="flex-1 gap-1.5"
                onClick={handleSave}
                disabled={!url || !anonKey || saved}
              >
                {saved ? <CheckCircle2 className="h-4 w-4" /> : <Database className="h-4 w-4" />}
                {saved ? 'Saved! Redirecting...' : 'Save & Connect'}
              </Button>
            </div>

            {/* Test current connection */}
            {configured && !anonKey && (
              <div className="pt-2 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full gap-1.5 text-xs"
                  onClick={handleTestCurrent}
                  disabled={testing}
                >
                  {testing ? <Loader2 className="h-3 w-3 animate-spin" /> : <ExternalLink className="h-3 w-3" />}
                  Test Current Connection
                </Button>
              </div>
            )}

            {/* Paused project help */}
            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3 text-xs">
              <p className="font-semibold text-amber-700 dark:text-amber-400 mb-1">Supabase project paused?</p>
              <p className="text-amber-600 dark:text-amber-400">
                Free tier projects auto-pause after 7 days of inactivity. Go to your Supabase dashboard and click
                <strong> &quot;Restore project&quot; </strong> to wake it up, then try again.
              </p>
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
