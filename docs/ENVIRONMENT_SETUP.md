# Environment Variables Setup Guide

## Where to Add Environment Variables

### For Local Development (`.env.local` or `.env.development.local`)
These files are already configured in your project. They are ignored by Git and used locally only.

**File:** `/vercel/share/v0-project/.env.development.local`

### For Production/Vercel Deployment
Add environment variables in the **Vercel Dashboard**:

1. Go to: https://vercel.com/dashboard
2. Select your project: **ProcureAI**
3. Click: **Settings** (top menu)
4. Click: **Environment Variables** (left sidebar)
5. Add each variable below

---

## Required Environment Variables

### 1. Database Configuration

**Key:** `DATABASE_URL`
```
postgresql://user:password@host:5432/procureai?sslmode=require
```
- Already configured for your Neon/Aurora database
- Contact your database administrator for the connection string

---

### 2. Clerk Authentication (REQUIRED FOR AUTH)

#### Client-Side Variables (Use `NEXT_PUBLIC_` prefix)

**Key:** `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
```
pk_test_...
```
- **Where to get it:** Clerk Dashboard → API Keys → Publishable Key
- **Important:** Must have `NEXT_PUBLIC_` prefix (visible in client-side code)
- **Prefix:** `NEXT_PUBLIC_`

**Key:** `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
```
/sign-in
```
- Where users are redirected for sign-in

**Key:** `NEXT_PUBLIC_CLERK_SIGN_UP_URL`
```
/sign-up
```
- Where users are redirected for sign-up

**Key:** `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL`
```
/dashboard
```
- Where users go after successful sign-in

**Key:** `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL`
```
/dashboard
```
- Where users go after successful sign-up

#### Server-Side Variables (No prefix - secret)

**Key:** `CLERK_SECRET_KEY`
```
sk_test_...
```
- **Where to get it:** Clerk Dashboard → API Keys → Secret Key
- **Important:** Keep this secret! Never commit to Git
- **No prefix:** This is server-side only

**Key:** `CLERK_WEBHOOK_SECRET`
```
whsec_...
```
- **Where to get it:** Clerk Dashboard → Webhooks → Copy Signing Secret
- **Used for:** Verifying webhook signatures from Clerk
- **No prefix:** This is server-side only

---

## Step-by-Step: Getting Clerk Keys

### 1. Create Clerk Account
```
1. Visit https://clerk.com
2. Click "Sign Up"
3. Create account with email
4. Verify email address
5. Choose your organization name
```

### 2. Create Application in Clerk
```
1. In Clerk Dashboard, click "Create Application"
2. Choose "Create Application"
3. Name it: "ProcureAI"
4. Select: "Email, Phone, Username"
5. Click "Create Application"
```

### 3. Get API Keys
```
1. In Clerk Dashboard, go to "API Keys"
2. You'll see:
   - Publishable Key: pk_test_...
   - Secret Key: sk_test_...
3. Copy both (they're shown only once, but can be regenerated)
```

### 4. Configure Redirect URLs (Important!)
```
1. Go to "Redirect URLs" 
2. Under "Sign-in URL", add your domain:
   - Local: http://localhost:3000/sign-in
   - Production: https://your-domain.com/sign-in

3. Under "Sign-up URL", add:
   - Local: http://localhost:3000/sign-up
   - Production: https://your-domain.com/sign-up

4. Under "After sign-in URL", add:
   - Local: http://localhost:3000/dashboard
   - Production: https://your-domain.com/dashboard

5. Click "Save"
```

### 5. Create Webhook for User Sync
```
1. Go to "Webhooks" in Clerk Dashboard
2. Click "Add Endpoint"
3. Enter your endpoint URL:
   - Local: http://localhost:3000/api/webhooks/clerk
   - Production: https://your-domain.com/api/webhooks/clerk

4. Select these events:
   ✓ user.created
   ✓ user.updated
   ✓ user.deleted

5. Click "Create"
6. Copy the "Signing Secret" (whsec_...)
```

---

## Adding Variables to Vercel

### Method 1: Vercel Dashboard (Recommended)

```
1. Go to https://vercel.com/dashboard
2. Select project: ProcureAI
3. Click "Settings" → "Environment Variables"
4. For each variable below, click "Add New"
5. Enter the key and value
6. Select environments: Production (and Preview if testing)
7. Click "Save"
```

### Method 2: Vercel CLI

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login

# Add environment variables
vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
vercel env add CLERK_SECRET_KEY
vercel env add CLERK_WEBHOOK_SECRET
vercel env add DATABASE_URL
```

---

## Complete Environment Variables Checklist

Add these to Vercel Dashboard:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = pk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL = /sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL = /sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL = /dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL = /dashboard
CLERK_SECRET_KEY = sk_test_... (Keep secret!)
CLERK_WEBHOOK_SECRET = whsec_...
DATABASE_URL = postgresql://...
```

