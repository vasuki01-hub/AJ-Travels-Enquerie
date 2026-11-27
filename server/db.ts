import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, portalSettings, travelRecords, users } from "../drizzle/schema";
import type { PortalSettings, TravelRecordInput } from "../shared/travel";
import { CURRENCIES } from "../shared/currencies";
import { DEFAULT_PORTAL_SETTINGS } from "../shared/travel";
import { ENV } from "./_core/env";

const VALID_CURRENCY_CODES = new Set(CURRENCIES.map(c => c.code));

let _db: ReturnType<typeof drizzle> | null = null;

/** Create a lazy database connection so local tooling can run without a DSN. */
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    for (const field of textFields) {
      if (user[field] !== undefined) {
        const value = user[field] ?? null;
        values[field] = value;
        updateSet[field] = value;
      }
    }
    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function normalizeTravelRow(row: typeof travelRecords.$inferSelect) {
  return {
    ...row,
    passengers: row.passengers ?? "",
    email: row.email ?? "",
    contactNo: row.contactNo ?? "",
    enquiryDate: row.enquiryDate ?? "",
    bookingDate: row.bookingDate ?? "",
    departureDate: row.departureDate ?? "",
    origin: row.origin ?? "",
    destination: row.destination ?? "",
    systemPnr: row.systemPnr ?? "",
    airlinePnr: row.airlinePnr ?? "",
    ticketNumber: row.ticketNumber ?? "",
    paymentDate: row.paymentDate ?? "",
    paymentMode: row.paymentMode ?? "",
    paymentStatus: row.paymentStatus as TravelRecordInput["paymentStatus"],
    issuedFrom: row.issuedFrom ?? "",
    remarks: row.remarks ?? "",
    customFields: parseJson<Record<string, string>>(row.customFields, {}),
  };
}

export async function listTravelRecords() {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db.select().from(travelRecords).orderBy(desc(travelRecords.updatedAt));
  return rows.map(normalizeTravelRow);
}

export async function getTravelRecordById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db.select().from(travelRecords).where(eq(travelRecords.id, id)).limit(1);
  const row = rows[0];
  return row ? normalizeTravelRow(row) : null;
}

export async function createTravelRecord(record: TravelRecordInput, createdBy?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.transaction(async tx => {
    if (record.recordType === "booking" && record.sourceEnquiryId) {
      const sourceRows = await tx.select().from(travelRecords).where(eq(travelRecords.id, record.sourceEnquiryId)).limit(1);
      const source = sourceRows[0];
      if (!source || source.recordType !== "enquiry" || source.status === "converted" || source.status === "lost") {
        throw new Error("This enquiry is no longer available to book");
      }
      const linked = await tx.select({ id: travelRecords.id }).from(travelRecords).where(eq(travelRecords.sourceEnquiryId, record.sourceEnquiryId)).limit(1);
      if (linked.length) throw new Error("This enquiry already has a booking");
    }
    const [result] = await tx.insert(travelRecords).values({
      ...record,
      enquiryDate: record.enquiryDate || null,
      bookingDate: record.bookingDate || null,
      departureDate: record.departureDate || null,
      paymentDate: record.paymentDate || null,
      customFields: JSON.stringify(record.customFields ?? {}),
      createdBy: createdBy ?? null,
    });
    const id = Number(result.insertId);
    if (record.recordType === "booking" && record.sourceEnquiryId) {
      await tx.update(travelRecords).set({ status: "converted" }).where(eq(travelRecords.id, record.sourceEnquiryId));
    }
    const rows = await tx.select().from(travelRecords).where(eq(travelRecords.id, id)).limit(1);
    const row = rows[0];
    if (!row) throw new Error("Travel record could not be loaded after creation");
    return normalizeTravelRow(row);
  });
}

export async function updateTravelRecord(id: number, record: TravelRecordInput) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(travelRecords).set({
    ...record,
    enquiryDate: record.enquiryDate || null,
    bookingDate: record.bookingDate || null,
    departureDate: record.departureDate || null,
    paymentDate: record.paymentDate || null,
    customFields: JSON.stringify(record.customFields ?? {}),
  }).where(eq(travelRecords.id, id));
  const rows = await db.select().from(travelRecords).where(eq(travelRecords.id, id)).limit(1);
  const row = rows[0];
  if (!row) return null;
  return normalizeTravelRow(row);
}

export async function deleteTravelRecord(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.transaction(async tx => {
    const rows = await tx.select().from(travelRecords).where(eq(travelRecords.id, id)).limit(1);
    const record = rows[0];
    if (record?.recordType === "booking" && record.sourceEnquiryId) {
      await tx.update(travelRecords).set({ status: "follow-up" }).where(and(
        eq(travelRecords.id, record.sourceEnquiryId),
        eq(travelRecords.recordType, "enquiry"),
        eq(travelRecords.status, "converted"),
      ));
    }
    await tx.delete(travelRecords).where(eq(travelRecords.id, id));
    return { success: true } as const;
  });
}

export async function getPortalSettings(): Promise<PortalSettings> {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db.select().from(portalSettings).where(eq(portalSettings.id, 1)).limit(1);
  const row = rows[0];
  if (!row) return DEFAULT_PORTAL_SETTINGS;
  return {
    agencyName: row.agencyName,
    logoUrl: row.logoUrl ?? "",
    currency: (VALID_CURRENCY_CODES.has(row.currency) ? row.currency : DEFAULT_PORTAL_SETTINGS.currency) as PortalSettings["currency"],
    accentColor: row.accentColor,
    modules: { ...DEFAULT_PORTAL_SETTINGS.modules, ...parseJson<Partial<PortalSettings["modules"]>>(row.modules, {}) },
    customFields: parseJson<PortalSettings["customFields"]>(row.customFields, []),
  };
}

export async function savePortalSettings(settings: PortalSettings): Promise<PortalSettings> {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const [existingSettings] = await db.select({ currency: portalSettings.currency }).from(portalSettings).where(eq(portalSettings.id, 1)).limit(1);
  const existingRecords = await db.select({ id: travelRecords.id }).from(travelRecords).limit(1);
  const currentCurrency = existingSettings?.currency ?? DEFAULT_PORTAL_SETTINGS.currency;
  if (existingRecords.length > 0 && settings.currency !== currentCurrency) {
    throw new Error("Currency cannot be changed once travel records exist. Existing fares are not converted automatically.");
  }
  await db.insert(portalSettings).values({
    id: 1,
    agencyName: settings.agencyName,
    logoUrl: settings.logoUrl || null,
    currency: settings.currency,
    accentColor: settings.accentColor,
    modules: JSON.stringify(settings.modules),
    customFields: JSON.stringify(settings.customFields),
  }).onDuplicateKeyUpdate({
    set: {
      agencyName: settings.agencyName,
      logoUrl: settings.logoUrl || null,
      currency: settings.currency,
      accentColor: settings.accentColor,
      modules: JSON.stringify(settings.modules),
      customFields: JSON.stringify(settings.customFields),
    },
  });
  return settings;
}
