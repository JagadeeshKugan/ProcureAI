## Backend Architecture - Production-Grade Database Setup

This document outlines the database infrastructure for ProcureAI built with Drizzle ORM and Aurora PostgreSQL.

### Directory Structure

```
src/
├─ db/
│  ├─ index.ts          # Database connection client & pooling
│  └─ schema.ts         # Drizzle schema definitions
├─ repositories/        # Data access layer
│  ├─ user.repository.ts
│  ├─ purchase-request.repository.ts
│  └─ audit-log.repository.ts
├─ services/            # Business logic layer
│  ├─ user.service.ts
│  └─ purchase-request.service.ts
├─ actions/             # Server actions for client communication
│  └─ purchase-request.actions.ts
└─ lib/
   └─ validations.ts    # Zod schemas for input validation

drizzle/
├─ 0000_create_initial_schema.sql  # Initial migration
└─ meta/
   └─ 0000_snapshot.json           # Migration metadata
```

### Database Schema

#### Users Table
- **id**: UUID primary key
- **clerk_id**: Unique identifier from Clerk authentication
- **email**: User email (unique)
- **name**: Full name
- **role**: User role (employee/vendor/admin)
- **company_name**: Company name (for vendors)
- **created_at**: Timestamp
- **updated_at**: Timestamp with auto-update

#### Purchase Requests Table
- **id**: UUID primary key
- **request_number**: Auto-generated unique identifier (PR-YYYY-0001 format)
- **title**: Request title
- **description**: Detailed description
- **department**: Department name
- **priority**: Priority level (low/medium/high/critical)
- **estimated_budget**: Budget amount in cents
- **status**: Request status (draft/pending_approval/approved/in_rfq/rejected)
- **requested_by**: FK to users table
- **created_at & updated_at**: Timestamps

#### Audit Logs Table
- **id**: UUID primary key
- **entity_type**: Type of entity (purchase_request, user, etc.)
- **entity_id**: ID of the entity
- **action**: Action performed (create/update/delete/approve/reject)
- **performed_by**: FK to users table
- **metadata**: JSONB for additional context
- **created_at**: Timestamp

#### RFQs Table
- **id**: UUID primary key
- **rfq_number**: Unique RFQ identifier
- **purchase_request_id**: FK to purchase_requests
- **title**: RFQ title
- **description**: RFQ details
- **status**: RFQ status (draft/sent/responses_received/evaluation/awarded)
- **created_at & updated_at**: Timestamps

#### Vendor Quotes Table
- **id**: UUID primary key
- **rfq_id**: FK to rfqs
- **vendor_id**: FK to users (vendor)
- **price**: Quote price in cents
- **delivery_time**: Delivery time in days
- **warranty**: Warranty information
- **notes**: Additional notes
- **status**: Quote status (submitted/accepted/rejected)
- **created_at & updated_at**: Timestamps

### Setup Instructions

#### 1. Environment Variables
Add to `.env.local`:
```
DATABASE_URL=postgresql://user:password@hostname:5432/procureai
```

#### 2. Install Dependencies
```bash
npm install drizzle-orm pg @aws-sdk/rds-signer
npm install -D drizzle-kit
```

#### 3. Apply Migrations

To run migrations manually:
```bash
npx drizzle-kit push:pg
```

Or execute the SQL file directly in your Aurora PostgreSQL console:
```sql
-- Copy contents from drizzle/0000_create_initial_schema.sql
```

### Architecture Layers

#### Repository Layer (`src/repositories/`)
- **Purpose**: Direct database access
- **Methods**: CRUD operations, queries with filters
- **Example**: `PurchaseRequestRepository.create()`, `UserRepository.findByClerkId()`

#### Service Layer (`src/services/`)
- **Purpose**: Business logic and orchestration
- **Methods**: Complex operations combining multiple repositories
- **Example**: `PurchaseRequestService.createPurchaseRequest()` with validation and audit logging

#### Server Actions (`src/actions/`)
- **Purpose**: Client-server communication
- **Security**: Runs on server, validates auth with Clerk
- **Example**: `createPurchaseRequest()` action called from client components

### Key Features

#### 1. Connection Pooling
- Maximum 20 connections per pool
- Idle timeout: 30 seconds
- Connection timeout: 2 seconds
- Singleton pattern ensures single pool instance

#### 2. Validation
- Zod schemas for input validation
- Type-safe with TypeScript inference
- Clear error messages for validation failures

#### 3. Audit Logging
- All mutations automatically logged
- Tracks who made changes and when
- Stores metadata for compliance

#### 4. Clerk Integration
- User sync on first login
- Role-based access control via `publicMetadata.role`
- Secure server actions with auth checking

#### 5. Auto-Generated IDs
- UUIDs for all tables
- Request numbers with format: PR-YYYY-XXXX (auto-incremented)
- Ensures uniqueness and easy tracking

### Usage Examples

#### Creating a Purchase Request
```typescript
import { createPurchaseRequest } from "@/src/actions/purchase-request.actions"

const result = await createPurchaseRequest({
  title: "Office Supplies",
  description: "Monthly supplies",
  department: "Operations",
  priority: "medium",
  estimatedBudget: 50000, // cents = $500
  requestedBy: userId,
})
```

#### Querying Purchase Requests
```typescript
import { PurchaseRequestRepository } from "@/src/repositories/purchase-request.repository"

const repo = new PurchaseRequestRepository()
const requests = await repo.findByRequestedBy(userId)
const searchResults = await repo.search("office", "Operations", "draft")
```

#### Syncing User from Clerk
```typescript
import { syncUserFromClerk } from "@/src/actions/purchase-request.actions"

await syncUserFromClerk()
```

### Performance Considerations

1. **Indexes**: Unique indexes on frequently queried fields (clerk_id, email, request_number)
2. **Connection Pooling**: Reuses database connections efficiently
3. **Lazy Initialization**: Database client initialized only on first use
4. **Type Safety**: TypeScript prevents runtime errors

### Security Best Practices

1. **Parameterized Queries**: Drizzle ORM prevents SQL injection
2. **Row-Level Access**: Server actions verify user ownership
3. **Audit Trails**: All changes logged with user information
4. **Environment Variables**: Credentials stored securely

### Migration Strategy

Drizzle Kit generates migrations from schema changes:
```bash
npx drizzle-kit generate:pg
npx drizzle-kit push:pg
```

For production, review and test migrations in staging before applying to production.
