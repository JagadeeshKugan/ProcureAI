# ProcureAI — AI-Powered Procurement Platform

Enterprise-grade procurement management with AI-driven vendor selection, RFQ automation, and intelligent quote comparison.

## Features

✓ **Dashboard** - Real-time procurement KPIs and activity feed
✓ **Purchase Requests** - Create, track, and manage procurement needs
✓ **Vendors** - Evaluate suppliers with AI scoring and performance metrics
✓ **RFQ Management** - Automated request for quote generation and distribution
✓ **AI Quote Comparison** - Smart quote ranking by price, delivery, and risk
✓ **Procurement Copilot** - Chat interface for procurement insights
✓ **Enterprise UI** - Premium design with dark mode, accessibility, and responsive layout

## Tech Stack

- **Frontend**: Next.js 16, React 19, shadcn/ui, Tailwind CSS
- **Database**: AWS Aurora PostgreSQL + Drizzle ORM
- **Authentication**: Ready for integration (session-based or OAuth)
- **Deployment**: Vercel (optional)

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/JagadeeshKugan/ProcureAI.git
cd ProcureAI
npm install
```

### 2. Setup Database

```bash
# Copy environment template
cp .env.example .env.local

# Add your Aurora PostgreSQL connection string to .env.local
# DATABASE_URL=postgresql://...

# Generate migrations and push schema
npm run db:generate
npm run db:push
```

### 3. Run Development Server

```bash
npm run dev
# Opens http://localhost:3000
```

### 4. Deploy to Vercel

```bash
npm run build
vercel deploy
```

## Database Setup

ProcureAI uses **AWS Aurora PostgreSQL** with **Drizzle ORM** for type-safe database access.

### Prerequisites

- AWS RDS access
- Aurora PostgreSQL 12+ cluster
- Connection string in `.env.local`

### Quick Setup

```bash
# See docs/AURORA_SETUP.md for detailed setup instructions

# Verify connection
curl http://localhost:3000/api/health

# Expected response:
# { "status": "ok", "database": "connected", ... }
```

### Database Schema

The schema includes:
- **users** - User accounts and permissions
- **vendors** - Supplier management with AI scoring
- **purchase_requests** - Procurement requests
- **rfqs** - Request for quotations
- **quotes** - Vendor quotes with AI ranking
- **purchase_orders** - Finalized POs
- **activity_log** - Audit trail

See `lib/db/schema.ts` for complete schema definition.

### Key Commands

```bash
npm run db:generate  # Generate migration files
npm run db:push      # Apply migrations to database
npm run db:studio    # Open Drizzle Studio GUI
```

## Project Structure

```
procureai/
├── app/
│   ├── (app)/              # Protected routes (sidebar layout)
│   │   ├── dashboard/
│   │   ├── requests/
│   │   ├── vendors/
│   │   ├── rfq/
│   │   ├── orders/
│   │   └── copilot/
│   ├── api/                # API routes (health check, etc.)
│   ├── layout.tsx          # Root layout with theme
│   └── page.tsx            # Login page
├── components/
│   ├── ui/                 # shadcn components
│   ├── dashboard/          # Dashboard-specific components
│   ├── app-sidebar.tsx     # Navigation sidebar
│   ├── topbar.tsx          # Header with search & user menu
│   └── command-palette.tsx # Cmd+K command palette
├── lib/
│   ├── db/
│   │   ├── index.ts        # Database client
│   │   ├── schema.ts       # Drizzle schema
│   │   └── queries.ts      # Database queries
│   └── data.ts             # Demo data
├── docs/
│   ├── AURORA_SETUP.md     # AWS Aurora setup guide
│   └── DATABASE.md         # Database overview
└── drizzle.config.ts       # Drizzle configuration
```

## Environment Variables

Create `.env.local` with:

```env
# Required: AWS Aurora PostgreSQL
DATABASE_URL=postgresql://user:password@host:5432/procureai?sslmode=require
```

See `.env.example` for optional variables.

## Development

### Type Checking
```bash
npm run typecheck
```

### Linting
```bash
npm run lint
```

### Formatting
```bash
npm run format
```

### Building
```bash
npm run build
npm start
```

## Architecture

### Authentication Layer
The app currently uses demo credentials. Production setup requires:
- Session management (cookies + database)
- JWT tokens, or
- OAuth provider integration

### Database Access
All database queries use Drizzle ORM with:
- Type-safe query builder
- Automatic query optimization
- Built-in relationship handling

Example:
```typescript
import { db } from "@/lib/db";
import { vendors } from "@/lib/db/schema";

const topVendors = await db
  .select()
  .from(vendors)
  .where(gte(vendors.aiScore, 80))
  .orderBy(desc(vendors.aiScore));
```

### API Routes
- `/api/health` - Database connectivity check
- Ready for expansion with vendor, request, order APIs

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in [Vercel Dashboard](https://vercel.com)
3. Add `DATABASE_URL` environment variable
4. Deploy

### Self-Hosted

```bash
npm run build
npm start
```

Then expose port 3000 via reverse proxy (nginx, etc).

## Demo Credentials

Login page is styled but uses client-side demo navigation. For production:

1. Integrate authentication (Auth.js, Supabase, etc.)
2. Connect to real user database
3. Implement role-based access control (RBAC)

## Troubleshooting

### Database Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
Check DATABASE_URL in `.env.local` and Aurora cluster is running.

### Schema Mismatch
```
Error: relation "vendors" does not exist
```
Run `npm run db:push` to create tables.

### TypeScript Errors
```bash
npm run typecheck
```

## Documentation

- [AWS Aurora Setup](docs/AURORA_SETUP.md) - Complete guide to Aurora PostgreSQL
- [Database Overview](docs/DATABASE.md) - Schema and queries
- [Drizzle ORM Docs](https://orm.drizzle.team)
- [shadcn/ui Docs](https://ui.shadcn.com)
- [Next.js Docs](https://nextjs.org)

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make changes and test locally
3. Push and create a pull request
4. Submit for review

## License

MIT

## Support

- Docs: See `docs/` directory
- Issues: GitHub Issues
- Email: support@procureai.com (example)

---

Built with Next.js, React, Drizzle ORM, and AWS Aurora PostgreSQL.