---

## Important Notes

### NEXT_PUBLIC_ Prefix
- Variables with `NEXT_PUBLIC_` are **visible in browser code**
- Never put secrets here (passwords, API keys, etc.)
- Clerk's Publishable Key is safe with this prefix (it's meant to be public)

### Secret Variables (No prefix)
- `CLERK_SECRET_KEY` - Used only on server
- `CLERK_WEBHOOK_SECRET` - Used only on server
- `DATABASE_URL` - Used only on server
- These are never exposed to the browser

### Local Development
- Create `.env.local` or `.env.development.local` in project root
- Add all variables here for local testing
- **Never commit to Git** (already in .gitignore)

---

## Testing Environment Variables

### Check if Variables are Set

In your code:
```javascript
console.log(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY); // Should print key
console.log(process.env.CLERK_SECRET_KEY); // Should be undefined (secret)
```

### Verify Clerk Integration

After setting variables:

1. **Deploy to Vercel**
   ```
   git push origin main
   ```

2. **Test Sign-Up**
   - Visit: https://your-domain.com/sign-up
   - Create a test account
   - Should redirect to /dashboard

3. **Check Webhook**
   - Go to Clerk Dashboard → Webhooks
   - You should see a successful delivery for `user.created`

4. **Verify Database**
   - Query your database for the new user
   - Should see the user record created automatically

---

## Troubleshooting

### Error: "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is not set"

**Solution:**
1. Check Vercel Environment Variables (Settings → Environment Variables)
2. Verify the key starts with `pk_test_`
3. Make sure to use `NEXT_PUBLIC_` prefix
4. Redeploy: `git push origin main`
5. Wait 1-2 minutes for deployment to complete

### Error: "Invalid Clerk publishable key"

**Solution:**
1. Copy the key directly from Clerk Dashboard
2. Don't add extra spaces or quotes
3. Verify it starts with `pk_` (not `sk_`)
4. Generate a new key if needed

### Error: "MIDDLEWARE_INVOCATION_FAILED"

**Solution:**
1. Ensure all Clerk keys are set in Vercel
2. Redeploy after adding variables
3. Wait for deployment to complete
4. Hard refresh browser (Ctrl+Shift+R)
5. Check Vercel Function Logs for error details

### Webhook not receiving events

**Solution:**
1. Verify webhook endpoint is correct
2. Check webhook is enabled in Clerk
3. Review webhook signing secret in Clerk Dashboard
4. Check Vercel Function Logs (Deployments → Function Logs)
5. Verify CLERK_WEBHOOK_SECRET matches exactly

---

## Environment-Specific Configuration

### Development (Local)
```
DATABASE_URL = localhost or dev database
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = pk_test_ key
CLERK_SECRET_KEY = sk_test_ key
```

### Staging (Preview Deployments)
```
Same as Production
Use Preview environment in Vercel Dashboard
```

### Production
```
DATABASE_URL = Production PostgreSQL
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = pk_live_ or pk_test_ (recommended: pk_live_)
CLERK_SECRET_KEY = sk_live_ or sk_test_ (recommended: sk_live_)
CLERK_WEBHOOK_SECRET = Production webhook secret
```

---

## Security Best Practices

1. **Never commit secrets to Git**
   - `.env.local` is in `.gitignore` ✓
   - Only commit `.env.example` ✓

2. **Use different keys for environments**
   - Local development: pk_test_/sk_test_
   - Production: pk_live_/sk_live_ (or keep test, both work)

3. **Rotate keys regularly**
   - Generate new keys in Clerk monthly
   - Update in Vercel
   - Old keys stop working

4. **Monitor webhook deliveries**
   - Clerk Dashboard → Webhooks → View deliveries
   - Ensure user.created events are successful

5. **Keep secrets out of logs**
   - Never log full keys in console
   - Clerk logs are secure by default

---

## Quick Reference

### For Preview/Staging Issues

If you're still getting 500 errors in preview:

1. **Check Vercel Environment Variables**
   - Settings → Environment Variables
   - Verify all keys are set
   - Check "Preview" environments are enabled

2. **Redeploy**
   - Go to Deployments
   - Click "Redeploy" on latest deployment
   - Wait for completion

3. **Clear Cache**
   - Hard refresh: Ctrl+Shift+R
   - Clear cookies for the domain
   - Try incognito window

4. **Check Logs**
   - Deployments → Function Logs
   - Search for "error" or "MIDDLEWARE"
   - Look for specific error message

---

## Support Resources

- **Clerk Docs:** https://clerk.com/docs
- **Vercel Docs:** https://vercel.com/docs
- **Environment Variables:** https://vercel.com/docs/projects/environment-variables
- **Troubleshooting:** https://clerk.com/docs/support

