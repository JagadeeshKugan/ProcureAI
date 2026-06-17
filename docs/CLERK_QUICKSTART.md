# Clerk Setup Quick Start

## Step 1: Create Clerk Account (2 minutes)

1. Visit https://clerk.com and click **Sign Up**
2. Create account with your email
3. Verify your email
4. Create a new application named "ProcureAI"

## Step 2: Get API Keys (1 minute)

1. In Clerk Dashboard, go to **API Keys**
2. Copy these three keys to your environment:
   ```
   CLERK_PUBLISHABLE_KEY = pk_test_...
   CLERK_SECRET_KEY = sk_test_...
   ```
3. Add them to Vercel project (Settings → Environment Variables)

## Step 3: Configure Webhook (3 minutes)

1. Go to **Webhooks** in Clerk Dashboard
2. Click **Create New Endpoint**
3. Set:
   - **URL:** `https://procureai.vercel.app/api/webhooks/clerk` (your production URL)
   - **Events:** Select all three:
     - user.created
     - user.updated
     - user.deleted
4. After creating, copy the **Signing Secret** (starts with `whsec_`)
5. Add to Vercel: `CLERK_WEBHOOK_SECRET = whsec_...`

## Step 4: Set User Metadata Schema (2 minutes)

1. Go to **User & Authentication → User Attributes**
2. Under **Private Metadata**, add custom attributes:
   - Click **+ New** for each field:
     - `role` (Text) - for "buyer", "supplier", "admin"
     - `company` (Text) - for company name
     - `companyId` (Text) - for org reference

## Step 5: Test the Integration

1. Deploy to Vercel (or run locally with env vars)
2. Visit `https://your-domain.com/sign-up`
3. Create a test account
4. After sign-up, check Vercel logs for webhook sync
5. Database should now have your user record

## Verify Everything Works

```bash
# Check webhook was received
# Clerk Dashboard → Webhooks → View recent deliveries

# Check database user was created
# Connect to your PostgreSQL and query:
SELECT * FROM users WHERE email = 'your-test-email@example.com';
```

## Common Issues

**"Invalid webhook signature"**
- Double-check `CLERK_WEBHOOK_SECRET` matches exactly
- Ensure webhook URL is publicly accessible
- Check webhook endpoint in Clerk receives requests

**"User not appearing in database"**
- Verify webhook is enabled in Clerk
- Check PostgreSQL connection is working
- Review Vercel function logs for errors

**"Sign in redirects to wrong page"**
- Update Clerk redirect URLs in Dashboard
- Ensure `/dashboard` route exists
- Check middleware is allowing unauthenticated access to `/sign-in`

## Testing with Demo Credentials

For development, Clerk provides test credentials:

1. Go to **Clerk Dashboard → Settings → Test mode**
2. Enable test accounts
3. Use one of the provided test emails to sign in

## Next: User Onboarding

After first login, collect user metadata:

1. Create onboarding flow (`/onboarding` page)
2. Collect company name and user role
3. Store in Clerk private metadata
4. Webhook will sync to database

Example metadata form:

```typescript
// Update user metadata after signup
await user?.update({
  unsafeMetadata: {
    role: selectedRole,        // "buyer" | "supplier" | "admin"
    company: companyName,
    companyId: generatedOrgId
  }
});
```

## Production Checklist

- [ ] Clerk keys added to Vercel production environment
- [ ] Webhook URL updated to production domain
- [ ] Database migrations run (`npm run db:push`)
- [ ] Webhook signing secret configured
- [ ] User metadata schema set in Clerk
- [ ] Test user created and verified
- [ ] Database user record created successfully
- [ ] Sign-in/sign-up flow tested end-to-end
- [ ] Role-based access control tested
- [ ] Logout and session management tested

## Support

- Clerk Docs: https://clerk.com/docs
- Community: https://discord.gg/b5rXHjAg7A
- Email: support@clerk.com
