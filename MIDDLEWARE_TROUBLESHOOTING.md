# Middleware Troubleshooting Guide

## Issue: MIDDLEWARE_INVOCATION_FAILED in Production

### What Causes This?
- Complex async logic in middleware that fails under load
- Incorrect Clerk middleware configuration
- Custom redirects that don't exist or fail
- Environment variables not properly loaded in production

### Solution Applied (Current)

The middleware has been **radically simplified** to fix this:

```typescript
import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export default clerkMiddleware((auth, request) => {
  return NextResponse.next();
});
```

**Why This Works:**
- Clerk's `clerkMiddleware` handles all auth logic internally
- No custom redirects = no failure points
- Works identically in preview and production
- Scales better under load

### RBAC (Role-Based Access Control)

RBAC is now enforced at the **page/layout level** instead of middleware:

**Example in `app/(app)/layout.tsx`:**
```typescript
import { auth } from "@clerk/nextjs/server";

export default async function AppLayout({ children }) {
  const { userId, sessionClaims } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }

  const userRole = (sessionClaims?.metadata as any)?.role || "employee";
  
  // Enforce RBAC here if needed
  if (userRole === "vendor") {
    redirect("/vendor/dashboard");
  }

  return <>{children}</>;
}
```

### Environment Variables Needed

Make sure these are set in Vercel Production:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
CLERK_WEBHOOK_SECRET
DATABASE_URL
```

Without these, the middleware will fail.

### Debugging Checklist

1. **Check Vercel Logs:**
   - Go to Vercel Dashboard → Project → Deployments → Functions
   - Look for middleware errors in real-time logs

2. **Verify Environment Variables:**
   ```bash
   # In Vercel Settings → Environment Variables
   - All 4 Clerk vars should be set
   - DATABASE_URL should be present
   - No typos or extra spaces
   ```

3. **Test Locally:**
   ```bash
   npm run build
   npm run start
   ```
   If it works locally but fails in production, it's likely an env var issue.

4. **Redeploy:**
   After fixing env vars, force a fresh deployment:
   - Delete previous deployments
   - Click "Redeploy" on latest commit

### If Still Failing

1. Check that your Clerk project is **active** and not disabled
2. Verify `CLERK_SECRET_KEY` matches your Clerk dashboard exactly
3. Clear Vercel cache: Settings → Advanced → Clear Cache
4. Check if ISR (Incremental Static Regeneration) is causing issues in middleware

### Never Do This in Middleware

❌ Complex database queries
❌ Multiple async/await chains
❌ Custom redirectToSignIn() with options
❌ Await multiple auth() calls
❌ Complex conditional logic

### Always Do This Instead

✅ Keep middleware minimal (just `NextResponse.next()`)
✅ Use `auth()` in components/layouts only
✅ Enforce RBAC in layout/page components
✅ Use server actions for complex logic
✅ Add error handling at component level

## Quick Recovery

If you're still getting errors:

```typescript
// middleware.ts - absolute minimum
import { clerkMiddleware } from "@clerk/nextjs/server";
export default clerkMiddleware();
```

That's it. No custom logic. Let Clerk handle everything.

## Post-Fix Verification

After deploying this fix:

1. Visit `https://yourdomain.com/api/health` → Should return 200
2. Visit `https://yourdomain.com/sign-in` → Should load
3. Try accessing a protected route → Should redirect to sign-in
4. Sign in → Should access dashboard
5. Check Vercel logs → Should see no middleware errors

## Reference

- [Clerk Middleware Docs](https://clerk.com/docs/references/nextjs/clerk-middleware)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Vercel Edge Middleware](https://vercel.com/docs/functions/edge-middleware)
