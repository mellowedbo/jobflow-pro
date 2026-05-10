# DrillOps Pro — Complete Deployment Guide

## STEP 1: Push Your Code to GitHub (Replace Old Code)

Your existing GitHub repo has the old version. We need to completely replace it.

### 1A. Open your terminal in the project folder

```bash
cd /home/z/my-project
```

### 1B. Remove the old git history and start fresh

```bash
# Remove old git history
rm -rf .git

# Initialize a brand new repo
git init

# Add all the new code
git add .

# Commit everything
git commit -m "DrillOps Pro v2 — Complete rebuild with Supabase backend + auth"
```

### 1C. Push to GitHub (force replace the old repo)

```bash
# Add your existing GitHub repo as remote
# REPLACE the URL with YOUR actual repo URL
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git

# Force push to completely replace the old code
git branch -M main
git push -f origin main
```

> ⚠️ The `-f` flag force-pushes, which OVERWRITES the old code completely. This is intentional.

### 1D. Verify on GitHub
- Go to your repo on github.com
- You should see all the new files (src/, supabase/, etc.)
- Make sure `.env` is NOT in the repo (it should be ignored)

---

## STEP 2: Create a Free Supabase Project

### 2A. Sign up for Supabase
1. Go to **https://supabase.com**
2. Click **"Start your project"** → Sign in with GitHub (easiest)
3. Click **"New Project"**

### 2B. Create the project
- **Name**: `drillops-pro` (or whatever you want)
- **Database Password**: Pick a strong password (SAVE THIS!)
- **Region**: Pick closest to you
- **Plan**: Free (select the free tier)
- Click **"Create new project"**
- Wait ~2 minutes for it to provision

### 2C. Enable Email Authentication
1. In your Supabase dashboard, go to **Authentication** → **Providers**
2. Make sure **Email** is enabled (it should be by default)
3. Under **Email**, you can optionally:
   - Disable "Confirm email" if you want instant login (for testing)
   - Or keep it enabled for production (users must verify email)

### 2D. Run the Database Schema
1. In your Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **"New query"**
3. Open the file `supabase/schema.sql` from your repo
4. Copy ALL of its contents and paste it into the SQL Editor
5. Click **"Run"** (or press Ctrl+Enter)
6. You should see "Success" — this creates all 10 tables, indexes, RLS policies, and the auto-profile trigger

### 2E. Get Your API Keys
1. In Supabase dashboard, go to **Settings** → **API**
2. You'll see two values:
   - **Project URL**: looks like `https://abcdefghijk.supabase.co`
   - **anon public key**: a long string starting with `eyJhbGci...`
3. COPY BOTH — you'll need them in Steps 3 and 4

---

## STEP 3: Test Locally (Optional but Recommended)

### 3A. Create your .env file
Create a file called `.env.local` in the project root:

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3B. Run the dev server
```bash
npm run dev
```

### 3C. Test it
1. Open http://localhost:3000
2. You should see the login/signup page
3. Click "Create an account" → Sign up with an email
4. If email confirmation is on, check your email and confirm
5. Sign in → You should see the full DrillOps Pro dashboard
6. The data will be empty (new account) — you can add jobs, inventory, etc.

---

## STEP 4: Deploy to Vercel (Free Hosting)

### 4A. Sign up for Vercel
1. Go to **https://vercel.com**
2. Click **"Sign Up"** → Sign in with GitHub (easiest)

### 4B. Import your repo
1. Click **"Add New..."** → **"Project"**
2. Find your `drillops-pro` repo in the list
3. Click **"Import"**

### 4C. Configure the deployment
1. **Framework Preset**: Next.js (should auto-detect)
2. **Root Directory**: Leave as default (should be `.` or `/`)
3. **Build Command**: Leave default
4. **Output Directory**: Leave default
5. **Environment Variables** — THIS IS CRITICAL:
   - Click **"Add Environment Variable"**
   - Add `NEXT_PUBLIC_SUPABASE_URL` = your Supabase Project URL
   - Add `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon key
6. Click **"Deploy"**

### 4D. Wait for deployment
- Vercel will build and deploy your app (~2-3 minutes)
- When done, you'll get a URL like: `https://drillops-pro.vercel.app`
- **THIS IS YOUR LIVE URL** — anyone can access it!

### 4E. Test your live app
1. Open your Vercel URL
2. Sign up with a new account
3. You should see the empty dashboard
4. Add some jobs, inventory, costs — it all saves to Supabase!

---

## STEP 5: How User Accounts Work

### What happens when someone signs up:
1. They go to your Vercel URL (e.g., `https://drillops-pro.vercel.app`)
2. They see the login page → Click "Create an account"
3. They enter their email, password, and full name
4. Supabase creates their account (auth.users table)
5. A trigger automatically creates their profile (profiles table)
6. When they sign in, they see their OWN data only
7. Each user's jobs, inventory, costs, etc. are completely separate
8. User A cannot see User B's data (enforced by Row Level Security)

### Managing users:
- Go to your Supabase dashboard → **Authentication** → **Users**
- You can see all registered users
- You can delete users, reset passwords, etc.
- Supabase free tier allows up to **50,000 users**

---

## TROUBLESHOOTING

### "Invalid Supabase URL" error
- Make sure your `.env.local` (for local) or Vercel env vars have the correct values
- The URL must start with `https://`
- The anon key must be the full long string, not truncated

### Login page shows but can't sign up
- Check Supabase dashboard → Authentication → Providers → Email is enabled
- If "Confirm email" is ON, users must check their email after signup
- You can disable email confirmation for testing

### Data doesn't load after login
- Check browser console (F12) for errors
- Make sure the SQL schema was run successfully in Supabase
- Check that RLS policies are created (Authentication → Policies)

### Build fails on Vercel
- Check that both env vars are set correctly in Vercel
- Check Vercel build logs for specific errors

---

## ARCHITECTURE SUMMARY

```
┌─────────────────────────────────────────────────┐
│                   USER BROWSER                    │
│         https://drillops-pro.vercel.app          │
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │           Next.js Frontend                   │ │
│  │  • Auth (Login/Signup via Supabase Auth)     │ │
│  │  • Zustand Store (state management)          │ │
│  │  • 8 Views (Dashboard, Jobs, Inventory...)   │ │
│  └──────────────┬──────────────────────────────┘ │
│                  │ fetch() with Bearer token       │
│  ┌──────────────▼──────────────────────────────┐ │
│  │         Next.js API Routes                   │ │
│  │  • /api/jobs, /api/inventory, /api/overheads │ │
│  │  • Auth check on every request               │ │
│  │  • snake_case ↔ camelCase conversion         │ │
│  └──────────────┬──────────────────────────────┘ │
│                  │ Supabase JS Client (auth'd)     │
└──────────────────┼────────────────────────────────┘
                   │
┌──────────────────▼────────────────────────────────┐
│              SUPABASE (Free Tier)                   │
│  • PostgreSQL Database (500MB)                      │
│  • Authentication (Email/Password)                  │
│  • Row Level Security (per-user data isolation)     │
│  • Auto-profile creation on signup                  │
│                                                     │
│  Tables: jobs, job_services, job_payments,          │
│  inventory_items, inventory_transactions,            │
│  overhead_costs, activity_log, profiles, app_state   │
└─────────────────────────────────────────────────────┘
```

### Free Tier Limits:
- **Supabase**: 500MB database, 50,000 auth users, 500MB storage
- **Vercel**: 100GB bandwidth, unlimited deployments
- **Total cost**: $0
