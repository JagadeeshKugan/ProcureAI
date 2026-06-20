import {
  pgTable,
  text,
  uuid,
  timestamp,
  varchar,
  jsonb,
  integer,
  uniqueIndex,
  foreignKey,
  numeric,
} from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

// Organizations table
export const organizations = pgTable(
  "organizations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clerkOrgId: text("clerk_org_id").unique().notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    clerkOrgIdIdx: uniqueIndex("clerk_org_id_idx").on(table.clerkOrgId),
  })
)

export type InsertOrganization = typeof organizations.$inferInsert
export type SelectOrganization = typeof organizations.$inferSelect

// Users table
export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clerkId: text("clerk_id").unique().notNull(),
    organizationId: uuid("organization_id").references(() => organizations.id, {
      onDelete: "set null",
    }),
    email: varchar("email", { length: 255 }).unique().notNull(),
    firstName: varchar("first_name", { length: 255 }),
    lastName: varchar("last_name", { length: 255 }),
    name: varchar("name", { length: 255 }),
    role: varchar("role", { length: 50 }).default("employee"), // 'employee', 'vendor', 'admin'
    companyName: varchar("company_name", { length: 255 }), // For vendors
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    clerkIdIdx: uniqueIndex("clerk_id_idx").on(table.clerkId),
    emailIdx: uniqueIndex("email_idx").on(table.email),
    organizationIdIdx: uniqueIndex("organization_id_idx").on(table.organizationId),
  })
)

export type InsertUser = typeof users.$inferInsert
export type SelectUser = typeof users.$inferSelect

// Purchase Requests table
export const purchaseRequests = pgTable(
  "purchase_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    requestNumber: varchar("request_number", { length: 50 }).unique().notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    department: varchar("department", { length: 100 }),
    priority: varchar("priority", { length: 20 }).default("medium"), // 'low', 'medium', 'high', 'critical'
    estimatedTotal: numeric("estimated_total", { precision: 12, scale: 2 }).default("0"),
    currency: varchar("currency", { length: 3 }).default("USD"),
    status: varchar("status", { length: 50 }).default("draft"), // 'draft', 'pending_approval', 'approved', 'in_rfq', 'rejected'
    requestedBy: uuid("requested_by")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    approvalRoute: jsonb("approval_route"), // Array of approver user IDs in sequence
    departmentBudgetRemaining: numeric("department_budget_remaining", { precision: 12, scale: 2 }),
    attachments: jsonb("attachments"), // Array of attachment URLs/metadata
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    requestNumberIdx: uniqueIndex("request_number_idx").on(table.requestNumber),
    organizationIdIdx: uniqueIndex("org_id_idx").on(table.organizationId),
    requestedByIdx: uniqueIndex("requested_by_idx").on(table.requestedBy),
    statusIdx: uniqueIndex("status_idx").on(table.status),
    createdAtIdx: uniqueIndex("created_at_idx").on(table.createdAt),
  })
)

export type InsertPurchaseRequest = typeof purchaseRequests.$inferInsert
export type SelectPurchaseRequest = typeof purchaseRequests.$inferSelect

// Purchase Request Items table
export const purchaseRequestItems = pgTable(
  "purchase_request_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    purchaseRequestId: uuid("purchase_request_id")
      .notNull()
      .references(() => purchaseRequests.id, { onDelete: "cascade" }),
    lineNumber: integer("line_number").notNull(),
    itemName: varchar("item_name", { length: 255 }).notNull(),
    description: text("description"),
    quantity: numeric("quantity", { precision: 12, scale: 2 }).notNull(),
    unitOfMeasure: varchar("unit_of_measure", { length: 50 }),
    estimatedUnitPrice: numeric("estimated_unit_price", { precision: 12, scale: 2 }),
    estimatedTotalPrice: numeric("estimated_total_price", { precision: 12, scale: 2 }),
    category: varchar("category", { length: 100 }),
    manufacturer: varchar("manufacturer", { length: 255 }),
    brand: varchar("brand", { length: 255 }),
    modelNumber: varchar("model_number", { length: 255 }),
    sku: varchar("sku", { length: 255 }),
    specifications: jsonb("specifications"),
    requiredByDate: timestamp("required_by_date"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    purchaseRequestIdIdx: uniqueIndex("pr_id_idx").on(table.purchaseRequestId),
  })
)

export type InsertPurchaseRequestItem = typeof purchaseRequestItems.$inferInsert
export type SelectPurchaseRequestItem = typeof purchaseRequestItems.$inferSelect

// Purchase Request Approvals table
export const purchaseRequestApprovals = pgTable(
  "purchase_request_approvals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    purchaseRequestId: uuid("purchase_request_id")
      .notNull()
      .references(() => purchaseRequests.id, { onDelete: "cascade" }),
    approverId: uuid("approver_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: varchar("status", { length: 20 }).default("pending"), // 'pending', 'approved', 'rejected'
    comments: text("comments"),
    approvedAt: timestamp("approved_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    purchaseRequestIdIdx: uniqueIndex("pr_approval_pr_id_idx").on(
      table.purchaseRequestId
    ),
  })
)

export type InsertPurchaseRequestApproval = typeof purchaseRequestApprovals.$inferInsert
export type SelectPurchaseRequestApproval = typeof purchaseRequestApprovals.$inferSelect

// Audit Logs table
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    entityType: varchar("entity_type", { length: 50 }).notNull(), // 'purchase_request', 'user', etc.
    entityId: uuid("entity_id").notNull(),
    action: varchar("action", { length: 50 }).notNull(), // 'create', 'update', 'delete', 'approve', 'reject'
    performedBy: uuid("performed_by")
      .notNull()
      .references(() => users.id, { onDelete: "set null" }),
    metadata: jsonb("metadata"), // Additional context about the action
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    entityTypeIdIdx: uniqueIndex("entity_type_id_idx").on(
      table.entityType,
      table.entityId
    ),
  })
)

export type InsertAuditLog = typeof auditLogs.$inferInsert
export type SelectAuditLog = typeof auditLogs.$inferSelect

// RFQ (Request for Quotation) table
export const rfqs = pgTable(
  "rfqs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    rfqNumber: varchar("rfq_number", { length: 50 }).unique().notNull(),
    purchaseRequestId: uuid("purchase_request_id")
      .notNull()
      .references(() => purchaseRequests.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    status: varchar("status", { length: 50 }).default("draft"), // 'draft', 'sent', 'responses_received', 'evaluation', 'awarded'
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    rfqNumberIdx: uniqueIndex("rfq_number_idx").on(table.rfqNumber),
  })
)

export type InsertRfq = typeof rfqs.$inferInsert
export type SelectRfq = typeof rfqs.$inferSelect

// Vendor Quotes table
export const vendorQuotes = pgTable(
  "vendor_quotes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    rfqId: uuid("rfq_id")
      .notNull()
      .references(() => rfqs.id, { onDelete: "cascade" }),
    vendorId: uuid("vendor_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    price: integer("price").notNull(), // In cents/smallest unit
    deliveryTime: integer("delivery_time"), // In days
    warranty: varchar("warranty", { length: 255 }),
    notes: text("notes"),
    status: varchar("status", { length: 50 }).default("submitted"), // 'submitted', 'accepted', 'rejected'
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  }
)

export type InsertVendorQuote = typeof vendorQuotes.$inferInsert
export type SelectVendorQuote = typeof vendorQuotes.$inferSelect

