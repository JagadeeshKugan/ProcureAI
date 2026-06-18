# Clerk User & Organization Sync Setup

## Overview

This document describes the secure Clerk-to-PostgreSQL sync system that automatically synchronizes Clerk users and organizations into your Aurora PostgreSQL database.

## Database Schema

### New Tables

#### organizations
```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_org_id TEXT UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### users (Extended)
```sql
-- New columns added to existing users table:
ALTER TABLE users ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN first_name VARCHAR(255);
ALTER TABLE users ADD COLUMN last_name VARCHAR(255);
```

## Implementation

### Architecture

```
Clerk (Source of Truth)
    ↓
ClerkSyncInit Component (runs on app load)
    ↓
syncClerkUserToDatabase Server Action
    ↓
ClerkSyncService (handles transactions)
    ↓
OrganizationRepository & UserRepository
    ↓
PostgreSQL (Clerk data synced)
```

### Key Components

#### 1. Database Schema (`db/schema.ts`)
- `organizations` table with Clerk org ID
- Extended `users` table with organization relationship
- Unique constraints prevent duplicates

#### 2. Repositories
- `OrganizationRepository`: CRUD operations on organizations
- `UserRepository` extended: Organization queries with transaction support

#### 3. Service (`services/clerk-sync.service.ts`)
- `syncUserAndOrganization()`: Main sync logic with transaction
- Prevents race conditions
- Returns userId and organizationId

#### 4. Server Action (`actions/clerk-sync.actions.ts`)
- `syncClerkUserToDatabase()`: Extracts user/org from Clerk, calls service
- `getSyncedUserData()`: Retrieves synced user and organization

#### 5. Client Component (`components/clerk-sync-init.tsx`)
- Runs once on app load when user authenticated
- Non-blocking, handles errors gracefully

## Setup Steps

### 1. Create Database Migration

Run the Drizzle migration to create the new tables:

```bash
npm run drizzle:generate
npm run drizzle:migrate
```

Or manually:

```sql
-- Create organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_org_id TEXT UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX clerk_org_id_idx ON organizations(clerk_org_id);

-- Extend users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS first_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS last_name VARCHAR(255);

CREATE INDEX organization_id_idx ON users(organization_id);
```

### 2. Verify Environment Variables

Ensure these are set in production:

```
DATABASE_URL=postgresql://...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
```

### 3. Deploy Code

Deploy the new code with the Clerk sync implementation.

### 4. Test the Sync

1. Sign in with a Clerk user
2. Check database for the synced user:
   ```sql
   SELECT * FROM users WHERE clerk_id = 'user_...';
   SELECT * FROM organizations WHERE clerk_org_id = 'org_...';
   ```

## Security

### Transaction Safety
- Both organization and user are synced atomically
- If either fails, neither is committed

### Duplicate Prevention
- Unique constraints on `clerkOrgId` and `clerkId`
- Upsert operations prevent duplicates on retry

### Data Integrity
- Foreign key constraints ensure no orphaned records
- Clerk session is authoritative source of truth

### Access Control
- Sync only runs for authenticated users
- Server actions validate Clerk authentication
- Existing RBAC middleware enforces role-based access

## Usage

### Automatic Sync
User is automatically synced on first authenticated app load.

### Manual Sync
```typescript
import { syncClerkUserToDatabase } from "@/actions/clerk-sync.actions"

const result = await syncClerkUserToDatabase()
if (result.success) {
  console.log("User synced:", result.userId)
  console.log("Organization:", result.organizationId)
}
```

### Get Synced Data
```typescript
import { getSyncedUserData } from "@/actions/clerk-sync.actions"

const result = await getSyncedUserData()
if (result.success) {
  const { user, organization } = result.data
}
```

### Service Layer Access
```typescript
import { ClerkSyncService } from "@/services/clerk-sync.service"

const syncService = new ClerkSyncService()

// Get user
const user = await syncService.getUserByClerkId(clerkUserId)

// Get users in organization
const orgUsers = await syncService.getUsersByOrganization(organizationId)

// Get organization
const org = await syncService.getOrganizationByClerkId(clerkOrgId)
```

## Troubleshooting

### User not syncing
1. Check DATABASE_URL is set
2. Verify Clerk environment variables
3. Check browser console for errors
4. Check server logs: `[ClerkSyncInit]` or `[Clerk Sync Action]`

### Duplicate users
1. Should not happen due to unique constraints and upsert logic
2. If it occurs, manually update: `UPDATE users SET organization_id = ... WHERE clerk_id = ...`

### Migration failed
- Check database connection
- Verify migration script ran successfully
- Check for existing tables that conflict

## Monitoring

### Log Warnings
Warnings are logged but don't break the app:
- `[ClerkSyncInit] Sync warning:` - Non-critical sync issues
- `[ClerkSyncInit] Sync error:` - Sync failed, user can still use app

## Future Enhancements

1. Add organization roles and permissions
2. Sync additional Clerk metadata (profile images, etc.)
3. Add audit logging for sync events
4. Implement manual resync for users
5. Add organization settings and preferences
