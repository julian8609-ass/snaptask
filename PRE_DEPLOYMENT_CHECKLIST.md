# Pre-Deployment Checklist for Vercel

## ✅ Local Testing (Before Pushing to GitHub)

- [ ] Run `npm run build` - verify no build errors
- [ ] Run `npm run dev` - verify app starts locally
- [ ] Test creating a task
- [ ] Test fetching tasks (check `/api/tasks?userId=550e8400-e29b-41d4-a716-446655440000`)
- [ ] Clear browser cache and reload
- [ ] All API endpoints respond with status 200/201

## ✅ Supabase Setup (Production)

- [ ] Verify all tables exist in Supabase
- [ ] Run `sql/create-tables.sql` if tables don't exist
- [ ] Run `sql/disable-rls-dev.sql` to disable RLS (for now)
- [ ] Run `sql/insert-demo-user.sql` to create demo user
- [ ] Check tables have data (browse in Supabase dashboard)

## ✅ GitHub Setup

- [ ] `.env` is in `.gitignore`
- [ ] All code is committed: `git add . && git commit -m "msg" && git push`
- [ ] Repository is public or Vercel has access

## ✅ Vercel Setup

- [ ] Created Vercel account at https://vercel.com
- [ ] Connected GitHub repository
- [ ] Added all environment variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  - `NEXTAUTH_URL` (use your Vercel URL)
  - `NEXTAUTH_SECRET` (generate with: `openssl rand -hex 32`)

## ✅ Post-Deployment Verification

1. **Build succeeds** - Check Vercel Deployments tab
2. **Site loads** - Visit your Vercel URL
3. **Console has no errors** - Open DevTools (F12)
4. **API working** - Check Network tab when creating task
5. **Data saves** - Create a task and refresh page - it should still be there

## ✅ Troubleshooting

If tasks don't appear:
1. Check browser console (F12) for errors
2. Check Vercel function logs (Deployments → Click deployment → Logs)
3. Verify Supabase environment variables match your credentials
4. Make sure demo user exists in Supabase

If build fails:
1. Check build logs in Vercel dashboard
2. Run `npm run build` locally to reproduce error
3. Fix locally, push to GitHub, auto-redeploys

## 🚀 Deployment Command (if using Vercel CLI)

```bash
npm install -g vercel
vercel
```

Then follow prompts to link project and deploy.

## 📝 After First Deployment

1. Test all features thoroughly on production
2. Monitor error logs for issues
3. Plan to enable proper RLS policies (advanced)
4. Set up custom domain if desired
5. Enable automatic deployments (usually default in Vercel)

---

**Your Vercel URL will be:** `https://snaptask.vercel.app` (or custom if you configured one)

**Check deployment status:** https://vercel.com/dashboard
