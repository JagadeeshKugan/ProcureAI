# Production Deployment Checklist - ProcureAI

## Fixed Issues

### 1. Middleware Invocation Error (FIXED ✅)
**Problem:** `MIDDLEWARE_INVOCATION_FAILED` - 500 error in production
**Root Cause:** Multiple `await auth()` calls and improper error handling
**Solution Applied:**
- Call `await auth()` only once and destructure all values
- Use local variable `authObj` to avoid redundant async calls
- Changed `console.warn` to `console.error` for better logging
- Proper redirect handling using `authObj.redirectToSignIn()`

**File Modified:** `middleware.ts`

---

## Production Environment Variables (Must Add to Vercel)

### Required Variables: 8 Total

#### Authentication (Clerk) - 7 Variables
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
CLERK_SECRET_KEY=sk_live_xxxxx
CLERK_WEBHOOK_SECRET=whsec_xxxxx
```

#### Database - 1 Variable
```
DATABASE_URL=postgresql://user:password@host:5432/procureai
```

### Steps to Add Environment Variables to Vercel

1. Go to https://vercel.com/dashboard
2. Select your **ProcureAI** project
3. Navigate to **Settings** → **Environment Variables**
4. Add each variable one by one
5. Select scope:
   - **Production** and **Preview** for all sensitive vars
   - **Development** only for local testing vars
6. Click **Deploy** to apply changes

---

## Before Deployment Checklist

- [ ] All 8 environment variables added to Vercel Production
- [ ] Clerk API keys verified (go to https://dashboard.clerk.com/apps)
- [ ] Database credentials verified (test connection works)
- [ ] Build succeeds locally: `npm run build`
- [ ] Middleware routing tested locally with `npm run dev`
- [ ] No console errors or warnings in local build
- [ ] Git branch is up to date with main

---

## Deployment Steps

### Option 1: Vercel Git Integration (Recommended)
1. Push fixes to GitHub: `git push origin [branch]`
2. Create Pull Request and merge to `main`
3. Vercel auto-deploys when merged
4. Check deployment status at https://vercel.com/dashboard

### Option 2: Manual Deployment
1. Ensure all env vars are set in Vercel Production
2. Go to Vercel dashboard
3. Click **Deployments**
4. Click **Redeploy** on latest commit
5. Wait for deployment to complete
6. Test production URL

---

## Post-Deployment Verification

### Test Endpoints
- [ ] `https://yourdomain.com/api/health` → 200 OK
- [ ] `https://yourdomain.com/` → Redirects to sign-in
- [ ] `https://yourdomain.com/sign-in` → Sign-in page loads
- [ ] `https://yourdomain.com/sign-up` → Sign-up page loads

### Test Authentication Flow
- [ ] Sign up with new account in Clerk
- [ ] Verify webhook creates user in database (check Clerk webhooks)
- [ ] Sign in with created account
- [ ] Access `/dashboard` successfully
- [ ] RBAC redirects work (vendor vs. internal user)

### Test Database Connection
- [ ] Check logs for connection errors
- [ ] Verify all dashboard pages load
- [ ] Test request creation from department page
- [ ] Verify finance analytics loads

---

## Troubleshooting Production Errors

### Error: `MIDDLEWARE_INVOCATION_FAILED`
**Cause:** Missing `CLERK_SECRET_KEY` or `CLERK_PUBLISHABLE_KEY`
**Fix:** 
1. Verify env vars are set in Vercel Production scope
2. Redeploy after adding env vars
3. Check Vercel deployment logs: https://vercel.com/dashboard/[project]/deployments

### Error: Database Connection Failed
**Cause:** `DATABASE_URL` missing or invalid
**Fix:**
1. Verify `DATABASE_URL` format: `postgresql://user:pass@host/dbname`
2. Confirm database is accessible from Vercel (IP whitelisting)
3. Test locally first: `npm run dev`

### Error: Authentication Loop (Sign-in redirect)
**Cause:** Clerk webhook not creating users or role metadata missing
**Fix:**
1. Check Clerk Dashboard → Webhooks → Events
2. Verify webhook is receiving `user.created` events
3. Check database for user records
4. Verify `CLERK_WEBHOOK_SECRET` is correct

### Error: 404 on `/dashboard`
**Cause:** Middleware routing issue or Clerk not initialized
**Fix:**
1. Check browser console for errors
2. Verify `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set
3. Check middleware is running: look for "Proxy (Middleware)" in build output

---

## Monitoring & Logs

### View Deployment Logs
1. Go to https://vercel.com/dashboard/[project]/deployments
2. Click on latest deployment
3. Click **Runtime Logs** or **Build Logs**
4. Search for errors containing "error", "Error", or "FAILED"

### Common Log Checks
```bash
# Check Clerk initialization
grep -i "clerk" logs

# Check database connection
grep -i "database\|pg\|postgresql" logs

# Check middleware execution
grep -i "middleware" logs

# Check authentication errors
grep -i "auth\|unauthorized" logs
```

---

## Rollback Plan

If production is broken:
1. Go to Vercel deployments
2. Click **Rollback** on previous stable version
3. Confirm rollback
4. Takes 2-5 minutes to complete

---

## Environment Variables Reference

| Variable | Type | Source | Scope |
|----------|------|--------|-------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Public | Clerk Dashboard | Production, Preview |
| `CLERK_SECRET_KEY` | Secret | Clerk Dashboard | Production, Preview |
| `CLERK_WEBHOOK_SECRET` | Secret | Clerk Webhooks | Production, Preview |
| `DATABASE_URL` | Secret | AWS Aurora / Neon | Production, Preview |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Public | Static `/sign-in` | All |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Public | Static `/sign-up` | All |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | Public | Static `/dashboard` | All |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | Public | Static `/dashboard` | All |

---

## Support & Documentation

- **Clerk Docs:** https://clerk.com/docs
- **Next.js Middleware:** https://nextjs.org/docs/advanced-features/middleware
- **Vercel Deployments:** https://vercel.com/docs/concepts/deployments/overview
- **Environment Variables:** Check `ENV_METRICS_CHECKLIST.md`
- **Local Development:** Check `ENV_VARS_QUICK_GUIDE.md`

---

**Last Updated:** 2026-06-17
**Status:** Ready for Production Deployment
**Build:** ✅ Successful
**Middleware:** ✅ Fixed
