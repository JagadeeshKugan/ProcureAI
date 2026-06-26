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
  index,
  boolean,
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
    role: varchar("role", { length: 50 }).default("requester"), // 'requester', 'procurement_manager', 'finance_officer', 'procurement_team', 'vendor', 'admin'
    status: varchar("status", { length: 50 }).default("pending"), // 'active', 'pending', 'disabled'
    department: varchar("department", { length: 255 }),
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
    organizationIdIdx: index("organization_id_idx").on(table.organizationId),
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
    status: varchar("status", { length: 50 }).default("draft"), // 'draft', 'submitted', 'manager_approved', 'finance_approved', 'procurement_review', 'in_rfq', 'rejected'
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
    organizationIdIdx: index("org_id_idx").on(table.organizationId),
    requestedByIdx: index("requested_by_idx").on(table.requestedBy),
    statusIdx: index("status_idx").on(table.status),
    createdAtIdx: index("created_at_idx").on(table.createdAt),
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
    purchaseRequestIdIdx: index("pr_id_idx").on(table.purchaseRequestId),
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
    prApprovalUniqueIdx: uniqueIndex("pr_approval_unique_idx").on(
      table.purchaseRequestId,
      table.approverId
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
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    entityType: varchar("entity_type", { length: 50 }).notNull(), // 'purchase_request', 'finance_approval', 'user', etc.
    entityId: uuid("entity_id").notNull(),
    action: varchar("action", { length: 50 }).notNull(), // 'create', 'update', 'delete', 'approve', 'reject', 'FINANCE_APPROVED'
    performedBy: uuid("performed_by")
  .references(() => users.id, {
      onDelete: "set null"
  }),
    metadata: jsonb("metadata"), // Additional context about the action, includes oldValues, newValues, comments
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    entityTypeIdIdx: index("entity_type_id_idx").on(
      table.entityType,
      table.entityId
    ),
    organizationIdIdx: index("audit_org_idx").on(table.organizationId),
  })
)

export type InsertAuditLog = typeof auditLogs.$inferInsert
export type SelectAuditLog = typeof auditLogs.$inferSelect

// RFQ (Request for Quotation) table
export const rfqs = pgTable(
  "rfqs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
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
    orgIdIdx: index("rfq_org_idx").on(table.organizationId),
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

// Organization Members table
export const organizationMembers = pgTable(
  "organization_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 50 }).notNull(), // 'REQUESTER', 'PROCUREMENT_MANAGER', 'FINANCE_OFFICER', 'PROCUREMENT_TEAM', 'VENDOR'
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
  },
  (table) => ({
    organizationUserIdx: uniqueIndex("org_user_idx").on(
      table.organizationId,
      table.userId
    ),
  })
)

export type InsertOrganizationMember = typeof organizationMembers.$inferInsert
export type SelectOrganizationMember = typeof organizationMembers.$inferSelect

// Notifications table
export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 50 }).notNull(), // 'approval_request', 'approval_approved', 'approval_rejected', 'request_submitted', 'request_approved'
    title: varchar("title", { length: 255 }).notNull(),
    message: text("message"),
    relatedEntityType: varchar("related_entity_type", { length: 50 }), // 'purchase_request', 'approval'
    relatedEntityId: uuid("related_entity_id"),
    read: boolean("read").default(false).notNull(), // 'true', 'false'
    actionUrl: text("action_url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("notification_user_idx").on(table.userId),
    createdAtIdx: index("notification_created_at_idx").on(table.createdAt),
  })
)

export type InsertNotification = typeof notifications.$inferInsert
export type SelectNotification = typeof notifications.$inferSelect

// Finance Approvals table
export const financeApprovals = pgTable(
  "finance_approvals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    requestId: uuid("request_id")
      .notNull()
      .references(() => purchaseRequests.id, { onDelete: "cascade" }),
    approvedBy: uuid("approved_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    budgetCode: varchar("budget_code", { length: 50 }),
    costCenter: varchar("cost_center", { length: 50 }),
    budgetAvailable: numeric("budget_available", { precision: 12, scale: 2 }),
    financeComments: text("finance_comments"),
    status: varchar("status", { length: 20 }).default("PENDING"), // 'PENDING', 'APPROVED', 'REJECTED'
    approvedAt: timestamp("approved_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    requestIdIdx: uniqueIndex("finance_approval_request_idx").on(table.requestId),
    organizationIdIdx: index("finance_approval_org_idx").on(table.organizationId),
  })
)

export type InsertFinanceApproval = typeof financeApprovals.$inferInsert
export type SelectFinanceApproval = typeof financeApprovals.$inferSelect

