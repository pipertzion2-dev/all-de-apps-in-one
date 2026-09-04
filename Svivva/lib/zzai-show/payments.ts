export type PaymentMethod = "cashapp" | "venmo" | "zelle" | "paypal";

export type PaymentProfile = {
  method: PaymentMethod;
  /** Cash App $tag, Venmo username, PayPal.me slug, or Zelle email/phone. */
  handle: string;
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  cashapp: "Cash App",
  venmo: "Venmo",
  zelle: "Zelle",
  paypal: "PayPal",
};

function normalizeHandle(method: PaymentMethod, handle: string): string {
  const h = handle.trim();
  if (!h) return "";
  if (method === "cashapp") return h.replace(/^\$/, "");
  if (method === "venmo") return h.replace(/^@/, "");
  if (method === "paypal") return h.replace(/^@/, "").split("/").pop() || h;
  return h;
}

function amountForUrl(cents: number): string {
  return (cents / 100).toFixed(2);
}

function amountLabel(cents: number): string {
  return `$${amountForUrl(cents)}`;
}

export function buildPaymentLink(input: {
  profile: PaymentProfile;
  amountCents: number;
  note?: string;
}): string | null {
  const { profile, amountCents, note } = input;
  if (amountCents <= 0) return null;
  const handle = normalizeHandle(profile.method, profile.handle);
  if (!handle) return null;
  const amount = amountForUrl(amountCents);
  const encodedNote = encodeURIComponent(note?.slice(0, 120) || "ZZAI ZZAI Show");

  switch (profile.method) {
    case "cashapp":
      return `https://cash.app/$${handle}/${amount}`;
    case "venmo":
      return `https://venmo.com/?txn=pay&audience=private&amount=${amount}&note=${encodedNote}&recipients=${encodeURIComponent(handle)}`;
    case "paypal":
      return `https://paypal.me/${encodeURIComponent(handle)}/${amount}`;
    case "zelle":
      return null;
    default:
      return null;
  }
}

export function zellePayInstructions(input: {
  profile: PaymentProfile;
  amountCents: number;
  note?: string;
}): string {
  const amount = amountLabel(input.amountCents);
  const handle = normalizeHandle("zelle", input.profile.handle);
  return `Send ${amount} via Zelle to ${handle}${input.note ? ` — ${input.note}` : ""}`;
}

export function transferKey(fromId: string, toId: string): string {
  return `${fromId}->${toId}`;
}
