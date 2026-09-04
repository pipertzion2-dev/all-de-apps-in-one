import type { AttendeeBalance, SettlementTransfer, ShowAttendee, ShowDivvySummary } from "./types";

function roundCents(n: number): number {
  return Math.round(n);
}

/** Split cost evenly across checked-in attendees (or all if none checked in). */
export function computeDivvy(
  attendees: ShowAttendee[],
  totalCostCents: number,
): ShowDivvySummary {
  const checkedIn = attendees.filter((a) => a.checkedIn);
  const splitPool = checkedIn.length > 0 ? checkedIn : attendees;
  const headcount = attendees.length;
  const checkedInCount = checkedIn.length;
  const splitCount = Math.max(splitPool.length, 1);
  const fairShareCents = roundCents(totalCostCents / splitCount);

  const balances: AttendeeBalance[] = splitPool.map((a) => {
    const netCents = a.paidCents - fairShareCents;
    return {
      attendeeId: a.id,
      name: a.name,
      fairShareCents,
      paidCents: a.paidCents,
      netCents,
      role: netCents > 0 ? "receive" : netCents < 0 ? "give" : "even",
    };
  });

  const totalPaidCents = splitPool.reduce((sum, a) => sum + a.paidCents, 0);
  const transfers = simplifySettlements(balances);

  return {
    headcount,
    checkedInCount,
    totalCostCents,
    fairShareCents,
    totalPaidCents,
    balances,
    transfers,
  };
}

/** Greedy minimum transfers: debtors pay creditors until balanced. */
export function simplifySettlements(balances: AttendeeBalance[]): SettlementTransfer[] {
  type Node = { id: string; name: string; amount: number };
  const creditors: Node[] = balances
    .filter((b) => b.netCents > 0)
    .map((b) => ({ id: b.attendeeId, name: b.name, amount: b.netCents }))
    .sort((a, b) => b.amount - a.amount);

  const debtors: Node[] = balances
    .filter((b) => b.netCents < 0)
    .map((b) => ({ id: b.attendeeId, name: b.name, amount: -b.netCents }))
    .sort((a, b) => b.amount - a.amount);

  const transfers: SettlementTransfer[] = [];
  let ci = 0;
  let di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const pay = Math.min(creditors[ci].amount, debtors[di].amount);
    if (pay > 0) {
      transfers.push({
        fromId: debtors[di].id,
        fromName: debtors[di].name,
        toId: creditors[ci].id,
        toName: creditors[ci].name,
        amountCents: pay,
      });
    }
    creditors[ci].amount -= pay;
    debtors[di].amount -= pay;
    if (creditors[ci].amount <= 0) ci++;
    if (debtors[di].amount <= 0) di++;
  }

  return transfers;
}

export function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export function parseDollarsToCents(input: string): number {
  const n = parseFloat(input.replace(/[^0-9.-]/g, ""));
  if (!Number.isFinite(n) || n < 0) return 0;
  return roundCents(n * 100);
}
