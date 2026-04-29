# SnapTask - Vercel Deployment Guide

## Prerequisites
- Vercel account (free: https://vercel.com)
- GitHub repository with your code
- Supabase project set up

## Step 1: Prepare Your Local Code

### 1.1 Make sure everything is committed to Git
```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### 1.2 Verify .env.local is NOT committed (security)
Check your `.gitignore` has:
```
.env
.env.local
.env.*.local
```

## Step 2: Connect GitHub to Vercel

1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select your GitHub repo
4. Click "Import"

## Step 3: Add Environment Variables

In Vercel Dashboard:

1. Go to **Settings** → **Environment Variables**
2. Add each variable:

```
NEXT_PUBLIC_SUPABASE_URL=https://ojfexwiqomykpdwcuxlv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qZmV4d2lxb215a3Bkd2N1eGx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0MTExMTksImV4cCI6MjA5Mjk4NzExOX0.YNv_nBPGWzpdkd9EY_yU9OpvcZgYMARbmORzAc2KW-w
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qZmV4d2lxb215a3Bkd2N1eGx2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQxMTExOSwiZXhwIjoyMDkyOTg3MTE5fQ.6W7Noe1laS7mrT1-8vqntVRR9SZqqIQ5re0W56bzvjU
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_buOMrHJ5TXW5_C-C-w1Ifw_tBVW7Yhj
NEXTAUTH_URL=https://your-vercel-domain.vercel.app
NEXTAUTH_SECRET=your-secret-key-here
```

3. For each variable, select **All** for availability (Production, Preview, Development)

## Step 4: Deploy

1. Click **Deploy**
2. Wait for build to complete (~3-5 minutes)
3. Visit your live site at: `https://your-project.vercel.app`

## Step 5: Verify Deployment

After deployment, test:
- [ ] Home page loads
- [ ] Can create a task
- [ ] Tasks save to Supabase
- [ ] Check `/api/tasks?userId=550e8400-e29b-41d4-a716-446655440000`

## Troubleshooting

### Build Fails
Check the build logs in Vercel Dashboard → Deployments → Click failed deployment

### Environment Variables Not Working
- Make sure they're set in Vercel (not just locally)
- Redeploy after adding new variables

### Tasks Not Saving
1. Check Network tab (F12 → Network)
2. Look for `/api/tasks` requests
3. Check response for errors
4. Verify Supabase tables exist
5. Verify RLS is disabled or policies allow writes

### Database Errors
If you see UUID errors, run in Supabase:
```sql
INSERT INTO users (
  id, email, username, full_name, created_at, updated_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'demo@snaptask.local',
  'demo_user',
  'Demo User',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
) ON CONFLICT (id) DO NOTHING;

INSERT INTO user_profiles (user_id, theme, timezone, notifications_enabled, total_xp, level, streak_days)
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'dark', 'UTC', true, 0, 1, 0)
ON CONFLICT (user_id) DO NOTHING;
```

## Production Security Checklist

- [ ] Enable RLS policies on Supabase
- [ ] Change NEXTAUTH_SECRET to a strong random string
- [ ] Enable HTTPS (automatic on Vercel)
- [ ] Set up custom domain
- [ ] Monitor error logs
- [ ] Set up uptime monitoring

## Custom Domain (Optional)

1. Go to Vercel Dashboard → Settings → Domains
2. Add your domain (example.com)
3. Update DNS records according to Vercel's instructions
4. Wait for DNS to propagate (~24 hours)

## Redeploy After Code Changes

Vercel auto-deploys when you push to main:
```bash
git add .
git commit -m "Your message"
git push origin main
```

Watch it deploy automatically in Vercel Dashboard!
