# ProcureAI - Setup Instructions

## The Problem You're Seeing

```
500: INTERNAL_SERVER_ERROR
Code: MIDDLEWARE_INVOCATION_FAILED
```

This error happens because authentication environment variables are missing.

---

## The Solution (3 Easy Steps)

### Step 1: Get Keys from Clerk

Visit: https://clerk.com/dashboard

1. Go to **API Keys** (left sidebar)
2. Copy **Publishable Key** (starts with `pk_test_`)
3. Copy **Secret Key** (starts with `sk_test_`)
4. Go to **Webhooks** (left sidebar)
5. Create a webhook endpoint with URL: `https://your-domain.com/api/webhooks/clerk`
6. Select events: user.created, user.updated, user.deleted
7. Copy the **Signing Secret** (starts with `whsec_`)

### Step 2: Add to Vercel Dashboard

Visit: https://vercel.com/dashboard

1. Select **ProcureAI** project
2. Click **Settings** (top menu)
3. Click **Environment Variables** (left sidebar)
4. Click **Add New** for each variable below

**Add These 8 Variables:**

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_test_...` (from Clerk) |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | `/dashboard` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | `/dashboard` |
| `CLERK_SECRET_KEY` | `sk_test_...` (from Clerk) |
| `CLERK_WEBHOOK_SECRET` | `whsec_...` (from Clerk webhooks) |
| `DATABASE_URL` | Your PostgreSQL connection string |

**Important**: For each variable, check both:
- ☑ Production
- ☑ Preview

Then click **Save**

### Step 3: Redeploy

1. Go to **Deployments**
2. Click **Redeploy** on latest deployment
3. Wait 2-3 minutes
4. Go to your app
5. Press **Ctrl+Shift+R** (hard refresh)
6. Done!

---

## What Each Variable Does

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk knows who you are (client-side) |
| `CLERK_SECRET_KEY` | Clerk server communication (keep secret!) |
| `CLERK_WEBHOOK_SECRET` | Verifies webhook messages from Clerk |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Where users sign in |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Where users sign up |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | Where users go after signing in |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | Where users go after signing up |
| `DATABASE_URL` | Your database connection |

---

## Why NEXT_PUBLIC_ Prefix?

Variables with `NEXT_PUBLIC_` are visible in your browser (that's OK for Publishable Key).

Variables WITHOUT prefix (like `CLERK_SECRET_KEY`) stay on the server (secret).

---

## If Still Getting Error

1. **Check all 8 variables are in Vercel** - Go to Settings → Environment Variables
2. **Verify each has Production + Preview checked**
3. **No typos in names** - Copy-paste from above
4. **Redeploy** - Click Redeploy button
5. **Wait 2-3 minutes** - Takes time to deploy
6. **Hard refresh** - Ctrl+Shift+R
7. **Try private window** - Clear cache completely

---

## Local Development

Your `.env.development.local` file already has test values. Use these locally.

**Never commit these to Git** (they're in `.gitignore`)

---

## Next Steps After Setup

Once variables are set and working:

1. Visit `/sign-up` to create a test account
2. Check that user appears in your database
3. Test signing in at `/sign-in`
4. Verify you can access `/dashboard`

---

## Need Help?

- **Detailed Guide**: See `docs/ENVIRONMENT_SETUP.md`
- **Quick Reference**: See `ENV_VARS_QUICK_GUIDE.md`
- **Clerk Support**: https://clerk.com/docs

---

## Key Points to Remember

✓ Add variables to **Vercel** (not to code)
✓ Check both **Production** and **Preview**
✓ **Redeploy** after adding variables
✓ **Wait 2-3 minutes** for deployment
✓ **Hard refresh** your browser
✓ **Never commit secrets** to Git

