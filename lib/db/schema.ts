import {
  pgTable,
  text,
  timestamp,
  integer,
  decimal,
  varchar,
  boolean,
  jsonb,
  uuid,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Users table - synced from Clerk
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkId: varchar("clerk_id", { length: 255 }).notNull().unique(), // Clerk user ID
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  imageUrl: text("image_url"), // Clerk avatar
  role: varchar("role", { length: 50 }).notNull().default("buyer"), // buyer, supplier, admin
  companyId: uuid("company_id"), // References organization
  company: varchar("company", { length: 255 }), // Company name
  status: varchar("status", { length: 20 }).notNull().default("active"), // active, inactive
  metadata: jsonb("metadata"), // Additional user data from Clerk
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Vendors table
export const vendors = pgTable("vendors", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  location: varchar("location", { length: 255 }),
  rating: decimal("rating", { precision: 3, scale: 1 }).notNull().default("0"),
  aiScore: integer("ai_score").notNull().default(0), // 0-100
  status: varchar("status", { length: 20 }).notNull().default("active"), // active, inactive
  totalSpend: decimal("total_spend", { precision: 15, scale: 2 }).notNull().default("0"),
  onTimePercentage: integer("on_time_percentage").notNull().default(0),
  leadTimeDays: integer("lead_time_days"),
  metadata: jsonb("metadata"), // Additional vendor data
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Purchase Requests table
export const purchaseRequests = pgTable("purchase_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  requestNumber: varchar("request_number", { length: 50 }).notNull().unique(),
  userId: uuid("user_id").notNull(),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull(),
  estimatedBudget: decimal("estimated_budget", { precision: 15, scale: 2 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("draft"), // draft, submitted, approved, rejected
  priority: varchar("priority", { length: 20 }).notNull().default("medium"), // low, medium, high, urgent
  dueDate: timestamp("due_date"),
  approvedBy: uuid("approved_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// RFQ (Request for Quote) table
export const rfqs = pgTable("rfqs", {
  id: uuid("id").primaryKey().defaultRandom(),
  rfqNumber: varchar("rfq_number", { length: 50 }).notNull().unique(),
  purchaseRequestId: uuid("purchase_request_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("draft"), // draft, published, closed, awarded
  publishedAt: timestamp("published_at"),
  closingDate: timestamp("closing_date"),
  awardedVendorId: uuid("awarded_vendor_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Quotes table
export const quotes = pgTable("quotes", {
  id: uuid("id").primaryKey().defaultRandom(),
  rfqId: uuid("rfq_id").notNull(),
  vendorId: uuid("vendor_id").notNull(),
  price: decimal("price", { precision: 15, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 15, scale: 2 }).notNull(),
  leadTime: integer("lead_time").notNull(), // in days
  validity: integer("validity").notNull().default(30), // validity in days
  aiRank: integer("ai_rank"), // 1-based ranking by AI
  aiRecommendation: text("ai_recommendation"), // AI analysis
  status: varchar("status", { length: 20 }).notNull().default("submitted"), // submitted, accepted, rejected, awarded
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Purchase Orders table
export const purchaseOrders = pgTable("purchase_orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  poNumber: varchar("po_number", { length: 50 }).notNull().unique(),
  rfqId: uuid("rfq_id").notNull(),
  quoteId: uuid("quote_id").notNull(),
  vendorId: uuid("vendor_id").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 15, scale: 2 }).notNull(),
  totalAmount: decimal("total_amount", { precision: 15, scale: 2 }).notNull(),
  expectedDelivery: timestamp("expected_delivery"),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, confirmed, shipped, delivered, cancelled
  userId: uuid("user_id").notNull(),
  approvedBy: uuid("approved_by"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Activity Log table
export const activityLog = pgTable("activity_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  action: varchar("action", { length: 100 }).notNull(), // created_request, approved_order, etc.
  entityType: varchar("entity_type", { length: 50 }).notNull(), // request, order, rfq, etc.
  entityId: uuid("entity_id").notNull(),
  description: text("description"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  requests: many(purchaseRequests),
  orders: many(purchaseOrders),
  activities: many(activityLog),
}));

export const vendorsRelations = relations(vendors, ({ many }) => ({
  quotes: many(quotes),
  orders: many(purchaseOrders),
}));

export const purchaseRequestsRelations = relations(purchaseRequests, ({ one, many }) => ({
  user: one(users, {
    fields: [purchaseRequests.userId],
    references: [users.id],
  }),
  rfqs: many(rfqs),
}));

export const rfqsRelations = relations(rfqs, ({ one, many }) => ({
  request: one(purchaseRequests, {
    fields: [rfqs.purchaseRequestId],
    references: [purchaseRequests.id],
  }),
  quotes: many(quotes),
  orders: many(purchaseOrders),
}));

export const quotesRelations = relations(quotes, ({ one }) => ({
  rfq: one(rfqs, {
    fields: [quotes.rfqId],
    references: [rfqs.id],
  }),
  vendor: one(vendors, {
    fields: [quotes.vendorId],
    references: [vendors.id],
  }),
}));

export const purchaseOrdersRelations = relations(purchaseOrders, ({ one }) => ({
  rfq: one(rfqs, {
    fields: [purchaseOrders.rfqId],
    references: [rfqs.id],
  }),
  quote: one(quotes, {
    fields: [purchaseOrders.quoteId],
    references: [quotes.id],
  }),
  vendor: one(vendors, {
    fields: [purchaseOrders.vendorId],
    references: [vendors.id],
  }),
  user: one(users, {
    fields: [purchaseOrders.userId],
    references: [users.id],
  }),
}));

export const activityLogRelations = relations(activityLog, ({ one }) => ({
  user: one(users, {
    fields: [activityLog.userId],
    references: [users.id],
  }),
}));
