# Database Configuration

This project uses Drizzle ORM with AWS Aurora PostgreSQL.

## Setup

1. **Set environment variables** in your `.env.local`:
   ```
   DATABASE_URL=postgresql://user:password@aurora-cluster.xxxxxx.rds.amazonaws.com:5432/procureai
   ```

2. **Run migrations**:
   ```bash
   npm run db:push
   ```

3. **Generate types**:
   ```bash
   npm run db:generate
   ```

## AWS Aurora PostgreSQL Connection

The database client is configured to work with AWS Aurora PostgreSQL using standard `pg` driver.

**Connection details**:
- Host: Your Aurora cluster endpoint (e.g., `procureai-cluster.xxxxxx.rds.amazonaws.com`)
- Port: `5432` (default PostgreSQL)
- Database: `procureai`
- User: Master username configured in Aurora
- Password: Master password configured in Aurora

**IAM Authentication (optional)**:
For enhanced security, use IAM database authentication. Update `lib/db.ts` to use `@aws-sdk/rds-signer` if needed.
