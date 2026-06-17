import {
  pgTable,
  text,
  uuid,
  timestamp,
  varchar,
  jsonb,
  integer,
  uniqueIndex,
} from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

// Users table
export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clerkId: text("clerk_id").unique().notNull(),
    email: varchar("email", { length: 255 }).unique().notNull(),
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
  })
)

export type InsertUser = typeof users.$inferInsert
export type SelectUser = typeof users.$inferSelect

// Purchase Requests table
export const purchaseRequests = pgTable(
  "purchase_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    requestNumber: varchar("request_number", { length: 50 }).unique().notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    department: varchar("department", { length: 100 }).notNull(),
    priority: varchar("priority", { length: 20 }).default("medium"), // 'low', 'medium', 'high', 'critical'
    estimatedBudget: integer("estimated_budget").notNull(), // In cents/smallest unit
    status: varchar("status", { length: 50 }).default("draft"), // 'draft', 'pending_approval', 'approved', 'in_rfq', 'rejected'
    requestedBy: uuid("requested_by")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    requestNumberIdx: uniqueIndex("request_number_idx").on(
      table.requestNumber
    ),
    departmentIdx: uniqueIndex("department_idx").on(table.department),
  })
)

export type InsertPurchaseRequest = typeof purchaseRequests.$inferInsert
export type SelectPurchaseRequest = typeof purchaseRequests.$inferSelect

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

