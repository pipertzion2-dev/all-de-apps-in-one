/** Payment links while Stripe account verification or product seeding is pending. */

export type InterimPaymentConfig = {
  stripePaymentLinkPro: string | null;
  stripePaymentLinkEnterprise: string | null;
  paypalUrl: string | null;
  venmoUrl: string | null;
  note: string | null;
};

export type InterimPaymentPublic = InterimPaymentConfig & {
  active: boolean;
  /** True when embedded checkout is unlikely to work (no price IDs). */
  checkoutUnavailable: boolean;
};

const DEFAULT_NOTE =
  "After you pay, email your receipt to hello@zzaizzai.com — we'll activate Pro within a few hours (or use your access code once we confirm).";

function trimUrl(v: string | null | undefined): string | null {
  const t = v?.trim();
  if (!t) return null;
  if (!/^https?:\/\//i.test(t)) return null;
  return t;
}

function fromEnv(): InterimPaymentConfig {
  return {
    stripePaymentLinkPro: trimUrl(process.env.INTERIM_STRIPE_PAYMENT_LINK_PRO),
    stripePaymentLinkEnterprise: trimUrl(process.env.INTERIM_STRIPE_PAYMENT_LINK_ENTERPRISE),
    paypalUrl: trimUrl(process.env.INTERIM_PAYPAL_URL),
    venmoUrl: trimUrl(process.env.INTERIM_VENMO_URL),
    note: process.env.INTERIM_PAYMENT_NOTE?.trim() || null,
  };
}

export function mergeInterimPaymentConfig(
  db: Partial<InterimPaymentConfig> | null | undefined,
): InterimPaymentConfig {
  const env = fromEnv();
  return {
    stripePaymentLinkPro: trimUrl(db?.stripePaymentLinkPro) ?? env.stripePaymentLinkPro,
    stripePaymentLinkEnterprise:
      trimUrl(db?.stripePaymentLinkEnterprise) ?? env.stripePaymentLinkEnterprise,
    paypalUrl: trimUrl(db?.paypalUrl) ?? env.paypalUrl,
    venmoUrl: trimUrl(db?.venmoUrl) ?? env.venmoUrl,
    note: db?.note?.trim() || env.note || DEFAULT_NOTE,
  };
}

export function isInterimPaymentActive(config: InterimPaymentConfig): boolean {
  return Boolean(
    config.stripePaymentLinkPro ||
    config.stripePaymentLinkEnterprise ||
    config.paypalUrl ||
    config.venmoUrl,
  );
}

export function toPublicInterimPayments(
  config: InterimPaymentConfig,
  opts?: { checkoutUnavailable?: boolean },
): InterimPaymentPublic {
  return {
    ...config,
    note: config.note || DEFAULT_NOTE,
    active: isInterimPaymentActive(config),
    checkoutUnavailable: opts?.checkoutUnavailable ?? false,
  };
}
