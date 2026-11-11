export type RecordType = "enquiry" | "booking";
export type PaymentStatus = "pending" | "partially_paid" | "paid";

export type TravelStatus =
  | "new"
  | "contacted"
  | "quoted"
  | "follow-up"
  | "converted"
  | "lost"
  | "confirmed"
  | "ticketed"
  | "completed"
  | "cancelled";

export type CurrencyCode = string;

export interface TravelRecordInput {
  recordType: RecordType;
  status: TravelStatus | string;
  customerName: string;
  passengers: string;
  email: string;
  contactNo: string;
  enquiryDate: string;
  bookingDate: string;
  departureDate: string;
  origin: string;
  destination: string;
  systemPnr: string;
  airlinePnr: string;
  ticketNumber: string;
  sourceEnquiryId: number | null;
  adultCount: number;
  youthCount: number;
  childCount: number;
  infantCount: number;
  netFare: number;
  netFareAdult: number;
  netFareYouth: number;
  netFareChild: number;
  netFareInfant: number;
  totalNet: number;
  quotedFare: number;
  clientFareAdult: number;
  clientFareYouth: number;
  clientFareChild: number;
  clientFareInfant: number;
  totalFareQuoted: number;
  profit: number;
  receivedPayment: number;
  paymentStatus: PaymentStatus;
  paymentDate: string;
  paymentMode: string;
  issuedFrom: string;
  remarks: string;
  customFields: Record<string, string>;
  followUpDate: string;
}

export interface TravelRecord extends TravelRecordInput {
  id: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomField {
  id: string;
  label: string;
  type: "text" | "number" | "date";
  enabled: boolean;
}

export interface PortalSettings {
  agencyName: string;
  logoUrl: string;
  currency: string;
  accentColor: string;
  modules: {
    dashboard: boolean;
    enquiries: boolean;
    bookings: boolean;
    reports: boolean;
  };
  customFields: CustomField[];
}

export const DEFAULT_PORTAL_SETTINGS: PortalSettings = {
  agencyName: "AJ Tours & Travel",
  logoUrl: "",
  currency: "GBP",
  accentColor: "#1677E8",
  modules: { dashboard: true, enquiries: true, bookings: true, reports: true },
  customFields: [],
};

export const DEFAULT_RECORD: TravelRecordInput = {
  recordType: "enquiry",
  status: "new",
  customerName: "",
  passengers: "",
  email: "",
  contactNo: "",
  enquiryDate: "",
  bookingDate: "",
  departureDate: "",
  origin: "",
  destination: "",
  systemPnr: "",
  airlinePnr: "",
  ticketNumber: "",
  sourceEnquiryId: null,
  adultCount: 1,
  youthCount: 0,
  childCount: 0,
  infantCount: 0,
  netFare: 0,
  netFareAdult: 0,
  netFareYouth: 0,
  netFareChild: 0,
  netFareInfant: 0,
  totalNet: 0,
  quotedFare: 0,
  clientFareAdult: 0,
  clientFareYouth: 0,
  clientFareChild: 0,
  clientFareInfant: 0,
  totalFareQuoted: 0,
  profit: 0,
  receivedPayment: 0,
  paymentStatus: "pending",
  paymentDate: "",
  paymentMode: "",
  issuedFrom: "",
  remarks: "",
  customFields: {},
  followUpDate: "",
};

// ─── New shared types for audit, status history, follow-ups, documents ───

export interface AuditLogEntry {
  id: number;
  userId: number;
  action: "create" | "update" | "delete" | "login" | "status_change";
  entityType: "enquiry" | "booking" | "user" | "settings";
  entityId: number | null;
  details: string | null;
  createdAt: Date;
}

export interface StatusHistoryEntry {
  id: number;
  recordId: number;
  fromStatus: string;
  toStatus: string;
  changedBy: number;
  createdAt: Date;
}

export interface FollowUpReminder {
  id: number;
  recordId: number;
  userId: number;
  dueDate: string;
  notes: string | null;
  completed: boolean;
  createdAt: Date;
}

export interface Document {
  id: number;
  recordId: number;
  userId: number;
  fileName: string;
  fileUrl: string;
  fileType: string;
  uploadedAt: Date;
}
