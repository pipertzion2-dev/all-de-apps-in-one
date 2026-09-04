export type SettlementStatus = "pending" | "paid" | "received" | "settled";

export type PaymentMethod = "cashapp" | "venmo" | "zelle" | "paypal";

export type PaymentProfile = {
  method: PaymentMethod;
  handle: string;
};

export type ShowAttendee = {
  id: string;
  name: string;
  paidCents: number;
  checkedIn: boolean;
  checkedInAt?: string;
  settlementStatus: SettlementStatus;
  contactEmail?: string;
  contactPhone?: string;
  payment?: PaymentProfile;
};

export type ShowEvent = {
  id: string;
  title: string;
  venue?: string;
  eventDate: string;
  totalCostCents: number;
  attendees: ShowAttendee[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
  hostPayment?: PaymentProfile;
  transferSettlements?: Record<
    string,
    { status: SettlementStatus; paidAt?: string; method?: PaymentMethod }
  >;
};

export type AttendeeBalance = {
  attendeeId: string;
  name: string;
  fairShareCents: number;
  paidCents: number;
  netCents: number;
  role: "receive" | "give" | "even";
};

export type SettlementTransfer = {
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  amountCents: number;
};

export type ShowDivvySummary = {
  headcount: number;
  checkedInCount: number;
  totalCostCents: number;
  fairShareCents: number;
  totalPaidCents: number;
  balances: AttendeeBalance[];
  transfers: SettlementTransfer[];
};
