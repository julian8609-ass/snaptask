# 🚀 Quick Start: Deploy SnapTask to Vercel

## Summary
Your SnapTask app is ready to deploy! Follow these steps to get it live on Vercel.

---

## Step 1: Fix & Verify Local Setup (5 min)

### 1.1 Create Supabase Demo User
1. Go to: https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor** → **New Query**
4. Copy & paste from: `sql/insert-demo-user.sql`
5. Click **Run**

### 1.2 Verify Build Works
```bash
npm run build
npm run dev
```
- Create a test task
- Refresh page - task should persist
- No console errors

### 1.3 Test API Endpoint
Visit: `http://localhost:3000/api/tasks?userId=550e8400-e29b-41d4-a716-446655440000`
- Should return `[]` or array of tasks (status 200)
- If error: check console logs

---

## Step 2: Push to GitHub (2 min)

```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

**Verify:**
- [ ] Code on GitHub
- [ ] `.env` NOT committed (check .gitignore)
- [ ] All changes pushed

---

## Step 3: Deploy to Vercel (10 min)

### 3.1 Create Vercel Account
- Go to: https://vercel.com
- Sign up with GitHub

### 3.2 Import Project
1. Click **Add New** → **Project**
2. Click **Import Git Repository**
3. Select your SnapTask repo
4. Click **Import**

### 3.3 Add Environment Variables
Click **Environment Variables** and add these 6 variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://ojfexwiqomykpdwcuxlv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qZmV4d2lxb215a3Bkd2N1eGx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0MTExMTksImV4cCI6MjA5Mjk4NzExOX0.YNv_nBPGWzpdkd9EY_yU9OpvcZgYMARbmORzAc2KW-w
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qZmV4d2lxb215a3Bkd2N1eGx2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQxMTExOSwiZXhwIjoyMDkyOTg3MTE5fQ.6W7Noe1laS7mrT1-8vqntVRR9SZqqIQ5re0W56bzvjU
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_buOMrHJ5TXW5_C-C-w1Ifw_tBVW7Yhj
NEXTAUTH_URL=https://snaptask.vercel.app
NEXTAUTH_SECRET=your-secret-key-generate-with-openssl
```

**For NEXTAUTH_SECRET**, generate a secure random key:
```bash
openssl rand -hex 32
```
Copy the output and paste into the NEXTAUTH_SECRET variable.

### 3.4 Deploy
1. Click **Deploy** button
2. Wait 3-5 minutes for build to complete
3. Visit your live site: `https://snaptask.vercel.app`

---

## Step 4: Verify Deployment Works (5 min)

1. **Open your Vercel URL**
   - Should see your SnapTask app

2. **Create a Task**
   - Type task name
   - Click Create
   - Should appear instantly

3. **Refresh Page**
   - Task should still be there
   - (Not lost after refresh)

4. **Check Console (F12)**
   - No red errors
   - Network tab shows `/api/tasks` requests with status 200

5. **Test API Direct**
   ```
   https://snaptask.vercel.app/api/tasks?userId=550e8400-e29b-41d4-a716-446655440000
   ```
   Should return JSON array of tasks

---

## ✅ You're Live!

Your app is now deployed at: **https://snaptask.vercel.app**

### Auto-Deployment
Any time you push to GitHub, Vercel automatically deploys:
```bash
git push origin main  # Auto-deploys!
```

### Monitor Deployments
Visit: https://vercel.com/dashboard → Your Project → Deployments

---

## 🔧 Troubleshooting

| Problem | Solution |
|---------|----------|
| Build fails | Check Vercel build logs, run `npm run build` locally |
| Tasks don't save | Check .env vars in Vercel dashboard match your Supabase |
| API returns 500 | Check Supabase tables exist, demo user created |
| Console errors | Check Network tab (F12) → look at API responses |

---

## 📚 Full Guides
- **Detailed deployment:** See `VERCEL_DEPLOYMENT.md`
- **Pre-deployment checklist:** See `PRE_DEPLOYMENT_CHECKLIST.md`
- **Local testing:** Run `npm run dev`

---

**Questions?** Check the Network tab (F12) when an error occurs - that's where the real error message is!
