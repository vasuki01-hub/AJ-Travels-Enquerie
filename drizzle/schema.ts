import {
  boolean,
  date,
  double,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

/** Core user table backing Manus OAuth. */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  /** Bcrypt-hashed password for local auth (nullable for OAuth-only users). */
  password: varchar("password", { length: 255 }),
  /** Permanent employee ID generated via nanoid. */
  uid: varchar("uid", { length: 32 }).notNull().unique(),
  /** Organisational rank, e.g. "employee", "senior", "manager". */
  rank: varchar("rank", { length: 64 }).default("employee"),
  /** Admin can deactivate a user without deleting their data. */
  isActive: boolean("isActive").default(true),
  /** User's preferred currency code for display. */
  currencyCode: varchar("currencyCode", { length: 8 }).default("GBP"),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/** One operational record represents either a lead enquiry or a confirmed travel booking. */
export const travelRecords = mysqlTable("travel_records", {
  id: int("id").autoincrement().primaryKey(),
  recordType: mysqlEnum("recordType", ["enquiry", "booking"]).default("enquiry").notNull(),
  status: varchar("status", { length: 32 }).default("new").notNull(),
  sourceEnquiryId: int("sourceEnquiryId"),
  customerName: varchar("customerName", { length: 240 }).notNull(),
  passengers: text("passengers"),
  email: varchar("email", { length: 320 }),
  contactNo: varchar("contactNo", { length: 64 }),
  enquiryDate: date("enquiryDate", { mode: "string" }),
  bookingDate: date("bookingDate", { mode: "string" }),
  departureDate: date("departureDate", { mode: "string" }),
  origin: varchar("origin", { length: 120 }),
  destination: varchar("destination", { length: 120 }),
  systemPnr: varchar("systemPnr", { length: 80 }),
  airlinePnr: varchar("airlinePnr", { length: 80 }),
  ticketNumber: varchar("ticketNumber", { length: 100 }),
  adultCount: int("adultCount").default(1).notNull(),
  youthCount: int("youthCount").default(0).notNull(),
  childCount: int("childCount").default(0).notNull(),
  infantCount: int("infantCount").default(0).notNull(),
  netFare: double("netFare").default(0).notNull(),
  netFareAdult: double("netFareAdult").default(0).notNull(),
  netFareYouth: double("netFareYouth").default(0).notNull(),
  netFareChild: double("netFareChild").default(0).notNull(),
  netFareInfant: double("netFareInfant").default(0).notNull(),
  totalNet: double("totalNet").default(0).notNull(),
  quotedFare: double("quotedFare").default(0).notNull(),
  clientFareAdult: double("clientFareAdult").default(0).notNull(),
  clientFareYouth: double("clientFareYouth").default(0).notNull(),
  clientFareChild: double("clientFareChild").default(0).notNull(),
  clientFareInfant: double("clientFareInfant").default(0).notNull(),
  totalFareQuoted: double("totalFareQuoted").default(0).notNull(),
  profit: double("profit").default(0).notNull(),
  receivedPayment: double("receivedPayment").default(0).notNull(),
  paymentStatus: varchar("paymentStatus", { length: 24 }).default("pending").notNull(),
  paymentDate: date("paymentDate", { mode: "string" }),
  paymentMode: varchar("paymentMode", { length: 64 }),
  issuedFrom: varchar("issuedFrom", { length: 120 }),
  remarks: text("remarks"),
  customFields: text("customFields"),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  /** User ID this record is assigned to. */
  assignedTo: int("assignedTo"),
  /** Scheduled follow-up date. */
  followUpDate: date("followUpDate", { mode: "string" }),
}, table => ({ sourceEnquiryUnique: uniqueIndex("travel_records_source_enquiry_id_unique").on(table.sourceEnquiryId) }));

export type TravelRecord = typeof travelRecords.$inferSelect;
export type InsertTravelRecord = typeof travelRecords.$inferInsert;

/** One-row settings document; feature flags and custom fields are JSON-encoded. */
export const portalSettings = mysqlTable("portal_settings", {
  id: int("id").autoincrement().primaryKey(),
  agencyName: varchar("agencyName", { length: 160 }).default("AJ Tours & Travel").notNull(),
  logoUrl: text("logoUrl"),
  currency: varchar("currency", { length: 8 }).default("GBP").notNull(),
  accentColor: varchar("accentColor", { length: 16 }).default("#1677E8").notNull(),
  modules: text("modules"),
  customFields: text("customFields"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PortalSettingsRow = typeof portalSettings.$inferSelect;
export type InsertPortalSettings = typeof portalSettings.$inferInsert;

/** Audit trail of every significant user action in the portal. */
export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  /** User who performed the action. */
  userId: int("userId").notNull(),
  /** Action verb: create, update, delete, login, status_change. */
  action: varchar("action", { length: 32 }).notNull(),
  /** Entity kind the action targeted. */
  entityType: varchar("entityType", { length: 32 }).notNull(),
  /** Primary key of the affected entity, if applicable. */
  entityId: int("entityId"),
  /** Additional context stored as JSON. */
  details: text("details"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

/** Tracks every status transition on a travel record. */
export const statusHistory = mysqlTable("status_history", {
  id: int("id").autoincrement().primaryKey(),
  /** The travel record whose status changed. */
  recordId: int("recordId").notNull(),
  fromStatus: varchar("fromStatus", { length: 32 }).notNull(),
  toStatus: varchar("toStatus", { length: 32 }).notNull(),
  /** User who made the change. */
  changedBy: int("changedBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StatusHistory = typeof statusHistory.$inferSelect;
export type InsertStatusHistory = typeof statusHistory.$inferInsert;

/** Follow-up reminders linked to travel records and assigned to users. */
export const followUpReminders = mysqlTable("follow_up_reminders", {
  id: int("id").autoincrement().primaryKey(),
  /** The travel record this reminder is about. */
  recordId: int("recordId").notNull(),
  /** User who should act on this reminder. */
  userId: int("userId").notNull(),
  dueDate: date("dueDate", { mode: "string" }).notNull(),
  notes: text("notes"),
  completed: boolean("completed").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FollowUpReminder = typeof followUpReminders.$inferSelect;
export type InsertFollowUpReminder = typeof followUpReminders.$inferInsert;

/** Documents (files) uploaded against a travel record. */
export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  /** Travel record this document belongs to. */
  recordId: int("recordId").notNull(),
  /** User who uploaded the document. */
  userId: int("userId").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileType: varchar("fileType", { length: 64 }).notNull(),
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;