// Purchase Orders table
export const purchaseOrders = pgTable(
  "purchase_orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    requestId: uuid("request_id")
      .notNull()
      .references(() => purchaseRequests.id, { onDelete: "cascade" }),
    vendorId: uuid("vendor_id").references(() => users.id, { onDelete: "set null" }),
    poNumber: varchar("po_number", { length: 50 }).unique().notNull(),
    status: varchar("status", { length: 20 }).default("DRAFT"), // 'DRAFT', 'ISSUED', 'DELIVERED', 'COMPLETED', 'CANCELLED'
    totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).default("0"),
    currency: varchar("currency", { length: 3 }).default("USD"),
    expectedDelivery: timestamp("expected_delivery"),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    issuedAt: timestamp("issued_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    poNumberIdx: uniqueIndex("po_number_idx").on(table.poNumber),
    requestIdIdx: uniqueIndex("po_request_idx").on(table.requestId),
    organizationIdIdx: index("po_org_idx").on(table.organizationId),
  })
)

export type InsertPurchaseOrder = typeof purchaseOrders.$inferInsert
export type SelectPurchaseOrder = typeof purchaseOrders.$inferSelect

// Purchase Order Items table
export const purchaseOrderItems = pgTable(
  "purchase_order_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    purchaseOrderId: uuid("purchase_order_id")
      .notNull()
      .references(() => purchaseOrders.id, { onDelete: "cascade" }),
    lineNumber: integer("line_number").notNull(),
    itemName: varchar("item_name", { length: 255 }).notNull(),
    description: text("description"),
    quantity: varchar("quantity", { length: 50 }).notNull(),
    unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
    totalPrice: numeric("total_price", { precision: 12, scale: 2 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    poIdIdx: index("poi_po_id_idx").on(table.purchaseOrderId),
  })
)

export type InsertPurchaseOrderItem = typeof purchaseOrderItems.$inferInsert
export type SelectPurchaseOrderItem = typeof purchaseOrderItems.$inferSelect

// Procurement Assignments table - Tracks which procurement manager owns each approved request
export const procurementAssignments = pgTable(
  "procurement_assignments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    requestId: uuid("request_id")
      .notNull()
      .references(() => purchaseRequests.id, { onDelete: "cascade" }),
    assignedTo: uuid("assigned_to")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    status: varchar("status", { length: 20 }).default("OPEN"), // 'OPEN', 'IN_PROGRESS', 'COMPLETED'
    assignedAt: timestamp("assigned_at").defaultNow().notNull(),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    requestIdIdx: index("pa_request_idx").on(table.requestId),
    assignedToIdx: index("pa_assigned_to_idx").on(table.assignedTo),
    organizationIdIdx: index("pa_org_idx").on(table.organizationId),
  })
)

export type InsertProcurementAssignment = typeof procurementAssignments.$inferInsert
export type SelectProcurementAssignment = typeof procurementAssignments.$inferSelect

// Vendor Selections table - Tracks which vendor was selected for each request
export const vendorSelections = pgTable(
  "vendor_selections",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    requestId: uuid("request_id")
      .notNull()
      .references(() => purchaseRequests.id, { onDelete: "cascade" }),
    rfqId: uuid("rfq_id").references(() => rfqs.id, { onDelete: "set null" }),
    vendorId: uuid("vendor_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    selectedBy: uuid("selected_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    selectionReason: text("selection_reason"),
    aiScore: numeric("ai_score", { precision: 5, scale: 2 }), // Score from 0-100
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    requestIdUniqueIdx: uniqueIndex("vs_request_unique_idx").on(table.requestId),
    rfqIdIdx: index("vs_rfq_idx").on(table.rfqId),
    vendorIdIdx: index("vs_vendor_idx").on(table.vendorId),
    organizationIdIdx: index("vs_org_idx").on(table.organizationId),
  })
)

export type InsertVendorSelection = typeof vendorSelections.$inferInsert
export type SelectVendorSelection = typeof vendorSelections.$inferSelect

// RFQ Vendors table - Tracks which vendors are invited to an RFQ
export const rfqVendors = pgTable(
  "rfq_vendors",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    rfqId: uuid("rfq_id")
      .notNull()
      .references(() => rfqs.id, { onDelete: "cascade" }),
    vendorId: uuid("vendor_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    invitedAt: timestamp("invited_at").defaultNow().notNull(),
    status: varchar("status", { length: 20 }).default("invited"), // 'invited', 'quote_sent', 'quote_received', 'rejected'
    reminderSentAt: timestamp("reminder_sent_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    rfqIdIdx: index("rfq_vendors_rfq_idx").on(table.rfqId),
    vendorIdIdx: index("rfq_vendors_vendor_idx").on(table.vendorId),
    rfqVendorUniqueIdx: uniqueIndex("rfq_vendors_unique_idx").on(table.rfqId, table.vendorId),
  })
)

export type InsertRFQVendor = typeof rfqVendors.$inferInsert
export type SelectRFQVendor = typeof rfqVendors.$inferSelect

