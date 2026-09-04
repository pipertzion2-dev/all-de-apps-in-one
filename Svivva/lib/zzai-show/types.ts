export type SettlementStatus = "pending" | "paid" | "received" | "settled";

export type ShowAttendee = {
  id: string;
  name: string;
  /** Amount this person already paid upfront (cents). */
  paidCents: number;
  checkedIn: boolean;
  checkedInAt?: string;
  /** Outgoing settlement status when this person owes someone. */
  settlementStatus: SettlementStatus;
};

export type ShowEvent = {
  id: string;
  title: string;
  venue?: string;
  eventDate: string;
  /** Total event cost to split (cents). */
  totalCostCents: number;
  attendees: ShowAttendee[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type AttendeeBalance = {
  attendeeId: string;
  name: string;
  fairShareCents: number;
  paidCents: number;
  /** Positive = should receive, negative = should give. */
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
