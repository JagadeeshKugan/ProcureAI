# AWS Aurora PostgreSQL Setup Guide

This guide walks through setting up ProcureAI with AWS Aurora PostgreSQL using Drizzle ORM.

## Prerequisites

- AWS account with RDS access
- Aurora PostgreSQL cluster (compatible with PostgreSQL 12+)
- Environment variables configured in Vercel

## Step 1: Create AWS Aurora PostgreSQL Cluster

1. **Go to RDS Console**:
   - Navigate to [AWS RDS Console](https://console.aws.amazon.com/rds/)
   - Click "Create database"

2. **Configure the cluster**:
   - Engine: **Aurora PostgreSQL**
   - Engine version: **PostgreSQL 16** (or compatible)
   - Database cluster identifier: `procureai-cluster`
   - Master username: `postgres` (or your preferred user)
   - Master password: Generate a strong password
   - Instance class: `db.t4g.medium` (or larger for production)

3. **Network & Security**:
   - VPC: Select your VPC
   - Subnet group: Create or select an Aurora DB subnet group
   - Public accessibility: **No** (unless behind a load balancer)
   - Security group: Create security group `procureai-db-sg`
   - Allow inbound on port 5432 from your application security group

4. **Storage**:
   - Storage type: **Aurora (recommended)**
   - Allocated storage: 100 GB (initial)
   - Enable auto-scaling up to 1000 GB

5. **Backups**:
   - Backup retention: **7 days** (minimum for production)
   - Enable backup encryption

6. **Create cluster** and wait 5-10 minutes for provisioning

## Step 2: Update Environment Variables

After cluster creation, add the connection string to your environment:

```bash
# In Vercel Project Settings > Environment Variables
DATABASE_URL=postgresql://postgres:PASSWORD@procureai-cluster.xxxxx.rds.amazonaws.com:5432/procureai?sslmode=require
```

**Format breakdown**:
```
postgresql://username:password@host:port/database?sslmode=require
```

- `username`: Master username (e.g., `postgres`)
- `password`: Master password (URL-encoded if special characters)
- `host`: Aurora cluster endpoint (e.g., `procureai-cluster.c9akciq32.us-east-1.rds.amazonaws.com`)
- `port`: `5432` (default PostgreSQL)
- `database`: `procureai` (will be created on first migration)
- `sslmode=require`: Enforces SSL for security

## Step 3: Run Database Migrations

### Local Development

```bash
# Install dependencies
npm install

# Generate migration files
npm run db:generate

# Push schema to Aurora
npm run db:push

# Optional: Open Drizzle Studio to browse data
npm run db:studio
```

### Vercel Deployment

Add a deployment hook to run migrations automatically:

1. Create a pre-build script in `scripts/migrate.js`:
```javascript
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

async function migrate() {
  console.log("Running database migrations...");
  await execAsync("npm run db:push");
  console.log("Migrations completed");
}

migrate().catch(console.error);
```

2. Update `vercel.json`:
```json
{
  "buildCommand": "node scripts/migrate.js && npm run build",
  "installCommand": "npm install"
}
```

## Step 4: Verify Connection

Test the connection using the health check endpoint:

```bash
# Local
curl http://localhost:3000/api/health

# Vercel
curl https://procureai.vercel.app/api/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "All systems operational",
  "database": "connected",
  "stats": {
    "total": 0,
    "highRating": 0
  },
  "timestamp": "2024-06-13T10:30:00.000Z"
}
```

## Step 5: Connect Application to Database

Once migrations are complete, the app can query the database. Example:

```typescript
import { db } from "@/lib/db";
import { vendors } from "@/lib/db/schema";

// Fetch vendors
const allVendors = await db.select().from(vendors);
```

## Security Best Practices

### 1. **Use IAM Database Authentication** (Optional - Enhanced Security)

Instead of storing passwords in environment variables, use IAM roles:

```bash
npm install @aws-sdk/rds-signer
```

Update `lib/db/index.ts`:
```typescript
import { Signer } from "@aws-sdk/rds-signer";

const signer = new Signer({
  region: "us-east-1",
  hostname: process.env.DB_HOST,
  port: 5432,
  username: process.env.DB_USER,
});

const token = signer.getAuthToken({
  username: process.env.DB_USER,
});

// Use token as password in connection string
```

### 2. **Enable Encryption**

- **In Transit**: `sslmode=require` in connection string (already set)
- **At Rest**: Enable RDS encryption in AWS Console

### 3. **Security Groups**

Only allow inbound traffic on port 5432 from:
- Your application's security group (in same VPC)
- Bastion hosts for administrative access
- Do NOT expose to 0.0.0.0/0

### 4. **Master Password Management**

- Store master password in AWS Secrets Manager
- Rotate password every 90 days
- Use strong password (20+ characters, mixed case, numbers, symbols)

### 5. **Monitor & Log**

Enable RDS monitoring:
- CloudWatch metrics: CPU, connections, storage
- Enhanced monitoring (granular OS-level metrics)
- Query logging: Enable slow query log if needed

## Troubleshooting

### Connection Timeout
```
Error: connect ETIMEDOUT
```
**Solution**: Check security group allows inbound on 5432 from your app

### Password Authentication Failed
```
Error: password authentication failed for user "postgres"
```
**Solution**: Verify DATABASE_URL credentials match Aurora master user/password

### SSL Certificate Error
```
Error: self signed certificate in certificate chain
```
**Solution**: Add `?sslmode=require` to connection string, or use `?sslmode=prefer` for development

### Database Does Not Exist
```
Error: database "procureai" does not exist
```
**Solution**: Run `npm run db:push` to create database and tables

## Monitoring & Maintenance

### Monthly Tasks
- Review CloudWatch metrics for performance trends
- Check RDS automated backups are running
- Review and archive application logs

### Quarterly Tasks
- Analyze slow queries using RDS Performance Insights
- Optimize indexes if needed
- Update Aurora PostgreSQL patch version

### Annually
- Rotate master password
- Review security group rules
- Disaster recovery drill using backups

## Scaling

### Read Scaling
Add Aurora read replicas in different AZs for read-heavy workloads:

```bash
# In AWS Console > RDS > Databases > procureai-cluster
# Click "Add reader" to add Aurora read replica
```

Update connection string in app to use reader endpoint for SELECT queries.

### Storage Scaling
Aurora auto-scales up to your configured maximum. Monitor:
```sql
SELECT pg_database_size(datname) / 1024 / 1024 / 1024 as size_gb
FROM pg_database
WHERE datname = 'procureai';
```

### Compute Scaling
Upgrade instance class via RDS Console (requires brief downtime):
1. Select cluster
2. Modify → DB instance class
3. Apply immediately or during maintenance window

## Cost Optimization

- Use **db.t4g.small** for development/testing (~$0.05/hour)
- Use **db.r6g.large** for production (~$0.30/hour)
- Enable **storage auto-scaling** to avoid manual scaling costs
- Use **Aurora Serverless v2** for variable workloads (pay-as-you-go)
- Reserve instances for predictable workloads (30-50% discount)

## Additional Resources

- [AWS Aurora Documentation](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Aurora.html)
- [Drizzle ORM PostgreSQL Guide](https://orm.drizzle.team/docs/get-started-postgresql)
- [PG Connection String Format](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING)
