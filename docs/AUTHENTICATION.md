# ProcureAI Authentication & Authorization Guide

## Overview

ProcureAI uses **Clerk** for enterprise-grade authentication with role-based access control (RBAC). All user data is synced to PostgreSQL via Drizzle ORM for a multi-tenant B2B procurement platform.

## Architecture

```
User Login/Signup → Clerk Authentication → Webhook Sync → Database (PostgreSQL)
                                              ↓
                                    User role/metadata stored
                                    Multi-tenant company context
```

## Setup Instructions

### 1. Create Clerk Account

1. Go to [clerk.com](https://clerk.com)
2. Sign up for a free account
3. Create a new application

### 2. Configure Clerk Keys

In your Vercel project settings (or `.env.local`):

```env
# From Clerk Dashboard → API Keys
CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx

# For webhook signature verification
CLERK_WEBHOOK_SECRET=whsec_xxxxx
```

### 3. Set Up Webhook in Clerk

1. Go to **Clerk Dashboard → Webhooks**
2. Create new endpoint:
   - **URL:** `https://your-domain.com/api/webhooks/clerk`
   - **Events to subscribe:**
     - `user.created`
     - `user.updated`
     - `user.deleted`
   - Copy the **Signing Secret** to `CLERK_WEBHOOK_SECRET`

### 4. Configure User Metadata in Clerk

In Clerk Dashboard, set up Custom Attributes for users:

```json
Private Metadata:
{
  "role": "buyer",          // "buyer" | "supplier" | "admin"
  "company": "Acme Corp",   // User's company name
  "companyId": "org_123"    // Organization ID
}

Public Metadata:
{
  "department": "Procurement",
  "level": "executive"
}
```

## Database Schema

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id VARCHAR(255) UNIQUE NOT NULL,  -- Clerk user ID
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  image_url TEXT,                          -- Clerk avatar
  role VARCHAR(50) DEFAULT 'buyer',        -- buyer | supplier | admin
  company_id UUID,                         -- Organization reference
  company VARCHAR(255),                    -- Company name
  status VARCHAR(20) DEFAULT 'active',     -- active | inactive
  metadata JSONB,                          -- Additional Clerk data
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Authentication Flow

### 1. First-Time User Sign Up

```
User → Sign-Up Page → Clerk SignUp Component
          ↓
      Clerk creates user account
          ↓
      User enters metadata (company, role during onboarding)
          ↓
      Webhook triggered: user.created
          ↓
      Database: User record created
          ↓
      Redirect to Dashboard
```

### 2. Existing User Sign In

```
User → Sign-In Page → Clerk SignIn Component
          ↓
      Clerk creates session token
          ↓
      useUser() hook retrieves user data
          ↓
      syncUserToDatabase() updates DB record
          ↓
      Redirect to Dashboard
```

### 3. Logout

```
User clicks Sign Out → Confirmation Dialog
          ↓
      Clerk signOut() clears session
          ↓
      Redirect to /sign-in
```

## Role-Based Access Control

### User Roles

- **buyer**: Can create RFQs, manage vendors, approve purchases
- **supplier**: Can view RFQs, submit quotes, manage their catalog
- **admin**: Full access to all features and user management

### Route Protection

Protected routes are defined in middleware and server components:

```typescript
// In middleware or server components
import { hasRole } from "@/lib/auth/rbac";

const userRole = user?.unsafeMetadata?.role as string;

if (!hasRole(userRole, ["buyer", "admin"])) {
  return redirect("/unauthorized");
}
```

### Client-Side Role Checks

```typescript
import { useUserRole, useCanAccess } from "@/lib/auth/client";

export function MyComponent() {
  const { role, company, companyId } = useUserRole();
  const canAccess = useCanAccess(["buyer", "admin"]);
  
  if (!canAccess) {
    return <div>Access Denied</div>;
  }
  
  return <div>Welcome {role}!</div>;
}
```

## API Integration

### User Sync Server Action

Called automatically when user logs in:

```typescript
import { syncUserToDatabase } from "@/lib/auth/server";

// In any client or server context:
await syncUserToDatabase();
```

Returns:
- `null` if user not authenticated
- User database record if successful

### Webhook Handler

Handles Clerk webhook events:

```typescript
// POST /api/webhooks/clerk

Events handled:
- user.created → Insert user into DB
- user.updated → Update user record
- user.deleted → Mark user as inactive
```

## Multi-Tenant Setup

### Organization Context

Each user belongs to a company (organization):

```typescript
const { companyId, company } = useUserRole();

// All API queries should filter by companyId
const userProcurements = await db
  .select()
  .from(purchaseRequests)
  .where(eq(purchaseRequests.companyId, companyId));
```

### Row-Level Security (Optional)

For added security, implement RLS policies:

```sql
-- Enable RLS on tables
ALTER TABLE purchase_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their company's data
CREATE POLICY company_isolation ON purchase_requests
  USING (company_id = current_user_id()::uuid);
```

## Protected Routes

Currently protected by middleware:

- `/dashboard/*` - Procurement dashboard
- `/requests/*` - Purchase requests
- `/vendors/*` - Vendor management
- `/rfq/*` - RFQ creation and quotes
- `/orders/*` - Order tracking
- `/profile/*` - User profile
- `/copilot/*` - AI assistant

Public routes:
- `/` - Redirects to /dashboard or /sign-in
- `/sign-in` - Clerk sign-in page
- `/sign-up` - Clerk sign-up page
- `/api/health` - Health check
- `/api/webhooks/clerk` - Webhook endpoint

## Monitoring & Debugging

### Check User Authentication

```typescript
import { useUser } from "@clerk/nextjs";

export function DebugUser() {
  const { user, isLoaded } = useUser();
  
  if (!isLoaded) return <p>Loading...</p>;
  
  return (
    <div>
      <p>Email: {user?.emailAddresses[0]?.emailAddress}</p>
      <p>Role: {user?.unsafeMetadata?.role}</p>
      <p>Company: {user?.unsafeMetadata?.company}</p>
    </div>
  );
}
```

### Verify User in Database

```typescript
import { getCurrentUser } from "@/lib/auth/server";

const dbUser = await getCurrentUser();
console.log("User in DB:", dbUser);
```

### Test Webhook

Use Clerk Dashboard → Webhooks → Test Endpoint, or Svix CLI:

```bash
svix message create --auth-token <key> --endpoint-id <endpoint-id> --event-type user.created --payload '{"user":{}}'
```

## Troubleshooting

### User not syncing to database
- Check `CLERK_WEBHOOK_SECRET` is correct
- Verify webhook endpoint URL is publicly accessible
- Check database connection with `CLERK_WEBHOOK_SECRET` logs

### Role not showing in Topbar
- Verify user metadata is set in Clerk Dashboard
- Check `user?.unsafeMetadata?.role` exists
- Clear browser cache and re-authenticate

### Webhook signature verification fails
- Ensure `CLERK_WEBHOOK_SECRET` matches Clerk dashboard
- Check webhook endpoint is receiving signed requests
- Verify svix library is up to date

## Best Practices

1. **Never store passwords** - Clerk handles all password management
2. **Use secure session tokens** - Sessions are managed by Clerk
3. **Sync on first login** - Database records created automatically via webhook
4. **Filter by companyId** - Always scope queries to user's organization
5. **Set metadata early** - Configure user role/company during onboarding
6. **Monitor webhook logs** - Check Clerk dashboard for sync failures

## Next Steps

1. Set up Clerk account and configure keys
2. Add webhook endpoint in Clerk dashboard
3. Test sign-up flow and webhook sync
4. Configure user metadata during onboarding
5. Implement company/organization selection
6. Add role-specific dashboards
7. Set up Row-Level Security (RLS) in PostgreSQL

## References

- [Clerk Documentation](https://clerk.com/docs)
- [Next.js + Clerk](https://clerk.com/docs/quickstarts/nextjs)
- [Clerk Webhooks](https://clerk.com/docs/webhooks/overview)
- [Drizzle ORM](https://orm.drizzle.team)
