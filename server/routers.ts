import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";

const nullableDate = z.string().max(10).optional().default("");
const recordSchema = z.object({
  recordType: z.enum(["enquiry", "booking"]),
  status: z.string().min(1).max(32),
  customerName: z.string().trim().min(1).max(240),
  passengers: z.string().max(10000).optional().default(""),
  email: z.string().max(320).optional().default(""),
  contactNo: z.string().max(64).optional().default(""),
  enquiryDate: nullableDate,
  bookingDate: nullableDate,
  departureDate: nullableDate,
  origin: z.string().max(120).optional().default(""),
  destination: z.string().max(120).optional().default(""),
  systemPnr: z.string().max(80).optional().default(""),
  airlinePnr: z.string().max(80).optional().default(""),
  ticketNumber: z.string().max(100).optional().default(""),
  sourceEnquiryId: z.number().int().positive().nullable().optional().default(null),
  adultCount: z.number().int().min(0).max(100).default(1),
  youthCount: z.number().int().min(0).max(100).default(0),
  childCount: z.number().int().min(0).max(100).default(0),
  infantCount: z.number().int().min(0).max(100).default(0),
  netFare: z.number().finite().default(0),
  netFareAdult: z.number().finite().default(0),
  netFareYouth: z.number().finite().default(0),
  netFareChild: z.number().finite().default(0),
  netFareInfant: z.number().finite().default(0),
  totalNet: z.number().finite().default(0),
  quotedFare: z.number().finite().default(0),
  clientFareAdult: z.number().finite().default(0),
  clientFareYouth: z.number().finite().default(0),
  clientFareChild: z.number().finite().default(0),
  clientFareInfant: z.number().finite().default(0),
  totalFareQuoted: z.number().finite().default(0),
  profit: z.number().finite().default(0),
  receivedPayment: z.number().finite().default(0),
  paymentStatus: z.enum(["pending", "partially_paid", "paid"]).default("pending"),
  paymentDate: nullableDate,
  paymentMode: z.string().max(64).optional().default(""),
  issuedFrom: z.string().max(120).optional().default(""),
  remarks: z.string().max(10000).optional().default(""),
  customFields: z.record(z.string(), z.string()).optional().default({}),
});

const customFieldSchema = z.object({
  id: z.string().min(1).max(50),
  label: z.string().trim().min(1).max(80),
  type: z.enum(["text", "number", "date"]),
  enabled: z.boolean(),
});

const settingsSchema = z.object({
  agencyName: z.string().trim().min(1).max(160),
  logoUrl: z.string().max(2000).refine(value => !value || /^https:\/\//i.test(value), "Logo URL must be HTTPS"),
  currency: z.enum(["GBP", "EUR", "USD"]),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  modules: z.object({
    dashboard: z.boolean(), enquiries: z.boolean(), bookings: z.boolean(), reports: z.boolean(),
  }),
  customFields: z.array(customFieldSchema).max(40),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  travel: router({
    list: protectedProcedure.query(() => db.listTravelRecords()),
    create: protectedProcedure.input(recordSchema).mutation(({ ctx, input }) =>
      db.createTravelRecord(input, ctx.user.id),
    ),
    update: protectedProcedure.input(z.object({ id: z.number().int().positive(), data: recordSchema }))
      .mutation(({ input }) => db.updateTravelRecord(input.id, input.data)),
    remove: protectedProcedure.input(z.object({ id: z.number().int().positive() }))
      .mutation(({ input }) => db.deleteTravelRecord(input.id)),
    settings: protectedProcedure.query(() => db.getPortalSettings()),
    saveSettings: protectedProcedure.input(settingsSchema).mutation(({ input }) =>
      db.savePortalSettings(input),
    ),
  }),
});

export type AppRouter = typeof appRouter;
