# Quick Guide: Where to Add Environment Variables

## TL;DR - Quick Steps

### For Vercel Production/Preview (WHERE YOU NEED TO ADD THEM):

1. **Go to Vercel Dashboard**
   - https://vercel.com/dashboard

2. **Select ProcureAI Project**
   - Click on "ProcureAI"

3. **Click Settings**
   - Top menu bar

4. **Click Environment Variables**
   - Left sidebar under "Settings"

5. **Add Each Variable Below**
   - Click "Add New"
   - Enter Key and Value
   - Select "Production" and "Preview"
   - Click "Save"

---

## Environment Variables to Add

### Copy-Paste These Keys:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
NEXT_PUBLIC_CLERK_SIGN_IN_URL
NEXT_PUBLIC_CLERK_SIGN_UP_URL
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL
CLERK_SECRET_KEY
CLERK_WEBHOOK_SECRET
DATABASE_URL
```

---

## Where to Get Values

### From Clerk Dashboard (https://clerk.com):

| Key | Value | Where to Copy |
|-----|-------|---------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_test_...` | Clerk → API Keys → Publishable Key |
| `CLERK_SECRET_KEY` | `sk_test_...` | Clerk → API Keys → Secret Key |
| `CLERK_WEBHOOK_SECRET` | `whsec_...` | Clerk → Webhooks → Signing Secret |

### Simple Values:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | `/dashboard` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | `/dashboard` |

### From Your Database:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | Your PostgreSQL connection string |

---

## Step-by-Step in Vercel Dashboard

### Step 1: Open Settings
```
1. Go to https://vercel.com/dashboard
2. Select "ProcureAI" project
3. Click "Settings" (top menu)
4. Click "Environment Variables" (left menu)
```

### Step 2: Add Each Variable
```
For each variable:
1. Click "Add New"
2. Paste the Key name (e.g., NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)
3. Paste the Value (e.g., pk_test_...)
4. Select Environments:
   - Production ✓
   - Preview ✓
   - Development (optional)
5. Click "Save"
6. Wait for "✓ Added" confirmation
```

### Step 3: Redeploy
```
1. Go to "Deployments"
2. Click "Redeploy" on latest deployment
3. Wait for deployment to complete
4. Visit your app - should work now!
```

---

## Important Notes

### NEXT_PUBLIC_ Variables
- These are **visible in browser** (that's OK for Publishable Key)
- Must have the `NEXT_PUBLIC_` prefix exactly
- Without prefix, Clerk won't find them

### SECRET Variables
- `CLERK_SECRET_KEY` - NO prefix (server-side only)
- `CLERK_WEBHOOK_SECRET` - NO prefix (server-side only)
- Keep these safe!

### Local Development
- Your `.env.development.local` already has test values
- Use these for local testing
- Don't commit to Git

---

## Troubleshooting Middleware Error

If you see: `500: MIDDLEWARE_INVOCATION_FAILED`

1. **Check all 8 variables are in Vercel**
   - Go to Settings → Environment Variables
   - All variables should be listed
   - Values should not be empty

2. **Redeploy after adding variables**
   - Go to Deployments
   - Click "Redeploy" on latest
   - Wait 2-3 minutes

3. **Hard refresh browser**
   - Ctrl+Shift+R (Windows)
   - Cmd+Shift+R (Mac)

4. **Check Production environment**
   - Each variable must have "Production" checked
   - Variables added to "Development" only won't work in preview

---

## Verification Checklist

After adding all variables:

- [ ] All 8 variables added to Vercel
- [ ] Each variable has Production checked
- [ ] No typos in variable names
- [ ] Values start with correct prefix (pk_, sk_, whsec_)
- [ ] Redeployed after adding variables
- [ ] Waited 2-3 minutes for deployment
- [ ] Cleared browser cache (Ctrl+Shift+R)
- [ ] Tried in private/incognito window

---

## Variables Summary

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = pk_test_XXXX
NEXT_PUBLIC_CLERK_SIGN_IN_URL = /sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL = /sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL = /dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL = /dashboard
CLERK_SECRET_KEY = sk_test_XXXX
CLERK_WEBHOOK_SECRET = whsec_XXXX
DATABASE_URL = postgresql://...
```

---

## Still Getting Error?

Check Vercel Function Logs:

1. Go to Deployments
2. Click on latest deployment
3. Click "Function Logs"
4. Search for "error" or "middleware"
5. Share the error in support

---

For detailed setup: See `docs/ENVIRONMENT_SETUP.md`
