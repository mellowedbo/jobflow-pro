'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-browser';
import type { User } from '@supabase/supabase-js';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  User as UserIcon,
  Mail,
  Building2,
  Lock,
  Shield,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Trash2,
  CalendarDays,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Profile {
  id: string;
  full_name: string | null;
  company_name: string | null;
  created_at: string;
}

export default function AccountSettingsView() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile form
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Load user and profile
  useEffect(() => {
    async function loadProfile() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setLoading(false);
        return;
      }

      setUser(session.user);
      setFullName(session.user.user_metadata?.full_name || '');
      setCompanyName(session.user.user_metadata?.company_name || '');

      // Fetch profile from profiles table
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileData) {
        setProfile(profileData as Profile);
        if (profileData.full_name) setFullName(profileData.full_name);
        if (profileData.company_name) setCompanyName(profileData.company_name || '');
      }

      setLoading(false);
    }

    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);

    try {
      // Update auth user metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: fullName, company_name: companyName },
      });

      if (authError) throw authError;

      // Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          company_name: companyName || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user) return;

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setPasswordSaving(true);

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to change password');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    toast.error('Account deletion requires Supabase admin access. Please contact your system administrator.');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const userName = fullName || user?.email?.split('@')[0] || 'User';
  const initials = userName.substring(0, 2).toUpperCase();
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Unknown';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16 border-2 border-primary/20">
          <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">{initials}</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-2xl font-bold">{userName}</h2>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary" className="text-xs gap-1">
              <Shield className="h-3 w-3" />
              Operator
            </Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              Member since {memberSince}
            </span>
          </div>
        </div>
      </div>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            Profile Information
          </CardTitle>
          <CardDescription>
            Update your personal details and company information. This information is associated with your account and visible across the application.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="companyName"
                  type="text"
                  placeholder="Your company name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={user?.email || ''}
                disabled
                className="pl-9 bg-muted"
              />
            </div>
            <p className="text-xs text-muted-foreground">Email cannot be changed. Contact admin if you need to update it.</p>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSaveProfile} disabled={saving} className="gap-2">
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Change Password
          </CardTitle>
          <CardDescription>
            Update your password to keep your account secure. Your new password must be at least 6 characters long. After changing your password, you will remain signed in.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="newPassword"
                type="password"
                placeholder="Min 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-9"
              />
            </div>
            {confirmPassword && newPassword && confirmPassword !== newPassword && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Passwords do not match
              </p>
            )}
            {confirmPassword && newPassword && confirmPassword === newPassword && (
              <p className="text-xs text-emerald-500 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Passwords match
              </p>
            )}
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleChangePassword}
              disabled={passwordSaving || !newPassword || !confirmPassword || newPassword !== confirmPassword}
              className="gap-2"
            >
              {passwordSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Lock className="h-4 w-4" />
              )}
              Change Password
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security & Privacy
          </CardTitle>
          <CardDescription>
            Your data is secured with Row Level Security (RLS) policies in Supabase. Each user can only access their own data — jobs, inventory, costs, and activity logs are all scoped to your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/30">
                <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium">Row Level Security</p>
                <p className="text-xs text-muted-foreground">Your data is isolated per account</p>
              </div>
            </div>
            <Badge variant="outline" className="text-emerald-600 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800">
              Active
            </Badge>
          </div>
          <Separator />
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950/30">
                <Lock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium">Authentication</p>
                <p className="text-xs text-muted-foreground">Supabase Auth with JWT tokens</p>
              </div>
            </div>
            <Badge variant="outline" className="text-blue-600 border-blue-200 dark:text-blue-400 dark:border-blue-800">
              Enabled
            </Badge>
          </div>
          <Separator />
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950/30">
                <Mail className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-medium">Email Verification</p>
                <p className="text-xs text-muted-foreground">
                  {user?.email_confirmed_at ? 'Verified on ' + new Date(user.email_confirmed_at).toLocaleDateString('en-IN') : 'Pending verification'}
                </p>
              </div>
            </div>
            <Badge variant={user?.email_confirmed_at ? 'outline' : 'secondary'} className={user?.email_confirmed_at ? 'text-emerald-600 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800' : ''}>
              {user?.email_confirmed_at ? 'Verified' : 'Pending'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200 dark:border-red-900/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <Trash2 className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible actions that affect your account and all associated data. Once deleted, your account and all jobs, inventory, and billing data cannot be recovered.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="gap-2">
                <Trash2 className="h-4 w-4" />
                Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your account and remove all of your data from our servers, including all jobs, inventory, billing records, and activity logs.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAccount} className="bg-red-600 hover:bg-red-700">
                  Delete Account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
