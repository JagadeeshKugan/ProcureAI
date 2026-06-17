# ProcureAI - Environment Variables Status & Required Configuration

## Current Status

✅ **Documented**: All required environment variables are documented in `ENV_VARS_QUICK_GUIDE.md` and `docs/ENVIRONMENT_SETUP.md`
✅ **Local Dev**: `.env.development.local` has Vercel internal variables configured
⚠️ **Production**: Need to add Clerk + Database credentials to Vercel project

---

## Required Environment Variables - 8 Total

### 1. Clerk Authentication (5 Variables)

#### Public Variables (use `NEXT_PUBLIC_` prefix):

| Variable | Required | Value | Where to Get |
|----------|----------|-------|--------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | ✅ YES | `pk_test_...` | [Clerk Dashboard](https://clerk.com) → API Keys → Publishable Key |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | ✅ YES | `/sign-in` | Static value |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | ✅ YES | `/sign-up` | Static value |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | ✅ YES | `/dashboard` | Static value |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | ✅ YES | `/dashboard` | Static value |

#### Secret Variables (NO prefix):

| Variable | Required | Value | Where to Get |
|----------|----------|-------|--------------|
| `CLERK_SECRET_KEY` | ✅ YES | `sk_test_...` | Clerk Dashboard → API Keys → Secret Key |
| `CLERK_WEBHOOK_SECRET` | ✅ YES | `whsec_...` | Clerk Dashboard → Webhooks → Signing Secret |

### 2. Database (1 Variable)

| Variable | Required | Value | Where to Get |
|----------|----------|-------|--------------|
| `DATABASE_URL` | ✅ YES | `postgresql://user:pass@host:port/db?sslmode=require` | AWS Aurora RDS or Neon PostgreSQL |

---

## Where These Variables Are Used

### In Code:

1. **middleware.ts** (line 36):
   ```typescript
   if (process.env.CLERK_SECRET_KEY) {
     // Authentication protection
   }
   ```

2. **db/index.ts** (lines 9, 14):
   ```typescript
   if (!process.env.DATABASE_URL) {
     throw new Error("DATABASE_URL not set")
   }
   const pool = new Pool({
     connectionString: process.env.DATABASE_URL,
   })
   ```

3. **app/api/webhooks/clerk/route.ts** (line 4, 25):
   ```typescript
   const webhookSecret = process.env.CLERK_WEBHOOK_SECRET
   if (!process.env.DATABASE_URL) { /* skip */ }
   ```

4. **drizzle.config.ts** (line 8):
   ```typescript
   connectionString: process.env.DATABASE_URL
   ```

5. **app/api/health/route.ts** (line 9):
   ```typescript
   const hasDatabaseUrl = Boolean(process.env.DATABASE_URL)
   ```

---

## Step-by-Step Setup Instructions

### Step 1: Set Up Clerk (5-10 minutes)

```
1. Go to https://clerk.com
2. Sign up or log in
3. Create an application
4. Go to API Keys
5. Copy:
   - Publishable Key (pk_test_...)
   - Secret Key (sk_test_...)
6. Go to Webhooks
7. Create webhook pointing to: https://your-app/api/webhooks/clerk
8. Copy Signing Secret (whsec_...)
```

### Step 2: Set Up Database (5-15 minutes)

**Option A: AWS Aurora PostgreSQL**
```
1. Go to AWS RDS Console
2. Create Aurora PostgreSQL cluster
3. Configure security group (port 5432)
4. Get endpoint: procureai-cluster.xxxxx.rds.amazonaws.com
5. Create connection string:
   postgresql://postgres:PASSWORD@procureai-cluster.xxxxx.rds.amazonaws.com:5432/procureai?sslmode=require
```

**Option B: Neon (Serverless)**
```
1. Go to https://console.neon.tech
2. Create new project
3. Copy connection string from dashboard
```

### Step 3: Add to Vercel (2-3 minutes)

```
1. Go to https://vercel.com/dashboard
2. Select "ProcureAI" project
3. Click Settings (top menu)
4. Click Environment Variables (left sidebar)
5. For each of the 8 variables:
   - Click "Add New"
   - Enter Key and Value
   - Select: Production ✓, Preview ✓
   - Click Save
6. Go to Deployments
7. Click "Redeploy" on latest deployment
8. Wait 2-3 minutes for completion
```

---

## Verification Checklist

After adding all variables, verify:

- [ ] All 8 variables appear in Vercel Settings → Environment Variables
- [ ] `NEXT_PUBLIC_` variables visible (public)
- [ ] `CLERK_SECRET_KEY` and `CLERK_WEBHOOK_SECRET` NOT visible (secret)
- [ ] Redeployed after adding variables
- [ ] Waited 2-3 minutes for deployment
- [ ] Visit app URL → should work
- [ ] Can sign up and sign in
- [ ] No "500 MIDDLEWARE_INVOCATION_FAILED" error
- [ ] Can create purchase requests
- [ ] Database queries working

---

## Troubleshooting

### Error: "500: MIDDLEWARE_INVOCATION_FAILED"
- ✅ Check all 8 variables exist in Vercel
- ✅ Verify Production environment is selected for each
- ✅ Redeploy after adding variables
- ✅ Hard refresh: Ctrl+Shift+R or Cmd+Shift+R

### Error: "DATABASE_URL environment variable is not set"
- ✅ Verify DATABASE_URL is added to Vercel
- ✅ Check value isn't empty
- ✅ Redeploy

### Error: "Clerk Webhook Secret invalid"
- ✅ Copy EXACT value from Clerk Dashboard → Webhooks
- ✅ No extra spaces before/after
- ✅ Webhook endpoint must be: `https://your-domain/api/webhooks/clerk`

### Sign-in/Sign-up not working
- ✅ Verify CLERK_PUBLISHABLE_KEY starts with `pk_test_`
- ✅ Verify `NEXT_PUBLIC_CLERK_SIGN_IN_URL` = `/sign-in`
- ✅ Verify `NEXT_PUBLIC_CLERK_SIGN_UP_URL` = `/sign-up`

---

## Summary Table: What to Add Now

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY    | pk_test_... | From Clerk
NEXT_PUBLIC_CLERK_SIGN_IN_URL        | /sign-in    | Static
NEXT_PUBLIC_CLERK_SIGN_UP_URL        | /sign-up    | Static  
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL  | /dashboard  | Static
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL  | /dashboard  | Static
CLERK_SECRET_KEY                     | sk_test_... | From Clerk
CLERK_WEBHOOK_SECRET                 | whsec_...   | From Clerk
DATABASE_URL                         | postgresql://... | AWS Aurora/Neon
```

---

## Files with Complete Documentation

- **ENV_VARS_QUICK_GUIDE.md** - Quick reference with copy-paste instructions
- **docs/ENVIRONMENT_SETUP.md** - Detailed Clerk setup guide (230+ lines)
- **docs/AURORA_SETUP.md** - AWS Aurora PostgreSQL setup guide
- **drizzle.config.ts** - References DATABASE_URL
- **middleware.ts** - References CLERK_SECRET_KEY
- **db/index.ts** - References DATABASE_URL with error handling

---

## Next Steps

1. **Immediate**: Set up Clerk account and get keys (5 min)
2. **Immediate**: Set up database and get connection string (5-15 min)
3. **Immediate**: Add all 8 variables to Vercel (2-3 min)
4. **Verify**: Test sign-in/sign-up and data operations

All documentation is ready and complete! 🎉
